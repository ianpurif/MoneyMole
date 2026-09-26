import { test, expect } from "@playwright/test";

test("claim fragment is scrubbed locally and never sent to resources or storage", async ({ page }) => {
  const marker = "synthetic-private-fragment-for-local-verification";
  let leaked = false;
  page.on("request", request => {
    if ([request.url(), request.postData() ?? "", request.headers().referer ?? ""].some(value => value.includes(marker))) leaked = true;
  });
  const response = await page.goto(`/claim#${marker}`);
  await expect(page.getByText("Claim captured in browser memory.", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe("");
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  expect(await page.evaluate(value => [...Object.values(localStorage), ...Object.values(sessionStorage)].some(item => item.includes(value)), marker)).toBe(false);
  expect(leaked).toBe(false);
  await page.reload();
  await expect(page.getByText("Open a complete claim link", { exact: false })).toBeVisible();
});

test("oversized claim fragments are discarded without wallet authorization", async ({ page }) => {
  await page.goto(`/claim#${"A".repeat(401)}`);
  await expect(page.getByText("Open a complete claim link", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe("");
  await expect(page.getByRole("button", { name: "Verify and save claim" })).toHaveCount(0);
});
