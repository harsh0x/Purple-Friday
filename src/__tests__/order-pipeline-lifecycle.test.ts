import { describe, it, expect } from "vitest";
import {
  changeOrderStatus,
  canTransition,
  ORDER_STORE,
  StoredOrderRecord,
} from "@/server/orders/state-machine";
import { generateProofApprovalToken, approveProofByCustomer } from "@/server/orders/proof-service";

describe("Order Pipeline Complete Lifecycle (Step 7 Verification)", () => {
  it("executes the full end-to-end order lifecycle and blocks forbidden attempts", async () => {
    // 1. Initial Order Placement
    const orderNumber = "PF-2611-LIFECYCLE-01";
    const initialOrder: StoredOrderRecord = {
      id: "ord_life_01",
      orderNumber,
      status: "ORDER_PLACED",
      subtotal: 500000,
      discount: 0,
      gst: 90000,
      shipping: 0,
      total: 590000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Radhika Iyer",
        email: "radhika@titancreative.in",
        phone: "+91 99000 88776",
        city: "Bengaluru",
      },
      version: 1,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: "item_life_01",
          productId: "heavyweight-hoodie",
          options: { sizeBreakdown: { M: 25, L: 25 } },
          qty: 50,
          unitPrice: 10000,
        },
      ],
      events: [],
    };

    ORDER_STORE.set(initialOrder.id, { ...initialOrder });
    ORDER_STORE.set(initialOrder.orderNumber, { ...initialOrder });

    // Step A: Customer or Designer uploads artwork -> moves to ARTWORK_UPLOADED
    const designerActor = {
      email: "ananya@purplefriday.com",
      role: "GRAPHIC_DESIGNER",
      name: "Ananya Deshmukh",
    };

    const stepA = await changeOrderStatus(
      orderNumber,
      "ARTWORK_UPLOADED",
      { email: "radhika@titancreative.in", role: "CUSTOMER" },
      "Vector artwork uploaded",
      1
    );
    expect(stepA.order.status).toBe("ARTWORK_UPLOADED");
    expect(stepA.order.version).toBe(2);

    // Step B: Designer renders mockup proof and clicks "Send Mockup" -> moves to MOCKUP_SENT
    const tokenData = await generateProofApprovalToken(orderNumber);
    expect(tokenData.approvalUrl).toBeDefined();

    const stepB = await changeOrderStatus(
      orderNumber,
      "MOCKUP_SENT",
      designerActor,
      "Mockup sent to client",
      stepA.order.version
    );
    expect(stepB.order.status).toBe("MOCKUP_SENT");
    expect(stepB.order.pausedAt).toBeDefined(); // SLA clock paused

    // Step C: FORBIDDEN ATTEMPT - Designer tries to mark DISPATCHED directly
    const forbiddenCheck = canTransition("MOCKUP_SENT", "DISPATCHED", "GRAPHIC_DESIGNER");
    expect(forbiddenCheck.allowed).toBe(false);

    await expect(
      changeOrderStatus(orderNumber, "DISPATCHED", designerActor, "Attempting skip", stepB.order.version)
    ).rejects.toThrow();

    // Step D: Customer inspects proof link and approves -> moves to CUSTOMER_APPROVED
    const approvalResult = await approveProofByCustomer(tokenData.rawToken);
    expect(approvalResult.success).toBe(true);

    const stepDOrder = ORDER_STORE.get(orderNumber)!;
    expect(stepDOrder.status).toBe("CUSTOMER_APPROVED");
    expect(stepDOrder.pausedAt).toBeNull(); // SLA clock unpaused

    // Step E: Factory Manager moves order to IN_PRINTING
    const factoryActor = {
      email: "vikram@purplefriday.com",
      role: "FACTORY_MANAGER",
      name: "Vikram Singhania",
    };

    const stepE = await changeOrderStatus(
      orderNumber,
      "IN_PRINTING",
      factoryActor,
      "Batch allocated to Screen Press #2",
      stepDOrder.version
    );
    expect(stepE.order.status).toBe("IN_PRINTING");

    // Step F: Admin dispatches consignment -> moves directly to DISPATCHED (no QC_PASSED)
    const stepF = await changeOrderStatus(
      orderNumber,
      "DISPATCHED",
      factoryActor,
      "Dispatched via Bluedart Express AWB 9928172910",
      stepE.order.version
    );
    expect(stepF.order.status).toBe("DISPATCHED");

    // Step G: Admin confirms delivery -> moves to DELIVERED
    const supportActor = {
      email: "support@purplefriday.com",
      name: "Support Desk",
    };

    const stepG = await changeOrderStatus(
      orderNumber,
      "DELIVERED",
      supportActor,
      "Delivered and signed by consignee at reception desk",
      stepF.order.version
    );
    expect(stepG.order.status).toBe("DELIVERED");
    expect(stepG.order.version).toBe(8);
  });
});
