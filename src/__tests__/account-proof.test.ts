import { describe, it, expect } from "vitest";
import { maskCustomerName, maskPhoneNumber, maskEmail } from "@/lib/security/privacy";
import { handleProofAction } from "@/lib/orders/proof";
import { createOrder } from "@/lib/orders";

describe("Account Privacy & Tracking Data Masking", () => {
  it("masks customer full names accurately", () => {
    expect(maskCustomerName("Vikram Sharma")).toBe("V*** S***");
    expect(maskCustomerName("Aditi")).toBe("A***");
    expect(maskCustomerName("Rohan Roy Chowdhury")).toBe("R*** R*** C***");
  });

  it("masks phone numbers keeping only the last 4 digits visible", () => {
    expect(maskPhoneNumber("9876543210")).toBe("******3210");
    expect(maskPhoneNumber("+91 98765 43210")).toBe("********3210");
  });

  it("masks email addresses keeping first and last characters of username", () => {
    expect(maskEmail("vikram@enterprise.in")).toBe("v***m@enterprise.in");
    expect(maskEmail("it@company.com")).toBe("i***@company.com");
  });
});

describe("Proof Approval & Change Request Transitions", () => {
  it("transitions order status to APPROVED upon customer confirmation", async () => {
    const order = await createOrder({
      customerName: "Test User",
      customerEmail: "test@example.com",
      customerPhone: "9876543210",
      shippingAddress: {
        line1: "123 Street",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560001",
      },
      items: [{ productId: "round-gloss-badge-58mm", optionKey: "b1", qty: 10 }],
    });

    const result = handleProofAction({
      orderId: order.id,
      userId: "usr_test_123",
      action: "approve",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("APPROVED");
    expect(result.order.status).toBe("APPROVED");
  });

  it("transitions order to CHANGES_REQUESTED when feedback is supplied", async () => {
    const order = await createOrder({
      customerName: "Test User",
      customerEmail: "test2@example.com",
      customerPhone: "9876543210",
      shippingAddress: {
        line1: "123 Street",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560001",
      },
      items: [{ productId: "round-gloss-badge-58mm", optionKey: "b2", qty: 10 }],
    });

    const result = handleProofAction({
      orderId: order.id,
      userId: "usr_test_123",
      action: "request_changes",
      feedback: "Please shift the company logo 2cm higher on the left chest.",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("CHANGES_REQUESTED");
    expect(result.order.status).toBe("CHANGES_REQUESTED");
  });

  it("rejects change request if no feedback comment is provided", async () => {
    const order = await createOrder({
      customerName: "Test User",
      customerEmail: "test3@example.com",
      customerPhone: "9876543210",
      shippingAddress: {
        line1: "123 Street",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560001",
      },
      items: [{ productId: "round-gloss-badge-58mm", optionKey: "b3", qty: 10 }],
    });

    expect(() =>
      handleProofAction({
        orderId: order.id,
        userId: "usr_test_123",
        action: "request_changes",
        feedback: "",
      })
    ).toThrow(/specific feedback/i);
  });
});
