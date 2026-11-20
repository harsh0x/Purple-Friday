import { describe, it, expect, beforeEach } from "vitest";
import {
  generateProofApprovalToken,
  getProofByToken,
  approveProofByCustomer,
  requestProofRevisionByCustomer,
} from "@/server/orders/proof-service";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";

describe("Proof & Approval Workflow (Step 5)", () => {
  const mockOrder: StoredOrderRecord = {
    id: "ord_proof_wf",
    orderNumber: "PF-PROOF-WF-01",
    status: "MOCKUP_SENT",
    subtotal: 500000,
    discount: 0,
    gst: 90000,
    shipping: 0,
    total: 590000,
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    address: {
      customerName: "Sneha Reddy",
      email: "sneha.reddy@techhub.in",
      phone: "+91 98450 77889",
    },
    version: 1,
    totalPausedDurationMs: 0,
    nudgeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: "item_proof_01",
        productId: "classic-crewneck-tee",
        options: { sizeBreakdown: { M: 20, L: 30 } },
        qty: 50,
        unitPrice: 10000,
        artworkUrl: "https://example.com/logo.png",
        mockupUrl: "https://example.com/mockup.png",
        printMethod: "DTF",
      },
    ],
    events: [],
  };

  beforeEach(() => {
    ORDER_STORE.set(mockOrder.id, { ...mockOrder, items: [{ ...mockOrder.items[0] }] });
    ORDER_STORE.set(mockOrder.orderNumber, { ...mockOrder, items: [{ ...mockOrder.items[0] }] });
  });

  it("generates a secure 14-day token, stores hash, and creates WhatsApp link", async () => {
    const { rawToken, tokenHash, expiresAt, approvalUrl, waMeUrl } =
      await generateProofApprovalToken(mockOrder.orderNumber);

    expect(rawToken).toBeDefined();
    expect(rawToken.length).toBeGreaterThanOrEqual(32);
    expect(tokenHash).toBeDefined();
    expect(approvalUrl).toContain(`/proof/${rawToken}`);
    expect(waMeUrl).toContain("wa.me/919845077889");
    expect(waMeUrl).toContain(encodeURIComponent(approvalUrl));

    // Verify expiration is ~14 days in future
    const expTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const daysDiff = (expTime - now) / (1000 * 3600 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(13.9);
  });

  it("retrieves safe public proof view without exposing prices or other customer orders", async () => {
    const { rawToken } = await generateProofApprovalToken(mockOrder.orderNumber);
    const proof = await getProofByToken(rawToken, "10.0.0.1");

    expect(proof).not.toBeNull();
    expect(proof?.orderNumber).toBe(mockOrder.orderNumber);
    expect(proof?.customerName).toBe("Sneha Reddy");
    expect(proof?.isExpired).toBe(false);
    expect(proof?.items[0].productName).toBeDefined();

    // Verify no financial leak
    expect((proof as any).total).toBeUndefined();
    expect((proof as any).subtotal).toBeUndefined();
    expect((proof as any).gst).toBeUndefined();
  });

  it("approves proof as customer, moves status to CUSTOMER_APPROVED, and resumes SLA", async () => {
    const { rawToken } = await generateProofApprovalToken(mockOrder.orderNumber);
    const result = await approveProofByCustomer(rawToken, "10.0.0.2");

    expect(result.success).toBe(true);

    const updated = ORDER_STORE.get(mockOrder.orderNumber)!;
    expect(updated.status).toBe("CUSTOMER_APPROVED");
    expect(updated.customerApprovedAt).toBeDefined();
    expect(updated.pausedAt).toBeNull(); // SLA unpaused
  });

  it("requests revisions as customer, moves status to REVISION_REQUESTED with comments", async () => {
    const { rawToken } = await generateProofApprovalToken(mockOrder.orderNumber);
    const result = await requestProofRevisionByCustomer(
      rawToken,
      "Please make the logo 15% smaller and center it slightly higher on the chest.",
      "10.0.0.3"
    );

    expect(result.success).toBe(true);

    const updated = ORDER_STORE.get(mockOrder.orderNumber)!;
    expect(updated.status).toBe("REVISION_REQUESTED");
    expect(updated.events?.[0].type).toBe("STATUS_CHANGE");
    expect(updated.events?.[0].message).toContain("15% smaller");
  });

  it("rejects empty comments on revision requests", async () => {
    const { rawToken } = await generateProofApprovalToken(mockOrder.orderNumber);
    await expect(
      requestProofRevisionByCustomer(rawToken, "   ", "10.0.0.4")
    ).rejects.toThrow("specific feedback");
  });
});
