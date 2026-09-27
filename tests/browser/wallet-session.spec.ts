import { test, expect, type Page } from "@playwright/test";
import { nativeToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { ShieldedCoinPublicKey } from "@midnight-ntwrk/wallet-sdk-address-format";

type WalletProbe = { calls: number; reads: number; mode: string; dustFails: boolean; night: string; dust: string; shieldedReads: number; recoveryMode: string };
async function fixture(page: Page) {
  await page.addInitScript(({asset, coin}) => {
    const probe: WalletProbe = { calls: 0, reads: 0, mode: "ready", dustFails: true, night: "1234567", dust: "1", shieldedReads: 0, recoveryMode: "ready" };
    Object.assign(window, { walletProbe: probe, midnight: { synthetic: {
      name: "1AM", rdns: "com.midnight.1am", apiVersion: "4.0.1", icon: "",
      connect: async () => { probe.calls++; return {
        getConnectionStatus: async () => {
          probe.reads++;
          if (probe.mode === "offline") throw new Error("Synthetic unavailable transport");
          return probe.mode === "revoked" ? { status: "disconnected" } : { status: "connected", networkId: "preprod" };
        },
        getConfiguration: async () => ({ networkId: "preprod" }),
        getUnshieldedAddress: async () => ({ unshieldedAddress: probe.mode === "changed" ? "synthetic-other-account" : "synthetic-account" }),
        getUnshieldedBalances: async () => ({[asset]:BigInt(probe.night)}),
        getShieldedAddresses: async () => {
          probe.shieldedReads++;
          if (probe.recoveryMode === "stalled") return new Promise(() => {});
          if (probe.recoveryMode === "offline" || (probe.recoveryMode === "first-fails" && probe.shieldedReads === 1)) throw new Error("Synthetic identity not ready");
          return { shieldedCoinPublicKey: coin };
        },
        getDustBalance: async () => { if (probe.dustFails) throw new Error("Synthetic balance not ready"); return { balance: BigInt(probe.dust), cap:99999999999999999n }; },
      }; },
    } } });
  }, {asset: nativeToken().raw, coin: ShieldedCoinPublicKey.codec.encode("preprod", ShieldedCoinPublicKey.fromHexString("01".repeat(32))).asString()});
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as {walletProbe:WalletProbe}).walletProbe);
async function mode(page: Page, value: string) {
  await page.evaluate(value => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.mode = value; window.dispatchEvent(new Event("focus")); }, value);
}
async function connect(page: Page) {
  await page.getByRole("button", {name:"Connect Wallet"}).click();
  await page.getByRole("button", {name:"1AM",exact:true}).click();
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toBeVisible();
}

test("recovery retries initial wallet failure and unlocks without ledger WebAssembly or another connection", async ({page}) => {
  await fixture(page);
  await page.route(/\.wasm(?:\?|$)/, route => route.abort());
  await page.goto("/");
  await page.evaluate(() => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.recoveryMode = "first-fails"; });
  await connect(page);
  await expect(page.getByRole("button", {name:"Use recovery passphrase instead"})).toBeVisible({timeout:15_000});
  await expect(page.getByLabel("Total NIGHT", {exact:true})).toHaveText("1.234567");
  await page.getByRole("button", {name:"Use recovery passphrase instead"}).click();
  await page.getByLabel("Local recovery passphrase", {exact:true}).fill("synthetic7");
  await page.getByRole("button", {name:"Secure MoneyMole",exact:true}).click();
  await expect(page.getByLabel("Escrow address", {exact:true})).toBeVisible();
  expect((await probe(page)).calls).toBe(1);
  expect((await probe(page)).shieldedReads).toBe(2);
});

test("stalled recovery stops retrying and can resume on the same authorized session", async ({page}) => {
  await fixture(page); await page.clock.install(); await page.goto("/");
  await page.evaluate(() => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.recoveryMode = "stalled"; });
  await connect(page);
  await expect.poll(async () => (await probe(page)).shieldedReads).toBe(1);
  await page.clock.runFor(28_000);
  await expect(page.getByRole("button", {name:"Retry local recovery"})).toBeVisible();
  expect((await probe(page)).shieldedReads).toBe(3);
  await page.clock.runFor(60_000);
  expect((await probe(page)).shieldedReads).toBe(3);
  await page.evaluate(() => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.recoveryMode = "ready"; });
  await page.getByRole("button", {name:"Retry local recovery"}).click();
  await expect(page.getByRole("button", {name:"Use recovery passphrase instead"})).toBeVisible();
  expect((await probe(page)).calls).toBe(1);
});

test("temporary failures and minutes of polling retain one authorized session", async ({page}) => {
  await fixture(page); await page.clock.install(); await page.goto("/"); await connect(page);
  await expect(page.locator(".connection-status")).toContainText("Balance temporarily unavailable");
  await mode(page, "offline");
  await expect(page.locator(".connection-status")).toContainText("Connection retained");
  await page.clock.runFor(180_000);
  expect((await probe(page)).reads).toBeGreaterThanOrEqual(14);
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toBeVisible();
  await page.evaluate(() => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.dustFails = false; });
  await mode(page, "ready");
  await expect(page.getByLabel("Total DUST", {exact:true})).toHaveText("0.000000000000001");
  expect((await probe(page)).calls).toBe(1);
  await mode(page, "revoked");
  await expect(page.locator(".connection-status")).toContainText("invalidated");
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toHaveCount(0);
  await page.clock.fastForward(60_000); expect((await probe(page)).calls).toBe(1);
});
test("totals refresh while records stay locked, without reauthorization", async ({page}) => {
  await fixture(page); await page.clock.install(); await page.goto("/"); await connect(page);
  await expect(page.getByLabel("Total NIGHT",{exact:true})).toHaveText("1.234567");
  await expect(page.getByLabel("Total DUST",{exact:true})).toHaveText("Unavailable");
  await page.evaluate(() => {
    const p=(window as unknown as {walletProbe:WalletProbe}).walletProbe;
    p.night="0";p.dust="1234567890123456";p.dustFails=false;
  });
  await page.clock.runFor(15_000);
  await expect(page.getByLabel("Total NIGHT",{exact:true})).toHaveText("0");
  await expect(page.getByLabel("Total DUST",{exact:true})).toHaveText("1.234567890123456");
  await page.evaluate(() => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.night="9007199254740993123456"; window.dispatchEvent(new Event("focus")); });
  await expect(page.getByLabel("Total NIGHT",{exact:true})).toHaveText("9007199254740993.123456");
  expect((await probe(page)).calls).toBe(1);
  await expect(page.getByRole("button",{name:"Save payment draft"})).toHaveCount(0);
  await page.getByRole("button",{name:"Disconnect",exact:true}).click();
  await expect(page.getByLabel("Total NIGHT",{exact:true})).toHaveCount(0);
});

test("Connect discovers both wallets and authorizes only the selected provider", async ({page}) => {
  await fixture(page);
  await page.addInitScript(() => {
    const registry=(window as unknown as {midnight:Record<string, {name:string;rdns:string;connect:()=>Promise<unknown>}>}).midnight;
    const first=registry.synthetic!;
    registry.opaqueLace={...first,name:"Lace",rdns:"io.lace.wallet"};
  });
  await page.goto("/");
  await expect(page.getByRole("button",{name:"Check for 1AM"})).toHaveCount(0);
  await page.getByRole("button",{name:"Connect Wallet",exact:true}).click();
  await expect(page.getByRole("button",{name:"1AM",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Lace",exact:true})).toBeVisible();
  expect((await probe(page)).calls).toBe(0);
  await page.getByRole("button",{name:"Lace",exact:true}).click();
  await expect(page.locator(".card-connection")).toHaveText("Lace connected");
  expect((await probe(page)).calls).toBe(1);
});

test("Connect can rediscover a late wallet injection", async ({page}) => {
  await page.goto("/");
  await page.getByRole("button",{name:"Connect Wallet",exact:true}).click();
  await expect(page.locator(".connection-status")).toContainText("No supported wallet found");
  await page.evaluate(() => Object.assign(window,{midnight:{late:{name:"1AM",rdns:"com.midnight.1am",apiVersion:"4.0.1",icon:"",connect:async()=>{throw {code:"Rejected"};}}}}));
  await page.getByRole("button",{name:"Refresh wallets",exact:true}).click();
  await expect(page.getByRole("button",{name:"1AM",exact:true})).toBeEnabled();
});
test("client navigation retains authorization; disconnect and reload never prompt automatically", async ({page}) => {
  await fixture(page); await page.goto("/claim"); await connect(page);
  await page.getByRole("link", {name:"MoneyMole home"}).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toBeVisible();
  expect((await probe(page)).calls).toBe(1);
  await page.getByRole("button", {name:"Disconnect",exact:true}).click();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  expect((await probe(page)).calls).toBe(1);
  await page.reload(); expect((await probe(page)).calls).toBe(0);
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toHaveCount(0);
});
test("switching wallet accounts invalidates the old payment workspace", async ({page}) => {
  await fixture(page); await page.goto("/"); await connect(page);
  await expect(page.locator(".connection-status")).toContainText("Balance temporarily unavailable");
  await mode(page, "changed");
  await expect(page.getByRole("button", {name:"Unlock payment workspace"})).toHaveCount(0);
  await expect(page.locator(".connection-status")).toContainText("invalidated");
});
