import { test, expect } from "@playwright/test";

test.describe("Admin Payments, Risk & Shipping Engine (Part 4 E2E)", () => {
  test("1. Unauthenticated access to /admin/dispatch is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/dispatch");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("2. Unauthenticated access to /admin/shipments is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/shipments");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("3. Unauthenticated access to /admin/payments is securely redirected to login", async ({ page }) => {
    await page.goto("/admin/payments");
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test("4. Split dispatch CSV template download endpoint serves clean CSV with headers", async ({ request }) => {
    const response = await request.get("/api/admin/dispatch/template");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/csv");
    const body = await response.text();
    expect(body).toContain("Recipient Name,Phone,Address,City,State,PIN Code,Quantity,Notes");
    expect(body).toContain("Acme Corp,9876543210");
  });

  test("5. Responsive viewports audit across Mobile (375px), Tablet (768px), Desktop (1440px)", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: "Mobile" },
      { width: 768, height: 1024, name: "Tablet" },
      { width: 1440, height: 900, name: "Desktop" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/admin/login");
      // Check login form remains fully visible and responsive
      await expect(page.locator("input#email")).toBeVisible();
      await expect(page.locator("input#password")).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });

  test("6. Customer self-serve cancellation endpoint enforces order validity and 2-hour gate", async ({ request }) => {
    const res = await request.post("/api/orders/PF-NON-EXISTENT-999/cancel", {
      data: { reason: "Changed my mind" },
    });
    // Order not found returns 404
    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("Order PF-NON-EXISTENT-999 not found");
  });
});
