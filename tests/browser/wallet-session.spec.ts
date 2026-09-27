import { test, expect, type Page } from "@playwright/test";

type WalletProbe = { calls: number; reads: number; mode: string; dustFails: boolean };
async function fixture(page: Page) {
  await page.addInitScript(() => {
    const probe: WalletProbe = { calls: 0, reads: 0, mode: "ready", dustFails: true };
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
        getDustBalance: async () => { if (probe.dustFails) throw new Error("Synthetic balance not ready"); return { balance: 1n }; },
      }; },
    } } });
  });
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as {walletProbe:WalletProbe}).walletProbe);
async function mode(page: Page, value: string) {
  await page.evaluate(value => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.mode = value; window.dispatchEvent(new Event("focus")); }, value);
}
async function connect(page: Page) {
  await page.getByRole("button", {name:"Check for 1AM"}).click();
  await page.getByRole("button", {name:"Connect 1AM",exact:true}).click();
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toBeVisible();
}

test("temporary failures and minutes of polling retain one authorized session", async ({page}) => {
  await fixture(page); await page.clock.install(); await page.goto("/"); await connect(page);
  await expect(page.locator(".connection-status")).toContainText("DUST balance is temporarily unavailable");
  await mode(page, "offline");
  await expect(page.locator(".connection-status")).toContainText("Connection retained");
  await page.clock.fastForward(180_000);
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toBeVisible();
  await page.evaluate(() => { (window as unknown as {walletProbe:WalletProbe}).walletProbe.dustFails = false; });
  await mode(page, "ready");
  await expect(page.locator(".connection-status")).toContainText("DUST is available");
  expect((await probe(page)).calls).toBe(1);
  await mode(page, "revoked");
  await expect(page.locator(".connection-status")).toContainText("invalidated");
  await expect(page.getByRole("button", {name:"Disconnect",exact:true})).toHaveCount(0);
  await page.clock.fastForward(60_000); expect((await probe(page)).calls).toBe(1);
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
  await expect(page.locator(".connection-status")).toContainText("DUST balance is temporarily unavailable");
  await mode(page, "changed");
  await expect(page.getByRole("button", {name:"Unlock payment workspace"})).toHaveCount(0);
  await expect(page.locator(".connection-status")).toContainText("invalidated");
});
