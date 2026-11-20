import { describe, it, expect, beforeEach } from "vitest";
import { generateProductionJobSheetPdf } from "@/server/production/jobsheet-generator";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";

describe("Production Job Sheet & Queues (Step 6)", () => {
  const mockOrder: StoredOrderRecord = {
    id: "ord_jobsheet_01",
    orderNumber: "PF-2611-99881",
    status: "CUSTOMER_APPROVED",
    subtotal: 4500000,
    discount: 0,
    gst: 810000,
    shipping: 0,
    total: 5310000,
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    address: {
      customerName: "Vertex Global",
      city: "Bengaluru",
      state: "Karnataka",
    },
    version: 3,
    totalPausedDurationMs: 0,
    nudgeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "item_js_1",
        productId: "classic-crewneck-tee",
        options: { sizeBreakdown: { S: 10, M: 20, L: 20 }, color: "Black" },
        qty: 50,
        unitPrice: 90000,
        artworkUrl: "https://example.com/logo.png",
        mockupUrl: "https://example.com/mockup.png",
        printMethod: "DTF",
        placement: { pantone: "PMS 2685 C", x: 50, y: 40, width: 60, height: 60 },
      },
    ],
    events: [],
  };

  beforeEach(() => {
    ORDER_STORE.set(mockOrder.id, { ...mockOrder });
    ORDER_STORE.set(mockOrder.orderNumber, { ...mockOrder });
  });

  it("generates a valid, non-empty A4 PDF with valid magic header %PDF-", async () => {
    const pdfBytes = await generateProductionJobSheetPdf(mockOrder.orderNumber);

    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify PDF header magic bytes %PDF-
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("rejects jobsheet generation for non-existent order", async () => {
    await expect(
      generateProductionJobSheetPdf("PF-NON-EXISTENT-999")
    ).rejects.toThrow("not found");
  });
});
