import { test, expect } from "@playwright/test";

test.describe("Admin Analytics, Intelligence & Intelligence Loop (Part 5 E2E)", () => {
  test("1. Unauthenticated access to /admin/analytics is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("2. Unauthenticated access to /admin/margin is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/margin");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("3. Unauthenticated access to /admin/customers is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("4. Unauthenticated access to /admin/forecasting is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/forecasting");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("5. Unauthenticated access to /admin/reviews is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/reviews");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("6. Unauthenticated access to /admin/support is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/support");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("7. Public customer review page loads with custom-print feedback options", async ({ page }) => {
    await page.goto("/review/demo-invite-token");
    // Header check
    await expect(page.locator("h1")).toContainText("How was your custom merchandise?");
    // Star rating buttons should be interactive
    await expect(page.locator('button:has-text("Exceptional")')).toBeVisible();
    // Custom print sliders
    await expect(page.locator("text=Custom Print Craftsmanship Ratings")).toBeVisible();
  });

  test("8. Responsive viewports audit across Mobile (375px), Tablet (768px), Desktop (1440px)", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: "Mobile" },
      { width: 768, height: 1024, name: "Tablet" },
      { width: 1440, height: 900, name: "Desktop" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/review/demo-invite-token");
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });
});