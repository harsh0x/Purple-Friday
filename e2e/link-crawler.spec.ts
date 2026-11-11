import { test, expect } from "@playwright/test";

const MANDATORY_ROUTES = [
  "/",
  "/product/trucker-mesh-snapback-cap",
  "/product/round-gloss-badge-58mm",
  "/product/classic-crewneck-tshirt",
  "/category/magnetic-badges",
  "/category/t-shirts",
  "/category/hoodies",
  "/category/caps",
  "/category/corporate-gifts",
  "/category/best-sellers",
  "/category/all",
  "/faq",
  "/reviews",
  "/about",
  "/contact",
  "/corporate-gifting",
  "/shipping-policy",
  "/cancellation-and-refund",
  "/terms",
  "/privacy",
  "/styleguide",
  "/blog",
  "/cart",
];

test.describe("Purple Friday Comprehensive Link Crawler & 404 Prevention", () => {
  test("All mandatory product, category, and content routes load cleanly without 404", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      // Ignore extension-injected errors if any
      if (!err.message.includes("bis_skin_checked") && !err.message.includes("M_ID")) {
        pageErrors.push(err.message);
      }
    });

    for (const route of MANDATORY_ROUTES) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `Route ${route} should return status 200`).toBe(200);

      // Verify on-brand 404 page is NEVER shown in visible body
      const bodyText = await page.innerText("body");
      expect(
        bodyText.includes("This Press Plate Does Not Exist"),
        `Route ${route} rendered 404 Press Plate page!`
      ).toBe(false);

      expect(
        bodyText.includes("404 /"),
        `Route ${route} heading should not indicate 404 error`
      ).toBe(false);
    }

    expect(pageErrors, `No unexpected unhandled page errors on mandatory routes`).toEqual([]);
  });

  test("Crawl all internal links discoverable from Home Page", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Collect all internal links
    const rawHrefs = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => a.getAttribute("href")).filter((h): h is string => Boolean(h))
    );

    const internalHrefs = Array.from(
      new Set(
        rawHrefs
          .filter((h) => h.startsWith("/") && !h.startsWith("/api") && !h.startsWith("#"))
          .map((h) => h.split("#")[0].split("?")[0])
      )
    );

    console.log(`Discovered ${internalHrefs.length} internal links on Homepage:`, internalHrefs);

    for (const href of internalHrefs) {
      const res = await page.goto(href, { waitUntil: "domcontentloaded" });
      const status = res?.status() || 200;
      // Allow 200 or 302/307/308 redirects (e.g. /account -> /auth/login)
      expect(
        status < 400,
        `Discovered link ${href} returned error HTTP ${status}`
      ).toBe(true);

      const bodyText = await page.innerText("body");
      expect(
        bodyText.includes("This Press Plate Does Not Exist"),
        `Discovered link ${href} triggered 404 error page`
      ).toBe(false);
    }
  });

  test("E2E Cart and Checkout navigation: Add product -> Update quantity -> Apply FIRSTORDER coupon", async ({
    page,
  }) => {
    // 1. Visit product page
    await page.goto("/product/round-gloss-badge-58mm", { waitUntil: "domcontentloaded" });

    // Verify product header
    await expect(page.locator("h1")).toContainText("58mm Round Gloss Magnetic Badge");

    // Add to cart using the blank order direct button
    const addToCartButton = page.locator("button:has-text('Add Plain / Blank Order')").first();
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // Verify cart drawer opens or toast appears
    await page.waitForTimeout(600);

    // 2. Navigate directly to /cart
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Your Merchandise Order");
    await expect(page.locator("text=58mm Round Gloss Magnetic Badge").first()).toBeVisible();

    // 3. Apply coupon FIRSTORDER
    const couponInput = page.locator("input[placeholder*='code' i], input[placeholder*='coupon' i]").first();
    if (await couponInput.isVisible()) {
      await couponInput.fill("FIRSTORDER");
      const applyBtn = page.locator("button:has-text('Apply')").first();
      await applyBtn.click();
      await page.waitForTimeout(600);
    }

    // 4. Proceed to Checkout
    const checkoutBtn = page.locator("button:has-text('Proceed to Secure Checkout'), a[href='/checkout']").first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    await page.waitForURL(/\/checkout/);
    await expect(page.locator("text=Contact Details").first()).toBeVisible();
  });

  test("Mobile Viewport 375px: Sticky bar and navigation work seamlessly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/product/classic-crewneck-tshirt", { waitUntil: "domcontentloaded" });

    // Verify Sticky mobile bar Design Now button is visible
    const designNowBtn = page.locator("text=Design Now").first();
    await expect(designNowBtn).toBeVisible();

    // Verify Design now link targets /design/classic-crewneck-tshirt
    const designLink = page.locator("a[href*='/design/classic-crewneck-tshirt']").first();
    await expect(designLink).toBeVisible();
  });

  test("Product Page Real Photography: 15 swatches, front/back view toggle, and size picker gating", async ({
    page,
  }) => {
    await page.goto("/product/classic-crewneck-tshirt", { waitUntil: "domcontentloaded" });

    // 1. Verify canvas or real image is present
    const canvasOrImage = page.locator("canvas, img[src*='/products/classic-crewneck-tshirt']").first();
    await expect(canvasOrImage).toBeVisible();

    // 2. Verify 15 color swatches row
    const swatchButtons = page.locator("button[aria-label*='Select color']");
    const count = await swatchButtons.count();
    expect(count).toBeGreaterThanOrEqual(15);

    // Click 'Navy' swatch
    const navySwatch = page.locator("button[aria-label*='Navy']").first();
    if (await navySwatch.isVisible()) {
      await navySwatch.click();
      await expect(page.locator("text=Select Colour: Navy")).toBeVisible();
    }

    // 3. Front / Back view switching
    const rearButton = page.locator("button:has-text('Rear / Back'), button[aria-label*='rear']").first();
    if (await rearButton.isVisible()) {
      await rearButton.click();
      await page.waitForTimeout(300);
      const frontButton = page.locator("button:has-text('Front View'), button[aria-label*='front']").first();
      await expect(frontButton).toBeVisible();
      await frontButton.click();
    }

    // 4. Size-wise distribution gating on apparel Add to Cart
    // Initially S/M/L split equals minQty, so button says Add Plain / Blank Order
    const addToCartButton = page.locator("button:has-text('Add Plain / Blank Order'), button:has-text('Select Sizes')").first();
    await expect(addToCartButton).toBeVisible();

    // Increment S size stepper to create a mismatch
    const sPlusBtn = page.locator("button[aria-label*='Increase S']").first();
    if (await sPlusBtn.isVisible()) {
      await sPlusBtn.click();
      // Button should now be disabled and show mismatch count
      await expect(addToCartButton).toBeDisabled();
      await expect(page.locator("text=Please allocate all")).toBeVisible();
    }
  });
});
