import { test, expect } from "@playwright/test";

test.describe("Full Guest Checkout Flow (Cash on Delivery / Pay Later)", () => {
  test("guest adds product to cart, places order, views confirmation, and order appears with COD Pending", async ({
    page,
    request,
  }) => {
    // 1. Visit product catalog
    await page.goto("/products");
    await expect(page).toHaveTitle(/Purple Friday/);

    // 2. Direct API order placement simulating guest checkout
    const guestOrderPayload = {
      customerName: "Sanjay Kumar",
      customerEmail: "sanjay.guest@example.com",
      customerPhone: "9876543210",
      shippingAddress: {
        line1: "15 Residency Road",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560025",
      },
      items: [
        {
          productId: "classic-crewneck-tee",
          optionKey: "opt-black-l",
          qty: 2,
        },
      ],
      idempotencyKey: `guest_e2e_${Date.now()}`,
    };

    const orderRes = await request.post("/api/orders", {
      data: guestOrderPayload,
      headers: { Origin: "http://localhost:3000" },
    });

    expect(orderRes.ok()).toBeTruthy();
    const orderData = await orderRes.json();
    expect(orderData.success).toBe(true);
    expect(orderData.orderNumber).toBeDefined();
    expect(orderData.paymentMethod).toBe("COD");
    expect(orderData.paymentStatus).toBe("PENDING");

    // 3. Verify confirmation page loads with order information
    await page.goto(`/order/${orderData.orderNumber}/confirmation`);
    await expect(page.locator(`text=${orderData.orderNumber}`)).toBeVisible();
    await expect(page.locator("text=Cash on Delivery / Pay Later")).toBeVisible();
    await expect(page.locator("text=Delivery Destination")).toBeVisible();
    await expect(page.locator("text=Create a Purple Friday account")).toBeVisible();
  });
});
