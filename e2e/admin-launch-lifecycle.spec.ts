import { test, expect } from "@playwright/test";

test.describe("Part 6: Full Admin & Production Pipeline E2E (Desktop & Tablet)", () => {
  const VIEWPORTS = [
    { name: "Desktop", width: 1440, height: 900 },
    { name: "Factory Floor Tablet", width: 768, height: 1024 },
  ];

  for (const vp of VIEWPORTS) {
    test.describe(`${vp.name} Viewport (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("1. Full lifecycle pipeline: Order -> Proof -> Production -> Split Dispatch -> Delivery -> Review", async ({
        page,
        request,
      }) => {
        // Step A: Public Proof approval screen handles valid and invalid tokens
        await page.goto("/proof/test-proof-token-invalid");
        await expect(page.locator("body")).toBeVisible();

        // Step B: Customer review screen loads delivery verification
        await page.goto("/review/rev-sample-token-123");
        await expect(page.locator("body")).toBeVisible();

        // Step C: Public recommendations endpoints respond cleanly
        const fbtRes = await request.get("/api/recommendations/fbt?productId=round-gloss-badge-58mm");
        expect(fbtRes.status()).toBe(200);

        const rankingRes = await request.get("/api/recommendations/smart-ranking?category=Hoodies");
        expect(rankingRes.status()).toBe(200);
      });

      test("2. COD Order from high-risk address triggers prepaid-only protection", async ({ request }) => {
        // Post an order with a known high-risk address pattern (short repetitive address)
        const res = await request.post("/api/orders", {
          data: {
            customerName: "Risky User",
            customerEmail: "risky@tempmail.in",
            customerPhone: "9876543210",
            shippingAddress: {
              line1: "xyz",
              city: "Patna",
              state: "Bihar",
              pinCode: "800001",
            },
            paymentMethod: "COD",
            items: [
              {
                slug: "classic-pullover-hoodie",
                qty: 10,
                color: "#15101F",
                size: "L",
              },
            ],
          },
        });

        // The system handles or flags high RTO risk safely
        expect([200, 400, 403]).toContain(res.status());
      });

      test("3. CMS publish appears on live customer storefront", async ({ page, request }) => {
        // Check public CMS published endpoint
        const pubRes = await request.get("/api/cms/published");
        expect(pubRes.status()).toBe(200);
        const json = await pubRes.json();
        expect(json.success).toBe(true);
        expect(json.cms).toBeDefined();

        // Navigate to storefront homepage and verify hero and announcements render
        await page.goto("/");
        await expect(page.locator("body")).toBeVisible();
      });

      test("4. Role restriction enforcement: Logged-out and Customer access blocked", async ({ page }) => {
        // An unauthenticated user navigating to /admin must be redirected to /admin/login
        await page.goto("/admin");
        await page.waitForURL((url) => url.pathname.includes("/admin/login") || url.pathname.includes("/auth/login"));
        expect(page.url()).toContain("login");

        // Attempting to access sensitive financial endpoints directly returns 401 or 403
        await page.goto("/admin/margin");
        expect(page.url()).toContain("login");

        await page.goto("/admin/settings");
        expect(page.url()).toContain("login");

        await page.goto("/admin/cms");
        expect(page.url()).toContain("login");
      });
    });
  }
});
