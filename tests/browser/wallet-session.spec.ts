import { test, expect, type Page } from "@playwright/test";
import { nativeToken } from "@midnight-ntwrk/midnight-js-protocol/ledger";

type WalletProbe = { calls: number; reads: number; mode: string; dustFails: boolean; night: string; dust: string };
async function fixture(page: Page) {
  await page.addInitScript(asset => {
    const probe: WalletProbe = { calls: 0, reads: 0, mode: "ready", dustFails: true, night: "1234567", dust: "1" };
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
        getDustBalance: async () => { if (probe.dustFails) throw new Error("Synthetic balance not ready"); return { balance: BigInt(probe.dust), cap:99999999999999999n }; },
      }; },
    } } });
  }, nativeToken().raw);
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as {walletProbe:WalletProbe}).walletProbe);
async function mode(page: Page, value: string) {
  await page.evaluate(value => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.mode = value; window.dispatchEvent(new Event("focus")); }, value);
}
async function connect(page: Page) {
  await page.getByRole("button", {name:"Connect"}).click();
  await page.getByRole("button", {name:"1AM",exact:true}).click();
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toBeVisible();
}

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
  await expect(page.getByRole("button",{name:"Unlock payment workspace"})).toBeDisabled();
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
  await page.getByRole("button",{name:"Connect",exact:true}).click();
  await expect(page.getByRole("button",{name:"1AM",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Lace",exact:true})).toBeVisible();
  expect((await probe(page)).calls).toBe(0);
  await page.getByRole("button",{name:"Lace",exact:true}).click();
  await expect(page.locator(".card-connection")).toHaveText("Lace connected");
  expect((await probe(page)).calls).toBe(1);
});

test("Connect can rediscover a late wallet injection", async ({page}) => {
  await page.goto("/");
  await page.getByRole("button",{name:"Connect",exact:true}).click();
  await expect(page.locator(".connection-status")).toContainText("No supported wallet found");
  await page.evaluate(() => Object.assign(window,{midnight:{late:{name:"1AM",rdns:"com.midnight.1am",apiVersion:"4.0.1",icon:"",connect:async()=>{throw {code:"Rejected"};}}}}));
  await page.getByRole("button",{name:"Connect",exact:true}).click();
  await expect(page.getByRole("button",{name:"1AM",exact:true})).toBeVisible();
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
