import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ManualProvider, ShiprocketProvider } from "./providers";
import { ShippingProvider } from "./shipping-provider";
import { changeOrderStatus, ORDER_STORE } from "@/server/orders/state-machine";
import { safeCsvCell } from "@/lib/security/csv";
import { writeAudit } from "@/lib/admin/audit";

export interface StoredShipment {
  id: string;
  orderId: string;
  orderNumber: string;
  shipmentNumber: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{ name: string; qty: number; sku?: string }>;
  awb?: string | null;
  courier?: string | null;
  labelUrl?: string | null;
  status: "CREATED" | "MANIFESTED" | "DISPATCHED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "RTO" | "CANCELLED";
  collectCodAmountPaise: number;
  trackingHistory: Array<{
    timestamp: string;
    status: string;
    location: string;
    description: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Global in-memory registry for shipments
export const SHIPMENT_STORE = new Map<string, StoredShipment>();

const manualProvider = new ManualProvider();
const shiprocketProvider = new ShiprocketProvider();

export function getShippingProvider(providerName?: string): ShippingProvider {
  if (providerName?.toUpperCase() === "SHIPROCKET" && shiprocketProvider.isConfigured()) {
    return shiprocketProvider;
  }
  return manualProvider;
}

/**
 * Creates a single shipment for an order.
 */
export async function createSingleShipment(params: {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{ name: string; qty: number; sku?: string }>;
  providerName?: "MANUAL" | "SHIPROCKET";
  courierName?: string;
  awb?: string;
  collectCodAmountPaise?: number;
  actor: string;
  actorRole: string;
}): Promise<StoredShipment> {
  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error(`Order ${params.orderNumber} not found.`);
  }

  // Count existing shipments for this order to form index
  const existingShipments = getShipmentsForOrder(order.orderNumber);
  const shipmentIndex = existingShipments.length + 1;
  const shipmentNumber = `${order.orderNumber}-SH${shipmentIndex}`;

  const provider = getShippingProvider(params.providerName);
  const shipmentResult = await provider.createShipment({
    orderNumber: order.orderNumber,
    shipmentNumber,
    recipientName: params.recipientName,
    recipientPhone: params.recipientPhone,
    addressLine: params.addressLine,
    city: params.city,
    state: params.state,
    pincode: params.pincode,
    items: params.items,
    courierName: params.courierName,
    awb: params.awb,
    collectCodAmountPaise: params.collectCodAmountPaise || (order.paymentMethod === "COD" ? order.balanceDuePaise || 0 : 0),
  });

  const now = new Date().toISOString();
  const shipmentRecord: StoredShipment = {
    id: `sh_${crypto.randomUUID()}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    shipmentNumber,
    recipientName: params.recipientName,
    recipientPhone: params.recipientPhone,
    addressLine: params.addressLine,
    city: params.city,
    state: params.state,
    pincode: params.pincode,
    items: params.items,
    awb: shipmentResult.awb,
    courier: shipmentResult.courier,
    labelUrl: shipmentResult.labelUrl,
    status: "DISPATCHED",
    collectCodAmountPaise: params.collectCodAmountPaise || 0,
    trackingHistory: [
      {
        timestamp: now,
        status: "DISPATCHED",
        location: "Bengaluru Merch Atelier Hub",
        description: `Shipment manifested via ${shipmentResult.courier} (AWB: ${shipmentResult.awb})`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  SHIPMENT_STORE.set(shipmentNumber, shipmentRecord);
  if (shipmentRecord.awb) {
    SHIPMENT_STORE.set(shipmentRecord.awb, shipmentRecord);
  }

  // Sync to database if live
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.shipment.create({
        data: {
          id: shipmentRecord.id,
          orderId: order.id,
          shipmentNumber,
          recipientName: shipmentRecord.recipientName,
          recipientPhone: shipmentRecord.recipientPhone,
          addressLine: shipmentRecord.addressLine,
          city: shipmentRecord.city,
          state: shipmentRecord.state,
          pincode: shipmentRecord.pincode,
          items: shipmentRecord.items,
          awb: shipmentRecord.awb,
          courier: shipmentRecord.courier,
          labelUrl: shipmentRecord.labelUrl,
          status: shipmentRecord.status,
          collectCodAmountPaise: shipmentRecord.collectCodAmountPaise,
          trackingHistory: shipmentRecord.trackingHistory,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  await writeAudit({
    actor: params.actor,
    actorRole: params.actorRole,
    action: "shipment.created",
    entityType: "SHIPMENT",
    entityId: shipmentNumber,
    after: {
      orderNumber: order.orderNumber,
      awb: shipmentRecord.awb,
      courier: shipmentRecord.courier,
      recipientName: shipmentRecord.recipientName,
      status: shipmentRecord.status,
    },
  });

  // Evaluate if parent order should transition to DISPATCHED
  await syncParentOrderStatus(order.orderNumber, params.actor, params.actorRole);

  return shipmentRecord;
}

export function getShipmentsForOrder(orderNumber: string): StoredShipment[] {
  const shipments: StoredShipment[] = [];
  const seenIds = new Set<string>();

  for (const s of SHIPMENT_STORE.values()) {
    if (s.orderNumber === orderNumber && !seenIds.has(s.id)) {
      seenIds.add(s.id);
      shipments.push(s);
    }
  }

  return shipments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getShipmentByAwb(awb: string): StoredShipment | undefined {
  return SHIPMENT_STORE.get(awb);
}

/**
 * Synchronizes parent order status with the composite status of its shipments.
 * Rules:
 * - If all shipments DISPATCHED -> order moves to DISPATCHED
 * - If all shipments DELIVERED -> order moves to DELIVERED
 * - If any shipment RTO -> order moves to RTO
 */
export async function syncParentOrderStatus(
  orderNumber: string,
  actor: string = "system@shipping.sync",
  actorRole: string = "SYSTEM"
) {
  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) return;

  const shipments = getShipmentsForOrder(orderNumber);
  if (shipments.length === 0) return;

  const allDelivered = shipments.every((s) => s.status === "DELIVERED");
  const anyRto = shipments.some((s) => s.status === "RTO");
  const allDispatched = shipments.every(
    (s) => s.status === "DISPATCHED" || s.status === "IN_TRANSIT" || s.status === "DELIVERED"
  );

  try {
    if (anyRto && order.status !== "RTO") {
      await changeOrderStatus(
        order.id,
        "RTO",
        { email: actor, role: actorRole },
        `Shipment returned to origin by courier.`
      );
    } else if (allDelivered && order.status !== "DELIVERED") {
      await changeOrderStatus(
        order.id,
        "DELIVERED",
        { email: actor, role: actorRole },
        `All ${shipments.length} destination shipments delivered.`
      );
    } else if (allDispatched && order.status === "QC_PASSED") {
      await changeOrderStatus(
        order.id,
        "DISPATCHED",
        { email: actor, role: actorRole },
        `All ${shipments.length} package shipments created and manifested.`
      );
    }
  } catch {
    // Non-blocking state transition
  }
}

// -------------------------------------------------------------
// Split & Multi-Address CSV Dispatch Engine
// -------------------------------------------------------------

export interface SplitRowInput {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  quantity: number;
  notes?: string;
}

export interface SplitValidationRowResult {
  rowNumber: number;
  data: SplitRowInput;
  valid: boolean;
  errors: string[];
}

export interface SplitCsvValidationResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  totalQuantityInCsv: number;
  expectedOrderQuantity: number;
  quantityMatches: boolean;
  canExecute: boolean;
  rows: SplitValidationRowResult[];
}

const splitRowSchema = z.object({
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters."),
  phone: z
    .string()
    .regex(/^[6-9][0-9]{9}$/, "Must be a valid 10-digit Indian mobile number starting with 6-9."),
  address: z.string().min(5, "Address line must be at least 5 characters."),
  city: z.string().min(2, "City name is required."),
  state: z.string().min(2, "State name is required."),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Must be a valid 6-digit Indian PIN code."),
  quantity: z.number().int().min(1, "Quantity must be at least 1 unit."),
  notes: z.string().optional(),
});

/**
 * Validates a CSV string of split recipients against an order.
 * Enforces:
 * - 500 row maximum
 * - Row-by-row Zod schema checks
 * - Total sum of quantities equals total order item quantity
 */
export function validateSplitDispatchCsv(
  csvContent: string,
  expectedOrderQuantity: number
): SplitCsvValidationResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) {
    throw new Error("CSV file is empty or missing data rows.");
  }

  // Limit 500 data rows (excluding header)
  const dataLines = lines.slice(1);
  if (dataLines.length > 500) {
    throw new Error(`CSV exceeds maximum limit of 500 recipients (received ${dataLines.length} rows).`);
  }

  const rows: SplitValidationRowResult[] = [];
  let totalQty = 0;

  for (let idx = 0; idx < dataLines.length; idx++) {
    const rowNumber = idx + 2; // Line 1 is header
    const rawLine = dataLines[idx];
    const cols = parseCsvLine(rawLine);

    const rawData: SplitRowInput = {
      recipientName: cols[0]?.trim() || "",
      phone: cols[1]?.replace(/[^0-9]/g, "") || "",
      address: cols[2]?.trim() || "",
      city: cols[3]?.trim() || "",
      state: cols[4]?.trim() || "",
      pincode: cols[5]?.trim() || "",
      quantity: parseInt(cols[6]?.trim() || "0", 10),
      notes: cols[7]?.trim(),
    };

    const parseResult = splitRowSchema.safeParse(rawData);
    if (parseResult.success) {
      totalQty += rawData.quantity;
      rows.push({
        rowNumber,
        data: rawData,
        valid: true,
        errors: [],
      });
    } else {
      const errors = parseResult.error.issues.map((i) => i.message);
      rows.push({
        rowNumber,
        data: rawData,
        valid: false,
        errors,
      });
    }
  }

  const validRowsCount = rows.filter((r) => r.valid).length;
  const invalidRowsCount = rows.filter((r) => !r.valid).length;
  const quantityMatches = totalQty === expectedOrderQuantity;
  const canExecute = invalidRowsCount === 0 && quantityMatches;

  return {
    totalRows: dataLines.length,
    validRowsCount,
    invalidRowsCount,
    totalQuantityInCsv: totalQty,
    expectedOrderQuantity,
    quantityMatches,
    canExecute,
    rows,
  };
}

/**
 * Parses a single CSV line taking into account double quotes.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Returns clean CSV template for split dispatch download.
 */
export function getSplitDispatchCsvTemplate(): string {
  return [
    "Recipient Name,Phone,Address,City,State,PIN,Quantity,Notes",
    "Priya Nair,9876543210,Flat 301 Orchid Heights 4th Cross Indiranagar,Bengaluru,Karnataka,560038,1,Welcome Joinee Pack",
    "Vikramaditya Rao,9123456789,House 12 Sector 14 Hiranandani Estate,Thane,Maharashtra,400607,1,Welcome Joinee Pack",
  ].join("\r\n");
}

/**
 * Generates an error CSV from a validation result for quick user correction.
 */
export function generateErrorCsv(validation: SplitCsvValidationResult): string {
  const header = "Row,Recipient Name,Phone,Address,City,State,PIN,Quantity,Errors\r\n";
  const lines = validation.rows
    .filter((r) => !r.valid)
    .map((r) => {
      return [
        safeCsvCell(r.rowNumber),
        safeCsvCell(r.data.recipientName),
        safeCsvCell(r.data.phone),
        safeCsvCell(r.data.address),
        safeCsvCell(r.data.city),
        safeCsvCell(r.data.state),
        safeCsvCell(r.data.pincode),
        safeCsvCell(r.data.quantity),
        safeCsvCell(r.errors.join("; ")),
      ].join(",");
    });

  return header + lines.join("\r\n");
}

/**
 * Execute multi-address split dispatch row by row.
 * Safe retries: per-row status prevents re-executing already created shipments.
 */
export async function executeSplitDispatch(params: {
  orderNumber: string;
  rows: SplitRowInput[];
  actor: string;
  actorRole: string;
  providerName?: "MANUAL" | "SHIPROCKET";
}): Promise<{
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  failedCount: number;
  shipmentNumbers: string[];
  rowResults: Array<{ row: number; shipmentNumber?: string; awb?: string; status: "SUCCESS" | "FAILED"; error?: string }>;
}> {
  const order =
    ORDER_STORE.get(params.orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === params.orderNumber);

  if (!order) {
    throw new Error(`Order ${params.orderNumber} not found.`);
  }

  const rowResults: Array<{ row: number; shipmentNumber?: string; awb?: string; status: "SUCCESS" | "FAILED"; error?: string }> = [];
  const shipmentNumbers: string[] = [];

  for (let i = 0; i < params.rows.length; i++) {
    const row = params.rows[i];
    const rowIdx = i + 1;
    const deterministicShipmentNumber = `${order.orderNumber}-SH${rowIdx}`;

    // Skip if already created (safe retry protection)
    const existing = SHIPMENT_STORE.get(deterministicShipmentNumber);
    if (existing) {
      rowResults.push({
        row: rowIdx,
        shipmentNumber: existing.shipmentNumber,
        awb: existing.awb || undefined,
        status: "SUCCESS",
      });
      shipmentNumbers.push(existing.shipmentNumber);
      continue;
    }

    try {
      const shipment = await createSingleShipment({
        orderNumber: order.orderNumber,
        recipientName: row.recipientName,
        recipientPhone: row.phone,
        addressLine: row.address,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        items: [{ name: row.notes || "Merchandise Unit", qty: row.quantity }],
        providerName: params.providerName,
        actor: params.actor,
        actorRole: params.actorRole,
      });

      rowResults.push({
        row: rowIdx,
        shipmentNumber: shipment.shipmentNumber,
        awb: shipment.awb || undefined,
        status: "SUCCESS",
      });
      shipmentNumbers.push(shipment.shipmentNumber);
    } catch (err: unknown) {
      rowResults.push({
        row: rowIdx,
        status: "FAILED",
        error: (err as Error).message || "Failed to create shipment",
      });
    }
  }

  const createdCount = rowResults.filter((r) => r.status === "SUCCESS").length;
  const failedCount = rowResults.filter((r) => r.status === "FAILED").length;

  return {
    success: failedCount === 0,
    totalProcessed: params.rows.length,
    createdCount,
    failedCount,
    shipmentNumbers,
    rowResults,
  };
}
