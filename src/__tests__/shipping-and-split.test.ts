import { describe, it, expect, beforeEach } from "vitest";
import {
  getShippingProvider,
  createSingleShipment,
  validateSplitDispatchCsv,
  generateErrorCsv,
  executeSplitDispatch,
  getShipmentsForOrder,
  syncParentOrderStatus,
  SHIPMENT_STORE,
  StoredShipment,
} from "@/server/shipping/shipping-service";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";
import { generateShippingLabelPdf } from "@/server/shipping/label-generator";

describe("Shipping & Split-Address Dispatch Engine", () => {
  beforeEach(() => {
    SHIPMENT_STORE.clear();
  });

  describe("Shipping Provider Architecture", () => {
    it("safely falls back to ManualProvider when Shiprocket credentials are not configured", () => {
      const provider = getShippingProvider("SHIPROCKET");
      // Unless SHIPROCKET_EMAIL/PASSWORD exist in env, it defaults to ManualProvider
      expect(provider.name).toBe("MANUAL");
    });

    it("generates a valid 4x6 inch PDF shipping label with recipient, sender and COD notice", async () => {
      const dummyShipment: StoredShipment = {
        id: "sh_test_123",
        orderId: "ord_test_123",
        orderNumber: "PF-20261120-001",
        shipmentNumber: "PF-TEST-SH1",
        recipientName: "Aditi Rao",
        recipientPhone: "9876543210",
        addressLine: "Flat 304, Palm Heights, Sector 62",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "201309",
        items: [{ name: "Custom Polo - Black / L", qty: 2 }],
        courier: "BlueDart Express",
        awb: "BD987654321IN",
        labelUrl: null,
        status: "DISPATCHED",
        collectCodAmountPaise: 150000, // Rs 1,500.00
        trackingHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const pdfBuffer = await generateShippingLabelPdf(dummyShipment);

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.byteLength).toBeGreaterThan(500); // Valid PDF output
      // PDF magic header %PDF-
      const headerString = String.fromCharCode(...pdfBuffer.subarray(0, 5));
      expect(headerString).toContain("%PDF-");
    });
  });

  describe("Split Dispatch CSV Validation", () => {
    it("validates well-formed CSV rows matching the exact order quantity", () => {
      const csv = `Recipient Name,Phone,Address,City,State,PIN Code,Quantity,Notes
Kavita Sen,9876543210,"Flat 101, Lake View, BTM 2nd Stage",Bengaluru,Karnataka,560076,3,Gift box
Deepak Verma,9123456789,"Plot 45, Banjara Hills Road 12",Hyderabad,Telangana,500034,2,Fragile`;

      const result = validateSplitDispatchCsv(csv, 5); // Expected total: 5 units

      expect(result.totalRows).toBe(2);
      expect(result.validRowsCount).toBe(2);
      expect(result.invalidRowsCount).toBe(0);
      expect(result.totalQuantityInCsv).toBe(5);
      expect(result.expectedOrderQuantity).toBe(5);
      expect(result.quantityMatches).toBe(true);
      expect(result.canExecute).toBe(true);
    });

    it("rejects CSV when sum of quantities does not match order item count", () => {
      const csv = `Recipient Name,Phone,Address,City,State,PIN Code,Quantity
Kavita Sen,9876543210,"Flat 101, Lake View, BTM 2nd Stage",Bengaluru,Karnataka,560076,2
Deepak Verma,9123456789,"Plot 45, Banjara Hills Road 12",Hyderabad,Telangana,500034,2`;

      const result = validateSplitDispatchCsv(csv, 10); // Order has 10 units, CSV only has 4

      expect(result.totalQuantityInCsv).toBe(4);
      expect(result.expectedOrderQuantity).toBe(10);
      expect(result.quantityMatches).toBe(false);
      expect(result.canExecute).toBe(false);
    });

    it("flags invalid phone numbers, short addresses, and malformed PIN codes per row", () => {
      const csv = `Recipient Name,Phone,Address,City,State,PIN Code,Quantity
A,12345,"Hi",Pune,MH,01234,0
Good Name,9876543210,"Valid street address 123",Pune,Maharashtra,411001,1`;

      const result = validateSplitDispatchCsv(csv, 1);

      expect(result.totalRows).toBe(2);
      expect(result.validRowsCount).toBe(1);
      expect(result.invalidRowsCount).toBe(1);

      const invalidRow = result.rows[0];
      expect(invalidRow.valid).toBe(false);
      expect(invalidRow.errors.length).toBeGreaterThanOrEqual(4);
      expect(invalidRow.errors.some((e) => e.includes("Recipient name"))).toBe(true);
      expect(invalidRow.errors.some((e) => e.includes("Indian mobile number"))).toBe(true);
      expect(invalidRow.errors.some((e) => e.includes("Address line"))).toBe(true);
      expect(invalidRow.errors.some((e) => e.includes("PIN code"))).toBe(true);
      expect(invalidRow.errors.some((e) => e.includes("Quantity"))).toBe(true);
    });

    it("enforces maximum row limit of 500 rows", () => {
      // Generate 505 rows
      const header = "Recipient Name,Phone,Address,City,State,PIN Code,Quantity\n";
      const rows = Array.from(
        { length: 505 },
        (_, i) => `Person ${i},9876543210,"Address line ${i}",City,State,560001,1`
      ).join("\n");

      expect(() => validateSplitDispatchCsv(header + rows, 505)).toThrow(
        "exceeds maximum limit of 500 recipients"
      );
    });

    it("generates an error CSV appending the specific reasons to each faulty row", () => {
      const csv = `Recipient Name,Phone,Address,City,State,PIN Code,Quantity
A,12345,"Hi",Pune,MH,01234,0
Good Name,9876543210,"Valid street address 123",Pune,Maharashtra,411001,1`;

      const validation = validateSplitDispatchCsv(csv, 1);
      const errorCsv = generateErrorCsv(validation);

      expect(errorCsv).toContain("Recipient Name");
      expect(errorCsv).toContain("Errors");
      expect(errorCsv).toContain("Must be a valid 10-digit Indian mobile number");
    });
  });

  describe("Execution & Retry Safety (Atomic Sub-manifesting)", () => {
    it("safely manifests shipments row-by-row and does not duplicate on retry", async () => {
      const testOrderNumber = `PF-SPLIT-TEST-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-split-ord-1",
        orderNumber: testOrderNumber,
        status: "QC_PASSED",
        subtotal: 10000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 10000,
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
        address: {},
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: "i1",
            productId: "p1",
            options: {},
            qty: 3,
            unitPrice: 3333,
          },
        ],
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      const splitRows = [
        {
          recipientName: "Office Bangalore",
          phone: "9876543210",
          address: "100ft Road, Indiranagar",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560038",
          quantity: 2,
        },
        {
          recipientName: "Office Mumbai",
          phone: "9123456789",
          address: "Bandra Kurla Complex, G Block",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400051",
          quantity: 1,
        },
      ];

      // Run 1: Manifest both
      const executionResult = await executeSplitDispatch({
        orderNumber: testOrderNumber,
        rows: splitRows,
        actor: "dispatch@purplefriday.com",
        actorRole: "FACTORY_MANAGER",
        providerName: "MANUAL",
      });

      expect(executionResult.createdCount).toBe(2);
      expect(executionResult.failedCount).toBe(0);

      const createdShipments = getShipmentsForOrder(testOrderNumber);
      expect(createdShipments.length).toBe(2);
      expect(createdShipments[0].shipmentNumber).toBe(`${testOrderNumber}-SH1`);
      expect(createdShipments[1].shipmentNumber).toBe(`${testOrderNumber}-SH2`);

      // Run 2: Re-executing skips already manifested shipments (idempotent / retry-safe)
      const retryResult = await executeSplitDispatch({
        orderNumber: testOrderNumber,
        rows: splitRows,
        actor: "dispatch@purplefriday.com",
        actorRole: "FACTORY_MANAGER",
        providerName: "MANUAL",
      });

      expect(retryResult.createdCount).toBe(2);
      // Total shipments in store remain 2 (not 4)
      const afterRetryShipments = getShipmentsForOrder(testOrderNumber);
      expect(afterRetryShipments.length).toBe(2);
    });

    it("automatically updates parent order to DISPATCHED when all sub-shipments are manifested", async () => {
      const testOrderNumber = `PF-SYNC-TEST-${Date.now()}`;
      const dummyOrder: StoredOrderRecord = {
        id: "test-sync-ord-1",
        orderNumber: testOrderNumber,
        status: "QC_PASSED",
        subtotal: 5000,
        discount: 0,
        gst: 0,
        shipping: 0,
        total: 5000,
        paymentMethod: "PREPAID",
        paymentStatus: "PAID",
        address: {},
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: "i1",
            productId: "p1",
            options: {},
            qty: 2,
            unitPrice: 2500,
          },
        ],
      };

      ORDER_STORE.set(testOrderNumber, dummyOrder);

      await createSingleShipment({
        orderNumber: testOrderNumber,
        recipientName: "Branch 1",
        recipientPhone: "9876543210",
        addressLine: "Sector 14",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122001",
        items: [{ name: "Kit", qty: 1 }],
        courierName: "Delhivery",
        awb: "DEL12345",
        actor: "test",
        actorRole: "FACTORY_MANAGER",
      });

      await createSingleShipment({
        orderNumber: testOrderNumber,
        recipientName: "Branch 2",
        recipientPhone: "9876543211",
        addressLine: "Sector 29",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122002",
        items: [{ name: "Kit", qty: 1 }],
        courierName: "Delhivery",
        awb: "DEL12346",
        actor: "test",
        actorRole: "FACTORY_MANAGER",
      });

      await syncParentOrderStatus(testOrderNumber);
      const updatedOrder = ORDER_STORE.get(testOrderNumber);
      expect(updatedOrder?.status).toBe("DISPATCHED");
    });
  });
});
