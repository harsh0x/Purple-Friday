import { describe, it, expect, beforeEach } from "vitest";
import {
  ORDER_STORE,
  StoredOrderRecord,
  changeOrderStatus,
} from "@/server/orders/state-machine";
import {
  listAdminOrders,
  updateOrderAddress,
  markOrderShipped,
  markOrderDelivered,
  cancelOrderWithReason,
} from "@/server/orders/orders-service";
import {
  generateProofApprovalToken,
  getProofByToken,
  approveProofByCustomer,
} from "@/server/orders/proof-service";
import { processOrderRefund } from "@/server/refunds/refund-service";
import {
  submitCustomerReview,
  moderateReview,
  replyToReview,
  recalculateProductRating,
} from "@/server/reviews/review-service";
import { IN_MEMORY_PRODUCTS } from "@/server/products/product-service";
import {
  getCustomerDetail,
  setCustomerNote,
} from "@/server/customers/customer-service";

describe("Admin Orders, Reviews & Customers Single-Client Integration", () => {
  const actor = {
    email: "admin@purplefriday.in",
    role: "SUPER_ADMIN",
    name: "Purple Friday Admin",
  };

  const testProductSlug = "classic-crewneck-tee";
  const testOrderNumber = "PF-TEST-9001";
  const testCancelOrderNumber = "PF-TEST-9002";

  beforeEach(() => {
    // Setup initial product in memory
    const existingProd = IN_MEMORY_PRODUCTS.get(testProductSlug);
    if (existingProd) {
      existingProd.rating = 0;
      existingProd.reviewCount = 0;
    }

    // Setup fresh test orders
    const order1: StoredOrderRecord = {
      id: "ord_test_9001",
      orderNumber: testOrderNumber,
      userId: "cust_priya@acme.com",
      status: "ORDER_PLACED",
      subtotal: 500000,
      discount: 0,
      gst: 90000,
      shipping: 0,
      total: 590000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      customerName: "Priya Menon",
      customerEmail: "priya@acme.com",
      customerPhone: "+91 98450 99887",
      address: {
        customerName: "Priya Menon",
        email: "priya@acme.com",
        phone: "+91 98450 99887",
        line1: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560001",
      },
      shippingAddress: {
        line1: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560001",
      },
      version: 1,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: "item_901",
          productId: testProductSlug,
          options: { color: "Jet Black", sizeBreakdown: { M: 10 } },
          qty: 10,
          unitPrice: 50000,
          artworkUrl: "https://example.com/art.png",
          mockupUrl: "https://example.com/mock.png",
        },
      ],
      events: [],
    };

    const order2: StoredOrderRecord = {
      id: "ord_test_9002",
      orderNumber: testCancelOrderNumber,
      userId: "cust_rahul@startup.in",
      status: "ORDER_PLACED",
      subtotal: 3000,
      discount: 0,
      gst: 540,
      shipping: 0,
      total: 3540,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      customerName: "Rahul Sen",
      customerEmail: "rahul@startup.in",
      customerPhone: "+91 98200 11223",
      address: {
        customerName: "Rahul Sen",
        email: "rahul@startup.in",
        phone: "+91 98200 11223",
        line1: "44 Linking Road",
        city: "Mumbai",
        state: "Maharashtra",
        pin: "400050",
      },
      shippingAddress: {
        line1: "44 Linking Road",
        city: "Mumbai",
        state: "Maharashtra",
        pin: "400050",
      },
      version: 1,
      nudgeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: "item_902",
          productId: testProductSlug,
          options: { color: "White" },
          qty: 5,
          unitPrice: 60000,
        },
      ],
      events: [],
    };

    ORDER_STORE.set(order1.id, order1);
    ORDER_STORE.set(order1.orderNumber, order1);
    ORDER_STORE.set(order2.id, order2);
    ORDER_STORE.set(order2.orderNumber, order2);
  });

  it("1. test order appears in admin list with search and summary details", async () => {
    const listRes = await listAdminOrders({ search: testOrderNumber }, "SUPER_ADMIN");
    expect(listRes.orders.length).toBeGreaterThanOrEqual(1);

    const found = listRes.orders.find((o) => o.orderNumber === testOrderNumber);
    expect(found).toBeDefined();
    expect(found?.customerName).toBe("Priya Menon");
    expect(found?.status).toBe("ORDER_PLACED");
    expect(found?.totalPaise).toBe(590000);
  });

  it("2. proof sent and approved through secure link", async () => {
    // Step A: Move to ARTWORK_UPLOADED first
    await changeOrderStatus(testOrderNumber, "ARTWORK_UPLOADED", actor, "Artwork ingested");

    // Step B: Generate proof link and move to MOCKUP_SENT
    const { rawToken } = await generateProofApprovalToken(testOrderNumber);
    await changeOrderStatus(testOrderNumber, "MOCKUP_SENT", actor, "Proof sent to customer");

    // Step C: Customer views proof by token
    const proofDetails = await getProofByToken(rawToken);
    expect(proofDetails).not.toBeNull();
    expect(proofDetails?.orderNumber).toBe(testOrderNumber);
    expect(proofDetails?.isExpired).toBe(false);

    // Step D: Customer approves proof digitally
    const approveRes = await approveProofByCustomer(rawToken);
    expect(approveRes.success).toBe(true);

    const updatedOrder = ORDER_STORE.get(testOrderNumber);
    expect(updatedOrder?.status).toBe("CUSTOMER_APPROVED");
  });

  it("3. status moves through allowed steps, gets shipped with tracking and delivered", async () => {
    // Sequence through canonical steps: ORDER_PLACED -> ARTWORK_UPLOADED -> MOCKUP_SENT -> CUSTOMER_APPROVED -> IN_PRINTING
    await changeOrderStatus(testOrderNumber, "ARTWORK_UPLOADED", actor, "Artwork received");
    await changeOrderStatus(testOrderNumber, "MOCKUP_SENT", actor, "Mockup generated");
    await changeOrderStatus(testOrderNumber, "CUSTOMER_APPROVED", actor, "Client approved mockup");
    await changeOrderStatus(testOrderNumber, "IN_PRINTING", actor, "Moved to print queue");
    let current = ORDER_STORE.get(testOrderNumber);
    expect(current?.status).toBe("IN_PRINTING");

    // Ship order requiring courier name and tracking
    const shipRes = await markOrderShipped(
      testOrderNumber,
      {
        courierName: "BlueDart Express",
        trackingNumber: "BD-9988221",
        trackingUrl: "https://track.bluedart.com/BD-9988221",
      },
      actor
    );
    expect(shipRes.success).toBe(true);

    current = ORDER_STORE.get(testOrderNumber);
    expect(current?.status).toBe("DISPATCHED");
    expect(current?.courierName).toBe("BlueDart Express");
    expect(current?.trackingNumber).toBe("BD-9988221");

    // Mark delivered
    const delivRes = await markOrderDelivered(testOrderNumber, actor);
    expect(delivRes.success).toBe(true);

    current = ORDER_STORE.get(testOrderNumber);
    expect(current?.status).toBe("DELIVERED");
  });

  it("4. address edit works before dispatch and is refused after dispatch", async () => {
    // Order 2 is in ORDER_PLACED (pre-dispatch)
    const updateRes = await updateOrderAddress(
      testCancelOrderNumber,
      {
        line1: "Flat 402, Sea View Apartments",
        city: "Navi Mumbai",
        state: "Maharashtra",
        pin: "400705",
      },
      actor
    );
    expect(updateRes.success).toBe(true);
    expect(updateRes.order.shippingAddress?.pin).toBe("400705");

    // Set order to DISPATCHED
    const dispatchedOrder = ORDER_STORE.get(testOrderNumber)!;
    dispatchedOrder.status = "DISPATCHED";

    // Modifying address after dispatch is rejected
    await expect(
      updateOrderAddress(
        testOrderNumber,
        {
          line1: "New Address",
          city: "Bengaluru",
          state: "Karnataka",
          pin: "560002",
        },
        actor
      )
    ).rejects.toThrow(/Address cannot be modified after dispatch/);
  });

  it("5. different order cancelled with written reason and refund recorded", async () => {
    // Cancel requires written reason
    await expect(cancelOrderWithReason(testCancelOrderNumber, "", actor)).rejects.toThrow(
      /Cancellation requires a written justification reason/
    );

    const cancelRes = await cancelOrderWithReason(
      testCancelOrderNumber,
      "Client cancelled event due to unavoidable schedule changes",
      actor
    );
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.order.status).toBe("CANCELLED");
    expect(cancelRes.order.cancellationReason).toBe(
      "Client cancelled event due to unavoidable schedule changes"
    );

    // Record refund (idempotent)
    const refundKey = `test_ref_${Date.now()}`;
    const refund = await processOrderRefund({
      orderNumber: testCancelOrderNumber,
      reason: "Full cancellation refund",
      idempotencyKey: refundKey,
      actor: actor.email,
      actorRole: actor.role,
      type: "MANUAL",
    });

    expect(refund.status).toBe("PROCESSED");
    expect(refund.amountPaise).toBe(354000);

    // Idempotent retry returns identical refund record without double charging
    const retryRefund = await processOrderRefund({
      orderNumber: testCancelOrderNumber,
      reason: "Duplicate refund retry",
      idempotencyKey: refundKey,
      actor: actor.email,
      actorRole: actor.role,
    });
    expect(retryRefund.refundNumber).toBe(refund.refundNumber);
  });

  it("6. forbidden transition is refused by state machine", async () => {
    // Create new order at ORDER_PLACED
    const tempOrderNum = "PF-TEST-ILLEGAL";
    ORDER_STORE.set(tempOrderNum, {
      ...ORDER_STORE.get(testOrderNumber)!,
      orderNumber: tempOrderNum,
      id: "ord_illegal",
      status: "ORDER_PLACED",
      version: 1,
    });

    // Attempting to jump directly from ORDER_PLACED to DELIVERED is forbidden
    await expect(
      changeOrderStatus(tempOrderNum, "DELIVERED", actor, "Attempting illegal jump")
    ).rejects.toThrow(/Illegal state transition/);
  });

  it("7. review approved with reply updates product rating average and count", async () => {
    // Submit positive review
    const { review } = await submitCustomerReview({
      productId: testProductSlug,
      orderNumber: testOrderNumber,
      authorName: "Priya Menon",
      rating: 5,
      title: "Superb print quality and fabric!",
      body: "Our startup team loved the custom crewneck t-shirts. The DTF print was razor sharp.",
    });

    expect(review.id).toBeDefined();

    // Moderate review to APPROVE
    await moderateReview({
      reviewId: review.id,
      action: "APPROVE",
      actor: actor.name,
      actorRole: actor.role,
    });

    // Staff replies publicly
    const replied = await replyToReview({
      reviewId: review.id,
      replyText: "Thank you Priya! Thrilled that your startup team loved the print quality.",
      actor: actor.name,
    });
    expect(replied.adminReply).toContain("Thank you Priya");

    // Product rating in catalogue is updated
    const stats = await recalculateProductRating(testProductSlug);
    expect(stats.count).toBeGreaterThanOrEqual(1);
    expect(stats.average).toBeGreaterThanOrEqual(4.0);

    const inMemProd = IN_MEMORY_PRODUCTS.get(testProductSlug);
    if (inMemProd) {
      expect(inMemProd.rating).toBe(stats.average);
      expect(inMemProd.reviewCount).toBe(stats.count);
    }
  });

  it("8. low rating review is quarantined and flagged as needs attention", async () => {
    const { review: lowReview } = await submitCustomerReview({
      productId: testProductSlug,
      authorName: "Dissatisfied Client",
      rating: 2,
      title: "Sizing was slightly tight",
      body: "The medium fit smaller than expected.",
    });

    // Low reviews (<= 3 stars) are quarantined to PENDING
    expect(lowReview.status).toBe("PENDING");
    expect(lowReview.rating).toBeLessThanOrEqual(3);
  });

  it("9. customer detail aggregates orders, reviews, and stores private admin note without editing customer data", async () => {
    const detail = await getCustomerDetail("priya@acme.com");
    expect(detail).not.toBeNull();
    expect(detail?.profile.customerName).toBe("Priya Menon");
    expect(detail?.orders.length).toBeGreaterThanOrEqual(1);

    // Save private admin note
    const noteRes = await setCustomerNote(
      "priya@acme.com",
      "VIP Corporate client. Eligible for free expedited air shipping on Q4 batch.",
      actor.email,
      actor.role
    );
    expect(noteRes.success).toBe(true);

    // Verify customer profile remains strictly read-only while note is saved
    const updatedDetail = await getCustomerDetail("priya@acme.com");
    expect(updatedDetail?.privateNote).toContain("VIP Corporate client");
    expect(updatedDetail?.profile.customerName).toBe("Priya Menon");
    expect(updatedDetail?.profile.customerEmail).toBe("priya@acme.com");
  });
});
