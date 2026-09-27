import { test, expect } from "@playwright/test";
import { ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from "@midnight-ntwrk/wallet-sdk-address-format";

test("synthetic wallet prepares real compiled issuer locally and recovers without submission", async ({ page, request }) => {
  test.setTimeout(90_000);
  const addresses = {
    shieldedAddress: "synthetic-browser-wallet",
    shieldedCoinPublicKey: ShieldedCoinPublicKey.codec.encode("preprod", ShieldedCoinPublicKey.fromHexString("01".repeat(32))).asString(),
    shieldedEncryptionPublicKey: ShieldedEncryptionPublicKey.codec.encode("preprod", ShieldedEncryptionPublicKey.fromHexString("02".repeat(32))).asString(),
  };
  await page.addInitScript(addresses => {
    Object.assign(window, { transactionCalls: 0, midnight: { opaque: {
      name: "1AM", rdns: "com.midnight.1am", apiVersion: "4.0.1", icon: "",
      connect: async () => ({
        getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
        getConfiguration: async () => ({ networkId: "preprod" }),
        getShieldedAddresses: async () => addresses,
        getDustBalance: async () => ({ balance: 1n }),
        balanceUnsealedTransaction: async () => { (window as unknown as { transactionCalls: number }).transactionCalls++; throw new Error("No synthetic signing allowed"); },
        submitTransaction: async () => { (window as unknown as { transactionCalls: number }).transactionCalls++; throw new Error("No synthetic submission allowed"); },
      }),
    } } });
  }, addresses);
  const writes: string[] = [];
  page.on("request", req => { if (req.method() !== "GET") writes.push(new URL(req.url()).pathname); });
  async function prepare() {
    await page.getByRole("button", { name: "Check for 1AM" }).click();
    await page.getByRole("button", { name: "Connect 1AM", exact: true }).click();
    await page.getByRole("button", { name: "Open workspace tools" }).click();
    await page.getByText("Test asset issuer administration", { exact: true }).click();
    await page.getByRole("region", { name: "Preprod issuer setup" }).getByLabel("Local recovery passphrase", { exact: true }).fill("synthetic browser unlock passphrase");
    await page.getByRole("button", { name: "Prepare / unlock issuer deployment", exact: true }).click();
    await expect(page.getByText("State: prepared", { exact: true })).toBeVisible({ timeout: 60_000 });
  }
  await page.goto("/"); await prepare();
  const address = await page.getByText(/^Contract: /).textContent();
  await page.reload(); await prepare();
  expect(await page.getByText(/^Contract: /).textContent()).toBe(address);
  expect(await page.evaluate(() => (window as unknown as { transactionCalls: number }).transactionCalls)).toBe(0);
  expect(writes).toEqual([]);
  expect((await request.get("/api/artifacts/test-asset/verifier/issue")).status()).toBe(200);
  expect((await request.get("/api/artifacts/test-asset/verifier/unknown")).status()).toBe(404);
  expect((await request.post("/api/artifacts/test-asset/verifier/issue", { data: "synthetic" })).status()).toBe(405);
});
test("Lace alone never becomes the primary wallet", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { midnight: { opaque: {
      name: "Lace", rdns: "io.lace.wallet", apiVersion: "4.0.1", icon: "",
      connect: async () => { throw new Error("Must not connect Lace"); },
    } } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Check for 1AM" }).click();
  await expect(page.getByRole("button", { name: "Connect 1AM", exact: true })).toHaveCount(0);
  await expect(page.locator(".connection-status")).toContainText("supported 1AM API v4 provider was not found");
});
test("disconnected visitor cannot start a payment", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Move money.");
  await expect(page.getByRole("button", { name: "Save payment draft" })).toHaveCount(0);
  await expect(page.getByText("Live acceptance of this implementation is pending.", { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test("synthetic connector exercises explicit authorization without API requests", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { syntheticConnectCalls: 0, midnight: { opaque: {
      name: "1AM", rdns: "com.midnight.1am", apiVersion: "4.0.1", icon: "",
      connect: async () => {
        const scope = window as unknown as { syntheticConnectCalls: number };
        scope.syntheticConnectCalls++;
        return {
          getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
          getConfiguration: async () => ({ networkId: "preprod" }),
          getShieldedAddresses: async () => ({ shieldedAddress: "synthetic-test-address" }),
          getDustBalance: async () => ({ balance: 1n, cap: 1n }),
        };
      },
    } } });
  });
  const apiRequests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.method()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Check for 1AM" }).click();
  expect(await page.evaluate(() => (window as unknown as { syntheticConnectCalls: number }).syntheticConnectCalls)).toBe(0);
  await page.getByRole("button", { name: "Connect 1AM" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Connected to Preprod" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save payment draft" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Unlock payment workspace" })).toBeDisabled();
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
