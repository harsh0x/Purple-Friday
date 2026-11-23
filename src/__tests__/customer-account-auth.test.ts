import { describe, it, expect, beforeEach } from "vitest";
import {
  createUser,
  verifyUserCredentials,
  activateUser,
  getUserTokenVersion,
  changeUserEmail,
  changeUserPassword,
  changeUserPhone,
  anonymizeUserAccount,
  findUserById,
} from "@/lib/auth-service";
import {
  sendEmailOtp,
  verifyEmailOtp,
  resetOtpStoreForTesting,
  getLastOtpForTesting,
} from "@/server/otp/email-otp";
import {
  addCustomerAddress,
  getCustomerAddresses,
  updateCustomerAddress,
  deleteCustomerAddress,
  changeOrderDeliveryAddress,
  reportOrderProblem,
  CUSTOMER_ADDRESSES,
  ORDER_ISSUES,
} from "@/server/customers/account-service";
import { ORDER_STORE, changeOrderStatus, Order } from "@/server/orders/state-machine";

describe("Customer Authentication, OTP Activation & Account Management", () => {
  beforeEach(() => {
    resetOtpStoreForTesting();
    CUSTOMER_ADDRESSES.clear();
    ORDER_ISSUES.clear();
  });

  it("registers customer in active: false state and refuses credentials until OTP verified", async () => {
    const testEmail = "newbie@purplefriday.in";
    const testPassword = "Password123!";

    const user = await createUser({
      name: "Newbie Customer",
      email: testEmail,
      password: testPassword,
      role: "CUSTOMER",
      active: false,
    });

    expect(user.email).toBe(testEmail);
    expect(user.role).toBe("CUSTOMER");

    // Inactive user should fail credential verification
    await expect(verifyUserCredentials(testEmail, testPassword)).rejects.toThrow(
      /Account inactive/i
    );

    // Send OTP and verify
    await sendEmailOtp({ target: testEmail, purpose: "REGISTER_EMAIL" });
    const otp = getLastOtpForTesting(testEmail, "REGISTER_EMAIL");
    expect(otp).toBeDefined();

    const verifyResult = await verifyEmailOtp({
      target: testEmail,
      purpose: "REGISTER_EMAIL",
      code: otp!,
    });
    expect(verifyResult.success).toBe(true);

    // Activate user
    const activated = await activateUser(user.id);
    expect(activated).toBeDefined();

    // Now login succeeds
    const loggedInUser = await verifyUserCredentials(testEmail, testPassword);
    expect(loggedInUser).toBeDefined();
    expect(loggedInUser?.id).toBe(user.id);
  });

  it("handles password reset with OTP and bumps tokenVersion", async () => {
    const email = "resetter@purplefriday.in";
    const initialPass = "InitialPass123!";
    const newPass = "BrandNewPass456!";

    const user = await createUser({
      name: "Reset User",
      email,
      password: initialPass,
      role: "CUSTOMER",
    });
    await activateUser(user.id);

    const initialVersion = await getUserTokenVersion(user.id);
    expect(initialVersion).toBe(1);

    // Send password reset OTP
    await sendEmailOtp({ target: email, purpose: "RESET_PASSWORD" });
    const otp = getLastOtpForTesting(email, "RESET_PASSWORD");
    const verified = await verifyEmailOtp({
      target: email,
      purpose: "RESET_PASSWORD",
      code: otp!,
    });
    expect(verified.success).toBe(true);

    // Change password & bump tokenVersion
    await changeUserPassword(user.id, newPass);
    const newVersion = await getUserTokenVersion(user.id);
    expect(newVersion).toBe(2);

    // Old password fails, new password works
    await expect(verifyUserCredentials(email, initialPass)).rejects.toThrow();
    const verifiedUser = await verifyUserCredentials(email, newPass);
    expect(verifiedUser?.tokenVersion).toBe(2);
  });

  it("changes email, updates record, and revokes all older tokens", async () => {
    const oldEmail = "first.email@purplefriday.in";
    const newEmail = "second.email@purplefriday.in";
    const password = "ValidPassword123!";

    const user = await createUser({
      name: "Email Changer",
      email: oldEmail,
      password,
      role: "CUSTOMER",
    });
    await activateUser(user.id);

    // Change email
    await changeUserEmail(user.id, newEmail);
    expect(await getUserTokenVersion(user.id)).toBe(2);

    // Old email fails, new email succeeds
    await expect(verifyUserCredentials(oldEmail, password)).rejects.toThrow();
    const updatedUser = await verifyUserCredentials(newEmail, password);
    expect(updatedUser?.email).toBe(newEmail);
  });

  it("updates customer phone and allows account deletion with anonymization", async () => {
    const email = "deleteme@purplefriday.in";
    const password = "DeleteMe123!";
    const user = await createUser({
      name: "To Delete",
      email,
      password,
      role: "CUSTOMER",
    });

    await changeUserPhone(user.id, "9876543210");
    const stored = await findUserById(user.id);
    expect(stored?.phone).toBe("9876543210");

    // Anonymize / Delete
    await anonymizeUserAccount(user.id);
    const deleted = await findUserById(user.id);
    expect(deleted?.email).toContain("anonymized.purplefriday.in");
    expect(deleted?.name).toBe("Anonymized Customer");
    expect(deleted?.phone).toBeUndefined();
  });
});

describe("Customer Address Book & Security Scoping", () => {
  beforeEach(() => {
    CUSTOMER_ADDRESSES.clear();
  });

  it("allows address CRUD and prevents cross-user access", async () => {
    const userA = "usr_alice_123";
    const userB = "usr_bob_456";

    // Alice adds address
    const addrA = await addCustomerAddress({
      userId: userA,
      customerEmail: "alice@example.com",
      label: "Home",
      name: "Alice Sharma",
      phone: "9876543210",
      line1: "123 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pin: "560001",
      isDefault: true,
    });

    expect(addrA.id).toBeDefined();
    expect(getCustomerAddresses(userA)).toHaveLength(1);
    expect(getCustomerAddresses(userB)).toHaveLength(0);

    // Bob cannot update Alice's address
    await expect(
      updateCustomerAddress(addrA.id, userB, "bob@example.com", { city: "Mumbai" })
    ).rejects.toThrow(/permission denied/i);

    // Bob cannot delete Alice's address
    await expect(
      deleteCustomerAddress(addrA.id, userB, "bob@example.com")
    ).rejects.toThrow(/permission denied/i);

    // Alice can update her address
    const updated = await updateCustomerAddress(addrA.id, userA, "alice@example.com", {
      city: "Bengaluru Urban",
    });
    expect(updated.city).toBe("Bengaluru Urban");

    // Alice can delete her address
    const deleted = await deleteCustomerAddress(addrA.id, userA, "alice@example.com");
    expect(deleted).toBe(true);
    expect(getCustomerAddresses(userA)).toHaveLength(0);
  });
});

describe("Order Security, Address Mutation & Cancellation Gates", () => {
  const createMockOrder = (orderNumber: string, userId: string, customerEmail: string, status: Order["status"] = "ORDER_PLACED", ageHours = 0): Order => {
    const createdAt = new Date(Date.now() - ageHours * 3600 * 1000).toISOString();
    return {
      id: `ord_${orderNumber}`,
      orderNumber,
      userId,
      customerEmail,
      customerName: "Test Buyer",
      customerPhone: "9876543210",
      status,
      items: [],
      subtotal: 100000,
      discount: 0,
      shipping: 0,
      gst: 18000,
      total: 118000,
      paymentMethod: "UPI",
      paymentStatus: "PAID",
      version: 1,
      nudgeCount: 0,
      createdAt,
      updatedAt: createdAt,
      address: { customerEmail, email: customerEmail },
      shippingAddress: {
        line1: "Old Address",
        city: "Delhi",
        state: "Delhi",
        pin: "110001",
      },
    };
  };

  beforeEach(() => {
    ORDER_STORE.clear();
    ORDER_ISSUES.clear();
  });

  it("permits delivery address change strictly before printing and rejects post-printing", async () => {
    const order = createMockOrder("PF-TEST-001", "usr_customer_1", "buyer@example.com", "ORDER_PLACED");
    ORDER_STORE.set(order.id, order);
    ORDER_STORE.set(order.orderNumber, order);

    // Pre-printing change succeeds
    await changeOrderDeliveryAddress({
      orderNumber: "PF-TEST-001",
      userId: "usr_customer_1",
      customerEmail: "buyer@example.com",
      address: {
        line1: "New Road 456",
        city: "Noida",
        state: "Uttar Pradesh",
        pin: "201301",
      },
    });

    const updated = ORDER_STORE.get("PF-TEST-001")!;
    expect(updated.shippingAddress?.city).toBe("Noida");

    // Cross-user refusal
    await expect(
      changeOrderDeliveryAddress({
        orderNumber: "PF-TEST-001",
        userId: "usr_attacker_99",
        customerEmail: "hacker@example.com",
        address: { line1: "Malicious", city: "Delhi", state: "Delhi", pin: "110001" },
      })
    ).rejects.toThrow(/permission denied/i);

    // Transition to IN_PRINTING
    order.status = "IN_PRINTING";
    ORDER_STORE.set(order.id, order);

    // Now address change must be rejected
    await expect(
      changeOrderDeliveryAddress({
        orderNumber: "PF-TEST-001",
        userId: "usr_customer_1",
        customerEmail: "buyer@example.com",
        address: { line1: "Too Late", city: "Noida", state: "Uttar Pradesh", pin: "201301" },
      })
    ).rejects.toThrow(/cannot be modified/i);
  });

  it("enforces 2-hour customer cancellation gate", async () => {
    // 1. Order placed 1 hour ago (within 2h window)
    const freshOrder = createMockOrder("PF-FRESH-001", "usr_1", "buyer@example.com", "ORDER_PLACED", 1);
    ORDER_STORE.set(freshOrder.id, freshOrder);

    const cancelResult = await changeOrderStatus(
      freshOrder.id,
      "CANCELLED",
      { email: "buyer@example.com", role: "CUSTOMER" },
      "Customer self-serve cancel within 2 hours"
    );
    expect(cancelResult.order.status).toBe("CANCELLED");

    // 2. Order placed 3 hours ago (outside 2h window)
    const agedOrder = createMockOrder("PF-AGED-002", "usr_1", "buyer@example.com", "ORDER_PLACED", 3);
    ORDER_STORE.set(agedOrder.id, agedOrder);

    await expect(
      changeOrderStatus(
        agedOrder.id,
        "CANCELLED",
        { email: "buyer@example.com", role: "CUSTOMER" },
        "Attempting cancellation after 3 hours"
      )
    ).rejects.toThrow(/cancellation window.*has expired/i);
  });

  it("allows problem reporting on DELIVERED orders within 7 days and rejects other statuses", async () => {
    const deliveredOrder = createMockOrder("PF-DEL-001", "usr_1", "buyer@example.com", "DELIVERED");
    deliveredOrder.events = [
      {
        id: "evt_del",
        type: "STATUS_CHANGE",
        status: "DELIVERED",
        actor: "system",
        actorRole: "SYSTEM",
        message: "Delivered to buyer",
        createdAt: new Date().toISOString(),
      },
    ];
    ORDER_STORE.set(deliveredOrder.id, deliveredOrder);

    // Report problem succeeds
    const issue = await reportOrderProblem({
      orderNumber: "PF-DEL-001",
      userId: "usr_1",
      customerEmail: "buyer@example.com",
      reason: "Print Quality Issue",
      comment: "Logo has minor color bleeding on left sleeve.",
      photoUrls: ["https://example.com/photo1.jpg"],
    });

    expect(issue.id).toBeDefined();
    expect(issue.status).toBe("OPEN");
    expect(ORDER_ISSUES.size).toBe(1);

    // In-printing order should reject problem reporting
    const printingOrder = createMockOrder("PF-PRINT-002", "usr_1", "buyer@example.com", "IN_PRINTING");
    ORDER_STORE.set(printingOrder.id, printingOrder);

    await expect(
      reportOrderProblem({
        orderNumber: "PF-PRINT-002",
        userId: "usr_1",
        customerEmail: "buyer@example.com",
        reason: "Defect",
        comment: "Cannot report on in-progress print",
        photoUrls: [],
      })
    ).rejects.toThrow(/only report issues on delivered orders/i);
  });
});
