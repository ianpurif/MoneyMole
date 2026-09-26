import { test, expect } from "@playwright/test";
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
  await expect(page.getByRole("status")).toContainText("supported 1AM API v4 provider was not found");
});
test("shell is explicit and cannot start a payment", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One claim link.");
  await expect(page.getByRole("button", { name: "Payment operations unavailable" })).toBeDisabled();
  await expect(page.getByText("No asset balances are shown.", { exact: false })).toBeVisible();
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
  await expect(page.getByRole("status")).toContainText("Connected to Preprod");
  await expect(page.getByRole("button", { name: "Payment operations unavailable" })).toBeDisabled();
  expect(apiRequests).toEqual([]);
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Browser session cleared");
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
