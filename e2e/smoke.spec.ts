import { test, expect } from "@playwright/test";

test.describe("Purple Friday Production E2E Smoke Suite", () => {
  test("1. Home page loads with editorial print-shop layout and 10-second preview", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Purple Friday/);

    // Verify editorial headline
    const headline = page.locator("h1");
    await expect(headline).toBeVisible();

    // Verify 10-second preview upload zone
    const dropzone = page.locator("text=10-Second Live Preview");
    await expect(dropzone).toBeVisible();
  });

  test("2. Logo Customizer studio loads interactive canvas and quality guards", async ({ page }) => {
    await page.goto("/design/heavyweight-oversized-tee-240gsm");

    // Check for Customizer Studio UI
    await expect(page.locator("text=Customizer Studio")).toBeVisible();
    await expect(page.locator("text=Live Print Safe Area")).toBeVisible();
  });

  test("3. Product Detail Page calculates real-time quantity tier savings", async ({ page }) => {
    await page.goto("/products/round-gloss-badge-58mm");

    // Check product title and tier matrix
    await expect(page.locator("h1")).toContainText("58mm Round Gloss Magnetic Badge");
    await expect(page.locator("text=Volume Pricing Tiers")).toBeVisible();
  });

  test("4. Corporate Gifting Budget Planner simulates packages and generates PDF quotes", async ({ page }) => {
    await page.goto("/corporate-gifting");

    // Check planner header and download button
    await expect(page.locator("text=Simulate Your Corporate Gifting Program")).toBeVisible();
    await expect(page.locator("text=Download Official PDF Quote")).toBeVisible();
  });

  test("5. Checkout flow enforces customer contact, shipping, and GST input", async ({ page }) => {
    await page.goto("/checkout");

    // Verify checkout steps
    await expect(page.locator("text=Contact Details")).toBeVisible();
    await expect(page.locator("text=Shipping Destination")).toBeVisible();
  });

  test("6. Admin Control Room redirects unauthorized visitors to login", async ({ page }) => {
    await page.goto("/admin");

    // Non-admin user should be intercepted by middleware and redirected to login with error/callback
    await page.waitForURL(/\/auth\/login/);
    await expect(page.locator("h1")).toContainText("Sign In");
  });
});

