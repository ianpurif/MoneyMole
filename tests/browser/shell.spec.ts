import { test, expect } from "@playwright/test";
import { ShieldedCoinPublicKey, ShieldedEncryptionPublicKey, UnshieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";

test("synthetic escrow recovers without submission and refreshes balances after a rejected approval", async ({ page, request }) => {
  test.setTimeout(90_000);
  const addresses = {
    unshieldedAddress: UnshieldedAddress.codec.encode("preprod", new UnshieldedAddress(Buffer.alloc(32, 3))).asString(),
    shieldedAddress: "synthetic-browser-wallet",
    shieldedCoinPublicKey: ShieldedCoinPublicKey.codec.encode("preprod", ShieldedCoinPublicKey.fromHexString("01".repeat(32))).asString(),
    shieldedEncryptionPublicKey: ShieldedEncryptionPublicKey.codec.encode("preprod", ShieldedEncryptionPublicKey.fromHexString("02".repeat(32))).asString(),
  };
  await page.addInitScript(addresses => {
    Object.assign(window, { syntheticDust: "2000000000000000", transactionCalls: 0, midnight: { opaque: {
      name: "1AM", rdns: "com.midnight.1am", apiVersion: "4.0.1", icon: "",
      connect: async () => ({
        getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
        getConfiguration: async () => ({ networkId: "preprod" }),
        getShieldedAddresses: async () => addresses,
        getUnshieldedAddress: async () => ({ unshieldedAddress: addresses.unshieldedAddress }),
        getDustBalance: async () => ({ balance: BigInt((window as unknown as {syntheticDust:string}).syntheticDust) }),
        balanceUnsealedTransaction: async () => { (window as unknown as { transactionCalls: number }).transactionCalls++; (window as unknown as {syntheticDust:string}).syntheticDust="1500000000000000"; throw new Error("Synthetic rejection; no signing"); },
        submitTransaction: async () => { (window as unknown as { transactionCalls: number }).transactionCalls++; throw new Error("No synthetic submission allowed"); },
      }),
    } } });
  }, addresses);
  const writes: string[] = [];
  page.on("request", req => { if (req.method() !== "GET") writes.push(new URL(req.url()).pathname); });
  async function prepare() {
    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await page.getByRole("button", { name: "1AM", exact: true }).click();
    await page.getByRole("button", { name: "Use recovery passphrase instead" }).click();
    await page.getByLabel("Local recovery passphrase", {exact:true}).fill("synthetic browser unlock passphrase");
    await page.getByRole("button", {name:/^(Secure|Unlock) MoneyMole$/}).click();
    await page.getByRole("button", { name: "Open workspace tools" }).click();
    await page.getByText("Create / recover a payment escrow", { exact: true }).click();
    await page.getByRole("button", { name: /^(Create \/ recover escrow|Review escrow)$/ }).click();
    await expect(page.getByText(/^State: prepared/)).toBeVisible({ timeout: 60_000 });
  }
  await page.goto("/"); await prepare();
  const address = await page.getByText(/^Preprod escrow: /).textContent();
  await page.reload(); await prepare();
  expect(await page.getByText(/^Preprod escrow: /).textContent()).toBe(address);
  expect(await page.evaluate(() => (window as unknown as { transactionCalls: number }).transactionCalls)).toBe(0);
  expect(writes).toEqual([]);
  await expect(page.getByLabel("Total DUST",{exact:true})).toHaveText("2");
  await page.getByRole("button",{name:"Approve escrow deployment",exact:true}).click();
  await expect(page.getByLabel("Total DUST",{exact:true})).toHaveText("1.5");
  expect(await page.evaluate(() => (window as unknown as {transactionCalls:number}).transactionCalls)).toBe(1);
  expect((await request.get("/api/artifacts/night-payments/verifier/fund")).status()).toBe(200);
  expect((await request.get("/api/artifacts/night-payments/verifier/unknown")).status()).toBe(404);
  expect((await request.post("/api/artifacts/night-payments/verifier/fund", { data: "synthetic" })).status()).toBe(405);
});
test("Lace is offered explicitly without automatically connecting", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { laceCalls: 0, midnight: { opaque: {
      name: "Lace", rdns: "io.lace.wallet", apiVersion: "4.0.1", icon: "",
      connect: async () => { (window as unknown as {laceCalls:number}).laceCalls++; throw {code:"Rejected"}; },
    } } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect Wallet", exact:true }).click();
  await expect(page.getByRole("button", { name: "1AM", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Lace", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as {laceCalls:number}).laceCalls)).toBe(0);
  await page.getByRole("button", { name: "Lace", exact: true }).click();
  await expect(page.locator(".connection-status")).toContainText("declined");
});

test("disconnected visitor cannot start a payment", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save payment draft" })).toHaveCount(0);
  await expect(page.getByText("Live acceptance of this implementation is pending.", { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test("synthetic connector exercises explicit authorization without API requests", async ({ page }) => {
  await page.addInitScript(coinPublicKey => {
    Object.assign(window, { syntheticConnectCalls: 0, midnight: { opaque: {
      name: "1AM", rdns: "com.midnight.1am", apiVersion: "4.0.1", icon: "",
      connect: async () => {
        const scope = window as unknown as { syntheticConnectCalls: number };
        scope.syntheticConnectCalls++;
        return {
          getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
          getConfiguration: async () => ({ networkId: "preprod" }),
          getUnshieldedAddress: async () => ({ unshieldedAddress: "synthetic-connection-only-address" }),
          getShieldedAddresses: async () => ({ shieldedCoinPublicKey: coinPublicKey }),
          getDustBalance: async () => ({ balance: 1n, cap: 1n }),
        };
      },
    } } });
  }, ShieldedCoinPublicKey.codec.encode("preprod", ShieldedCoinPublicKey.fromHexString("01".repeat(32))).asString());
  const apiRequests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.method()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  expect(await page.evaluate(() => (window as unknown as { syntheticConnectCalls: number }).syntheticConnectCalls)).toBe(0);
  await page.getByRole("button", { name: "1AM" }).click();
  await expect(page.getByText("1AM connected", {exact:true}).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Save payment draft" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Secure MoneyMole", exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.locator(".connection-status")).toContainText("Browser session cleared");
});

test("production uses fresh nonces and hydrates without CSP violations", async ({ page, request }) => {
  await page.addInitScript(() => {
    Object.assign(window, { cspViolations: [] as string[] });
    document.addEventListener("securitypolicyviolation", event => {
      (window as unknown as { cspViolations: string[] }).cspViolations.push(event.violatedDirective);
    });
  });
  const response = await page.goto("/");
  const policy = response?.headers()["content-security-policy"] ?? "";
  expect(policy).not.toContain("'unsafe-eval'");
  expect(policy).not.toContain("'unsafe-inline'");
  const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
  expect(nonce).toBeTruthy();
  const scriptNonces = await page.locator("script").evaluateAll(scripts => scripts.map(s => s.nonce));
  expect(scriptNonces.length).toBeGreaterThan(0);
  expect(scriptNonces.every(value => value === nonce)).toBe(true);
  expect((await request.get("/")).headers()["content-security-policy"]).not.toBe(policy);
  expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)).toEqual([]);
});
