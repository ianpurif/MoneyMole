import { test, expect, type Page } from "@playwright/test";
import { installPaymentFixture } from "./support/payment-fixture";

async function unlock(page: Page, contract: string, returning = false) {
  await page.goto("/");
  await page.getByRole("button", {name:"Connect Wallet",exact:true}).click();
  await page.getByRole("button", {name:"1AM",exact:true}).click();
  await page.getByRole("button", {name:"Use recovery passphrase instead"}).click();
  await page.getByLabel("Local recovery passphrase", {exact:true}).fill("synthetic7");
  await page.getByRole("button", {name:returning ? "Unlock MoneyMole" : "Secure MoneyMole",exact:true}).click();
  if (!returning) {
    await page.getByLabel("Escrow address", {exact:true}).fill(contract);
    await page.getByRole("button", {name:"Use escrow",exact:true}).click();
  }
  await expect(page.getByRole("button", {name:"Send NIGHT",exact:true})).toBeVisible({timeout:60_000});
}

test("wizard preserves a failed preparation, stale totals, and the same encrypted draft after reload", async ({page}) => {
  const {contract} = await installPaymentFixture(page);
  await page.route("http://127.0.0.1:6300/**", route => route.abort());
  await unlock(page,contract);
  await expect(page.getByLabel("Total NIGHT", {exact:true})).toHaveText("100");
  await page.getByRole("button", {name:"Send NIGHT",exact:true}).click();
  const modal = page.getByRole("dialog", {name:"Send NIGHT",exact:true});
  await expect(modal.getByRole("alert")).toContainText("local proof service", {timeout:60_000});
  await expect(modal.locator('[aria-current="step"]')).toHaveText(/Prepare payment/);
  await expect(page.getByLabel("Total NIGHT", {exact:true})).toHaveText("100");
  await modal.getByRole("button", {name:"Retry this step"}).click();
  await expect(modal.getByRole("alert")).toContainText("local proof service", {timeout:60_000});
  await modal.getByRole("button", {name:"Close and resume later"}).click();
  await expect(page.getByLabel("Select payment").locator("option")).toHaveCount(2);
  const id = await page.getByLabel("Select payment").inputValue();
  await page.reload(); await unlock(page,contract,true);
  await page.getByLabel("Select payment").selectOption(id);
  await page.getByRole("button", {name:"Open payment",exact:true}).click();
  await expect(modal.getByRole("alert")).toContainText("local proof service", {timeout:60_000});
  await expect(modal.locator('[aria-current="step"]')).toHaveText(/Prepare payment/);
  expect(await page.evaluate(() => (window as unknown as {syntheticTransactionCalls:number}).syntheticTransactionCalls)).toBe(0);
});

test("local prover prepares a real synthetic funding proof without wallet authorization", async ({ page }) => {
  test.skip(process.env.MONEYMOLE_REAL_PROVER !== "1", "Explicit local prover gate; no live wallet or transaction");
  test.setTimeout(240_000);
  const { contract } = await installPaymentFixture(page);
  const responses: { path: string; status: number }[] = [];
  page.on("response", response => { const url = new URL(response.url()); if (url.port === "6300") responses.push({path:url.pathname,status:response.status()}); });
  await unlock(page,contract);
  await page.getByRole("button", {name:"Send NIGHT",exact:true}).click();
  try { await expect(page.getByRole("button", {name:"Approve payment in wallet",exact:true})).toBeVisible({timeout:200_000}); }
  finally { console.log(JSON.stringify({scope:"synthetic_browser_prover_http_status_only",responses})); }
  await page.getByRole("button", {name:"Close and resume later"}).click();
  const id = await page.getByLabel("Select payment").inputValue();
  await page.reload(); await unlock(page,contract,true);
  await page.getByLabel("Select payment").selectOption(id);
  await page.getByRole("button", {name:"Open payment",exact:true}).click();
  await expect(page.getByRole("button", {name:"Approve payment in wallet",exact:true})).toBeVisible();
  expect(responses.filter(response => response.path === "/prove" && response.status === 200)).toHaveLength(1);
  expect(await page.evaluate(() => (window as unknown as {syntheticTransactionCalls:number}).syntheticTransactionCalls)).toBe(0);
});
