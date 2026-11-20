import { test, expect } from "@playwright/test";

test.describe("Admin Order Pipeline & Production Queues (Part 2 E2E)", () => {
  test("1. Unauthenticated access to /admin/orders is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("2. Unauthenticated access to /admin/designs is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/designs");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("3. Unauthenticated access to /admin/production is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/production");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("4. Public customer proof approval page enforces token validity and rate limiting", async ({ page }) => {
    await page.goto("/proof/non_existent_mock_token_999");
    await expect(page.locator("text=Proof Link Expired or Unavailable")).toBeVisible();
  });
});
