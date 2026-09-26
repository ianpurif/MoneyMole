import { test, expect } from "@playwright/test";
test("shell is explicit and cannot start a payment", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("One claim link.");
  await expect(page.getByRole("button", { name: "Payment operations unavailable" })).toBeDisabled();
  await expect(page.getByText("No asset balances are shown.", { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});
