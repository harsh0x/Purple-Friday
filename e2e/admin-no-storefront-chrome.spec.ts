import { test, expect } from "@playwright/test";

test.describe("Admin Layout Pure Isolation - No Storefront Chrome", () => {
  test("ensures storefront footer, print assistant, and reviews tab are absent on admin routes", async ({ page }) => {
    // Navigate to admin login
    await page.goto("/admin/login");

    // 1. Verify storefront footer does not exist in DOM
    const storefrontFooter = page.locator("footer");
    await expect(storefrontFooter).toHaveCount(0);

    // 2. Verify floating Print Assistant widget is not rendered in DOM
    const printAssistant = page.locator("[data-testid='print-assistant'], text='Print Assistant'");
    await expect(printAssistant).toHaveCount(0);

    // 3. Verify floating reviews tab (e.g. 'REVIEWS 4.9') is not in DOM
    const reviewsTab = page.locator("text='REVIEWS 4.9'");
    await expect(reviewsTab).toHaveCount(0);

    // 4. Verify storefront announcement bar is not rendered
    const announcementBar = page.locator("[data-testid='storefront-announcement-bar']");
    await expect(announcementBar).toHaveCount(0);
  });
});
