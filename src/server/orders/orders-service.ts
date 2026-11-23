import crypto from "crypto";
import {
  ORDER_STORE,
  StoredOrderRecord,
  OrderStatus,
  canTransition,
  normalizeOrderStatus,
  changeOrderStatus,
  getOrderByIdOrNumber,
} from "./state-machine";
import { safeCsvCell } from "@/lib/security/csv";
import { writeAudit } from "@/lib/admin/audit";
import { ORDER_ISSUES } from "@/server/customers/account-service";

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  product?: string;
  customer?: string;
  cityOrPin?: string;
  coupon?: string;
  minAmount?: number;
  maxAmount?: number;
  overdueOnly?: boolean;
  designerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt" | "total" | "slaDueAt";
  sortOrder?: "asc" | "desc";
}

export interface MaskedOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemCount: number;
  productNames: string[];
  totalPaise?: number; // Hidden for designers / factory
  paymentStatus?: string; // Hidden for designers / factory
  paymentMethod?: string;
  advancePaidPaise?: number;
  balanceDuePaise?: number;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  couponCode?: string | null;
  rtoRiskScore?: number | null;
  rtoRiskReasons?: string[];
  assignedDesignerId?: string | null;
  assignedDesignerName?: string | null;
  slaDueAt?: string | null;
  isOverdue: boolean;
  hoursRemaining?: number | null;
  isPaused: boolean;
  version: number;
}

export interface MaskedOrderDetail extends StoredOrderRecord {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
  };
  allowedTransitions: Array<{
    target: OrderStatus;
    label: string;
    requiresReason: boolean;
  }>;
  auditLogs?: Array<{
    id: string;
    actor: string;
    actorRole: string;
    action: string;
    createdAt: string;
    details?: string;
  }>;
}

// -------------------------------------------------------------
// Realistic Seed Orders for Purple Friday
// Covers all order states, apparel & gifting, SLA states
// -------------------------------------------------------------
function seedInitialOrders() {
  if (ORDER_STORE.size > 0) return;

  const now = Date.now();
  const hour = 3600 * 1000;
  const day = 24 * hour;

  const samples: StoredOrderRecord[] = [
    {
      id: "ord_pf_1001",
      orderNumber: "PF-2611-40891",
      userId: "usr_cust_01",
      status: "ORDER_PLACED",
      subtotal: 4500000,
      discount: 450000,
      gst: 729000,
      shipping: 0,
      total: 4779000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Aarav Sharma",
        email: "aarav.sharma@nexastech.in",
        phone: "+91 98450 12345",
        companyName: "Nexas Technologies Pvt Ltd",
        line1: "Embassy TechVillage, Tower 2B, 4th Floor",
        line2: "Outer Ring Road, Bellandur",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560103",
      },
      gstin: "29AABCN1234F1Z5",
      notes: "Corporate onboarding kit for December cohort. Needs premium matte finish packaging.",
      version: 1,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date(now - 1.5 * hour).toISOString(), // 1.5 hours ago (Customer can still cancel)
      updatedAt: new Date(now - 1.5 * hour).toISOString(),
      items: [
        {
          id: "item_101",
          productId: "classic-crewneck-tee",
          options: { sizeBreakdown: { S: 10, M: 25, L: 40, XL: 25 }, color: "Midnight Black" },
          qty: 100,
          unitPrice: 45000,
          artworkUrl: null,
          mockupUrl: null,
          printMethod: "DTF",
        },
      ],
      events: [
        {
          id: "evt_1001_1",
          type: "ORDER_CREATED",
          status: "ORDER_PLACED",
          actor: "Customer (aarav.sharma@nexastech.in)",
          actorRole: "CUSTOMER",
          message: "Order placed via Cash on Delivery / Pay Later.",
          createdAt: new Date(now - 1.5 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1002",
      orderNumber: "PF-2611-40892",
      userId: "usr_cust_02",
      status: "ARTWORK_UPLOADED",
      subtotal: 1850000,
      discount: 0,
      gst: 333000,
      shipping: 0,
      total: 2183000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Pooja Hegde",
        email: "pooja@cloudninehq.com",
        phone: "+91 98200 54321",
        companyName: "CloudNine Software",
        line1: "Godrej One, 8th Floor, Pirojshanagar",
        city: "Mumbai",
        state: "Maharashtra",
        pin: "400079",
      },
      notes: "Vector logo attached. Gold foil or high-density sublimation on ceramic.",
      version: 2,
      assignedDesignerId: "usr_des_ananya",
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date(now - 5 * hour).toISOString(),
      updatedAt: new Date(now - 4.5 * hour).toISOString(),
      items: [
        {
          id: "item_102",
          productId: "ceramic-coffee-mug",
          options: { color: "Matte White", finish: "Glossy Rim" },
          qty: 50,
          unitPrice: 37000,
          artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
          mockupUrl: null,
          printMethod: "Sublimation",
        },
      ],
      events: [
        {
          id: "evt_1002_1",
          type: "ORDER_CREATED",
          status: "ORDER_PLACED",
          actor: "Pooja Hegde (pooja@cloudninehq.com)",
          actorRole: "CUSTOMER",
          message: "Order placed.",
          createdAt: new Date(now - 5 * hour).toISOString(),
        },
        {
          id: "evt_1002_2",
          type: "STATUS_CHANGE",
          status: "ARTWORK_UPLOADED",
          actor: "Pooja Hegde (pooja@cloudninehq.com)",
          actorRole: "CUSTOMER",
          message: "High-res brand logo uploaded (300+ DPI PDF).",
          createdAt: new Date(now - 4.5 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1003",
      orderNumber: "PF-2611-40893",
      userId: "usr_cust_03",
      status: "MOCKUP_SENT",
      subtotal: 6200000,
      discount: 200000,
      gst: 1080000,
      shipping: 0,
      total: 7080000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Rohan Varma",
        email: "rohan@finflow.co",
        phone: "+91 97110 98765",
        companyName: "Finflow India",
        line1: "DLF Cyber City, Building 10, DLF Phase 2",
        city: "Gurugram",
        state: "Haryana",
        pin: "122002",
      },
      version: 3,
      assignedDesignerId: "usr_des_ananya",
      approvalTokenHash: "proof_token_hash_finflow_993",
      approvalTokenExpiresAt: new Date(now + 13 * day).toISOString(),
      mockupSentAt: new Date(now - 14 * hour).toISOString(),
      pausedAt: new Date(now - 14 * hour).toISOString(), // Clock currently paused
      totalPausedDurationMs: 0,
      slaDueAt: new Date(now + 34 * hour).toISOString(),
      nudgeCount: 0,
      createdAt: new Date(now - 20 * hour).toISOString(),
      updatedAt: new Date(now - 14 * hour).toISOString(),
      items: [
        {
          id: "item_103",
          productId: "heavyweight-hoodie",
          options: { sizeBreakdown: { M: 20, L: 30, XL: 10 }, color: "Charcoal Heather" },
          qty: 60,
          unitPrice: 103333,
          artworkUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
          mockupUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
          printMethod: "Embroidery",
          placement: { x: 35, y: 40, width: 90, height: 45, rotation: 0, pantone: "PMS 2685 C" },
        },
      ],
      events: [
        {
          id: "evt_1003_1",
          type: "STATUS_CHANGE",
          status: "MOCKUP_SENT",
          actor: "Ananya Deshmukh (ananya@purplefriday.com)",
          actorRole: "GRAPHIC_DESIGNER",
          message: "Front chest embroidery mockup prepared and emailed for client approval.",
          createdAt: new Date(now - 14 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1004",
      orderNumber: "PF-2611-40894",
      userId: "usr_cust_04",
      status: "CUSTOMER_APPROVED",
      subtotal: 3200000,
      discount: 0,
      gst: 576000,
      shipping: 0,
      total: 3776000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Kavita Reddy",
        email: "kavita.r@biovista.org",
        phone: "+91 99001 22334",
        companyName: "BioVista Diagnostics",
        line1: "HITEC City, Mindspace Madhapur",
        city: "Hyderabad",
        state: "Telangana",
        pin: "560081",
      },
      version: 4,
      assignedDesignerId: "usr_des_ananya",
      approvalTokenHash: "proof_token_hash_biovista_442",
      mockupSentAt: new Date(now - 10 * hour).toISOString(),
      customerApprovedAt: new Date(now - 2 * hour).toISOString(),
      totalPausedDurationMs: 8 * hour,
      slaDueAt: new Date(now + 46 * hour).toISOString(), // 46 hours left (> 24h -> GREEN)
      nudgeCount: 0,
      createdAt: new Date(now - 12 * hour).toISOString(),
      updatedAt: new Date(now - 2 * hour).toISOString(),
      items: [
        {
          id: "item_104",
          productId: "cotton-tote-bag",
          options: { color: "Natural Canvas", handleColor: "Royal Violet" },
          qty: 150,
          unitPrice: 21333,
          artworkUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
          mockupUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
          printMethod: "Screen Print",
          placement: { x: 30, y: 35, width: 120, height: 100, rotation: 0, pantone: "PMS Violet C" },
        },
      ],
      events: [
        {
          id: "evt_1004_1",
          type: "STATUS_CHANGE",
          status: "CUSTOMER_APPROVED",
          actor: "Kavita Reddy (kavita.r@biovista.org)",
          actorRole: "CUSTOMER",
          message: "Mockup approved digitally by client. Ready for factory floor.",
          createdAt: new Date(now - 2 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1005",
      orderNumber: "PF-2611-40895",
      userId: "usr_cust_05",
      status: "IN_PRINTING",
      subtotal: 5400000,
      discount: 0,
      gst: 972000,
      shipping: 0,
      total: 6372000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Vikramaditya Roy",
        email: "vikram@royalandco.in",
        phone: "+91 98310 11223",
        companyName: "Royal & Co Ventures",
        line1: "Park Street, 3rd Floor, Mansarovar Building",
        city: "Kolkata",
        state: "West Bengal",
        pin: "700016",
      },
      version: 5,
      assignedDesignerId: "usr_des_ananya",
      slaDueAt: new Date(now + 14 * hour).toISOString(), // 14h left (8 to 24h -> AMBER)
      totalPausedDurationMs: 6 * hour,
      nudgeCount: 0,
      createdAt: new Date(now - 36 * hour).toISOString(),
      updatedAt: new Date(now - 6 * hour).toISOString(),
      items: [
        {
          id: "item_105",
          productId: "stainless-steel-bottle",
          options: { color: "Matte Black", capacity: "750ml" },
          qty: 120,
          unitPrice: 45000,
          artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
          mockupUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
          printMethod: "Laser Engraving",
          placement: { x: 40, y: 50, width: 50, height: 80, rotation: 0 },
        },
      ],
      events: [
        {
          id: "evt_1005_1",
          type: "STATUS_CHANGE",
          status: "IN_PRINTING",
          actor: "Vikram Singhania (factory@purplefriday.com)",
          actorRole: "FACTORY_MANAGER",
          message: "Laser rotary engraving batch started on Machine #3.",
          createdAt: new Date(now - 6 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1006",
      orderNumber: "PF-2611-40896",
      userId: "usr_cust_06",
      status: "IN_PRINTING",
      subtotal: 7800000,
      discount: 300000,
      gst: 1350000,
      shipping: 0,
      total: 8850000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Meera Nair",
        email: "meera.n@keralalabs.com",
        phone: "+91 94470 33445",
        companyName: "Kerala Diagnostic Labs",
        line1: "Infopark Phase 2, Carnival Infopark",
        city: "Kochi",
        state: "Kerala",
        pin: "682042",
      },
      version: 6,
      slaDueAt: new Date(now + 4 * hour).toISOString(), // 4h left (< 8h -> RED)
      totalPausedDurationMs: 4 * hour,
      nudgeCount: 0,
      createdAt: new Date(now - 42 * hour).toISOString(),
      updatedAt: new Date(now - 2 * hour).toISOString(),
      items: [
        {
          id: "item_106",
          productId: "classic-crewneck-tee",
          options: { sizeBreakdown: { S: 30, M: 50, L: 70, XL: 50 }, color: "Heather Grey" },
          qty: 200,
          unitPrice: 39000,
          artworkUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
          mockupUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
          printMethod: "DTF",
        },
      ],
      events: [
        {
          id: "evt_1006_1",
          type: "STATUS_CHANGE",
          status: "IN_PRINTING",
          actor: "Vikram Singhania (factory@purplefriday.com)",
          actorRole: "FACTORY_MANAGER",
          message: "All 200 garments inspected. Print adhesion, wash test sample and folding checked.",
          createdAt: new Date(now - 2 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1007",
      orderNumber: "PF-2611-40897",
      userId: "usr_cust_07",
      status: "IN_PRINTING",
      subtotal: 2100000,
      discount: 0,
      gst: 378000,
      shipping: 0,
      total: 2478000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Arjun Rampal",
        email: "arjun@apexstudio.design",
        phone: "+91 99887 66554",
        companyName: "Apex Studio Design",
        line1: "Koregaon Park, Lane 7",
        city: "Pune",
        state: "Maharashtra",
        pin: "411001",
      },
      version: 5,
      slaDueAt: new Date(now - 6 * hour).toISOString(), // 6 hours past due -> OVERDUE BLINKING
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date(now - 56 * hour).toISOString(),
      updatedAt: new Date(now - 12 * hour).toISOString(),
      items: [
        {
          id: "item_107",
          productId: "heavyweight-hoodie",
          options: { sizeBreakdown: { M: 10, L: 15 }, color: "Deep Purple" },
          qty: 25,
          unitPrice: 84000,
          artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
          mockupUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
          printMethod: "DTF",
        },
      ],
      events: [
        {
          id: "evt_1007_1",
          type: "QC_REWORK",
          status: "IN_PRINTING",
          actor: "Vikram Singhania (factory@purplefriday.com)",
          actorRole: "FACTORY_MANAGER",
          message: "Quality Control rework flagged: Magenta printhead nozzle clog caused banding. Rerunning batch.",
          createdAt: new Date(now - 12 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1008",
      orderNumber: "PF-2611-40898",
      userId: "usr_cust_08",
      status: "DISPATCHED",
      subtotal: 9200000,
      discount: 500000,
      gst: 1566000,
      shipping: 0,
      total: 10266000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Sameer Joshi",
        email: "sameer@vertexventures.in",
        phone: "+91 98199 44556",
        companyName: "Vertex Ventures",
        line1: "Bandra Kurla Complex, G Block",
        city: "Mumbai",
        state: "Maharashtra",
        pin: "400051",
      },
      trackingNumber: "DELHIVERY-99283741029",
      version: 7,
      totalPausedDurationMs: 2 * hour,
      nudgeCount: 0,
      createdAt: new Date(now - 72 * hour).toISOString(),
      updatedAt: new Date(now - 10 * hour).toISOString(),
      items: [
        {
          id: "item_108",
          productId: "cotton-tote-bag",
          options: { color: "Midnight Black" },
          qty: 400,
          unitPrice: 23000,
          artworkUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80",
          mockupUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
          printMethod: "Screen Print",
        },
      ],
      events: [
        {
          id: "evt_1008_1",
          type: "STATUS_CHANGE",
          status: "DISPATCHED",
          actor: "Vikram Singhania (factory@purplefriday.com)",
          actorRole: "FACTORY_MANAGER",
          message: "Consignment handed over to Delhivery Express. AWB: DELHIVERY-99283741029.",
          createdAt: new Date(now - 10 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1009",
      orderNumber: "PF-2611-40899",
      userId: "usr_cust_09",
      status: "REVISION_REQUESTED",
      subtotal: 1250000,
      discount: 0,
      gst: 225000,
      shipping: 0,
      total: 1475000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Sneha Nair",
        email: "sneha@designspark.in",
        phone: "+91 97400 11998",
        companyName: "DesignSpark Studio",
        line1: "Indiranagar, 12th Main Road",
        city: "Bengaluru",
        state: "Karnataka",
        pin: "560038",
      },
      version: 4,
      assignedDesignerId: "usr_des_ananya",
      mockupSentAt: new Date(now - 24 * hour).toISOString(),
      pausedAt: new Date(now - 18 * hour).toISOString(),
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date(now - 30 * hour).toISOString(),
      updatedAt: new Date(now - 18 * hour).toISOString(),
      items: [
        {
          id: "item_109",
          productId: "ceramic-coffee-mug",
          options: { color: "Matte Black" },
          qty: 30,
          unitPrice: 41666,
          artworkUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
          mockupUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
          printMethod: "Sublimation",
        },
      ],
      events: [
        {
          id: "evt_1009_1",
          type: "STATUS_CHANGE",
          status: "REVISION_REQUESTED",
          actor: "Sneha Nair (sneha@designspark.in)",
          actorRole: "CUSTOMER",
          message: "Please scale the logo 15% larger and align strictly to the upper quadrant.",
          createdAt: new Date(now - 18 * hour).toISOString(),
        },
      ],
    },
    {
      id: "ord_pf_1010",
      orderNumber: "PF-2611-40900",
      userId: "usr_cust_10",
      status: "CANCELLED",
      subtotal: 3500000,
      discount: 0,
      gst: 630000,
      shipping: 0,
      total: 4130000,
      paymentMethod: "COD",
      paymentStatus: "PAID",
      address: {
        customerName: "Tarun Kapoor",
        email: "tarun@northstar.co",
        phone: "+91 99100 44332",
        companyName: "Northstar Logistics",
        line1: "Connaught Place, Block E",
        city: "New Delhi",
        state: "Delhi",
        pin: "110001",
      },
      cancellationReason: "Client postponed corporate conference to Q2 next fiscal year.",
      cancelledBy: "support@purplefriday.com",
      cancelledAt: new Date(now - 8 * hour).toISOString(),
      version: 3,
      totalPausedDurationMs: 0,
      nudgeCount: 0,
      createdAt: new Date(now - 48 * hour).toISOString(),
      updatedAt: new Date(now - 8 * hour).toISOString(),
      items: [
        {
          id: "item_110",
          productId: "classic-crewneck-tee",
          options: { sizeBreakdown: { M: 50, L: 50 }, color: "Navy Blue" },
          qty: 100,
          unitPrice: 35000,
        },
      ],
      events: [
        {
          id: "evt_1010_1",
          type: "STATUS_CHANGE",
          status: "CANCELLED",
          actor: "Support Agent (support@purplefriday.com)",
          actorRole: "SUPPORT_AGENT",
          message: "Order cancelled per client email request. Event postponed.",
          createdAt: new Date(now - 8 * hour).toISOString(),
        },
      ],
    },
  ];

  for (const s of samples) {
    ORDER_STORE.set(s.id, s);
    ORDER_STORE.set(s.orderNumber, s);
  }
}

// Ensure seed data is initialized on module load
seedInitialOrders();

/**
 * Calculates SLA metrics for an order.
 */
export function computeOrderSla(order: StoredOrderRecord): {
  isOverdue: boolean;
  hoursRemaining: number | null;
  isPaused: boolean;
  urgency: "green" | "amber" | "red" | "overdue" | "paused" | "completed";
} {
  // Terminal or cancelled orders have completed SLA
  if (["DELIVERED", "CANCELLED", "REFUNDED", "RTO"].includes(order.status)) {
    return { isOverdue: false, hoursRemaining: null, isPaused: false, urgency: "completed" };
  }

  // Waiting on customer = SLA paused
  if (order.status === "MOCKUP_SENT" || order.status === "REVISION_REQUESTED") {
    return { isOverdue: false, hoursRemaining: null, isPaused: true, urgency: "paused" };
  }

  // Due time: if slaDueAt exists use it, otherwise default to createdAt + 48h
  const baseTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
  const dueTime = order.slaDueAt
    ? new Date(order.slaDueAt).getTime()
    : baseTime + 48 * 3600 * 1000 + (order.totalPausedDurationMs || 0);

  const now = Date.now();
  const diffMs = dueTime - now;
  const hoursRemaining = Math.round(diffMs / (3600 * 1000));

  if (diffMs < 0) {
    return { isOverdue: true, hoursRemaining, isPaused: false, urgency: "overdue" };
  }

  if (hoursRemaining < 8) {
    return { isOverdue: false, hoursRemaining, isPaused: false, urgency: "red" };
  }
  if (hoursRemaining <= 24) {
    return { isOverdue: false, hoursRemaining, isPaused: false, urgency: "amber" };
  }
  return { isOverdue: false, hoursRemaining, isPaused: false, urgency: "green" };
}

/**
 * Lists orders with filtering, searching, pagination and strict role masking.
 */
export async function listAdminOrders(
  params: OrderListParams,
  viewerRole: string
): Promise<{
  orders: MaskedOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    totalOrders: number;
    pendingProof: number;
    inProduction: number;
    overdueCount: number;
  };
}> {
  seedInitialOrders();

  const isFinancialMasked = ["GRAPHIC_DESIGNER", "FACTORY_MANAGER"].includes(viewerRole.toUpperCase());

  // Aggregate in-memory list
  const allOrders = Array.from(new Set(ORDER_STORE.values()));

  const filtered = allOrders.filter((order) => {
    // 1. Status filter
    if (params.status && params.status !== "ALL") {
      if (params.status === "AWAITING_APPROVAL") {
        if (!["ARTWORK_UPLOADED", "MOCKUP_SENT"].includes(order.status)) {
          return false;
        }
      } else if (params.status === "ISSUE_REPORTED") {
        const hasIssue =
          order.status === "REVISION_REQUESTED" ||
          Array.from(ORDER_ISSUES.values()).some((i) => i.orderNumber === order.orderNumber) ||
          Boolean(order.events?.some((e) => e.type === "PROBLEM_REPORTED"));
        if (!hasIssue) {
          return false;
        }
      } else if (order.status !== normalizeOrderStatus(params.status)) {
        return false;
      }
    }

    // 2. Payment status
    if (params.paymentStatus && params.paymentStatus !== "ALL") {
      if ((order.paymentStatus || "PAID") !== params.paymentStatus) return false;
    }

    // 2b. Payment method
    if (params.paymentMethod && params.paymentMethod !== "ALL") {
      if ((order.paymentMethod || "").toUpperCase() !== params.paymentMethod.toUpperCase()) return false;
    }

    // 3. Search filter (order #, customer name, email, phone, tracking #, PIN)
    if (params.search && params.search.trim().length > 0) {
      const q = params.search.toLowerCase().trim();
      const addr = (order.address || {}) as Record<string, string>;
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = (addr.customerName || order.customerName || "").toLowerCase().includes(q);
      const matchEmail = (addr.email || order.customerEmail || "").toLowerCase().includes(q);
      const matchPhone = (addr.phone || order.customerPhone || "").toLowerCase().includes(q);
      const matchTracking = (order.trackingNumber || "").toLowerCase().includes(q);
      const matchCity = (addr.city || "").toLowerCase().includes(q);
      const matchPin = (addr.pin || "").toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchEmail && !matchPhone && !matchTracking && !matchCity && !matchPin) return false;
    }

    // 4. Overdue filter
    const sla = computeOrderSla(order);
    if (params.overdueOnly && !sla.isOverdue) {
      return false;
    }

    // 5. Designer filter
    if (params.designerId && order.assignedDesignerId !== params.designerId) {
      return false;
    }

    // 6. Product filter
    if (params.product) {
      const hasProd = order.items.some((i) => i.productId.toLowerCase().includes(params.product!.toLowerCase()));
      if (!hasProd) return false;
    }

    // 7. Date range filter
    if (params.dateFrom) {
      const fromTime = new Date(params.dateFrom).getTime();
      if (!isNaN(fromTime) && new Date(order.createdAt).getTime() < fromTime) return false;
    }
    if (params.dateTo) {
      const toTime = new Date(params.dateTo).getTime();
      if (!isNaN(toTime) && new Date(order.createdAt).getTime() > toTime) return false;
    }

    // 8. Amount range filter (handles input in Rupees or Paise)
    if (params.minAmount !== undefined) {
      const minPaise = params.minAmount > 1000 ? params.minAmount : params.minAmount * 100;
      if (order.total < minPaise) return false;
    }
    if (params.maxAmount !== undefined) {
      const maxPaise = params.maxAmount > 1000 ? params.maxAmount : params.maxAmount * 100;
      if (order.total > maxPaise) return false;
    }

    // 9. City or PIN filter
    if (params.cityOrPin) {
      const q = params.cityOrPin.toLowerCase().trim();
      const addr = (order.address || {}) as Record<string, string>;
      const matchCity = (addr.city || "").toLowerCase().includes(q);
      const matchPin = (addr.pin || "").toLowerCase().includes(q);
      if (!matchCity && !matchPin) return false;
    }

    // 10. Coupon filter
    if (params.coupon) {
      const q = params.coupon.toLowerCase().trim();
      const matchCoupon = (order.couponCode || "").toLowerCase().includes(q);
      const hasDiscount = q === "any" && (order.discount || 0) > 0;
      if (!matchCoupon && !hasDiscount) return false;
    }

    return true;
  });

  // Sorting
  if (params.sortBy === "total") {
    filtered.sort((a, b) => (params.sortOrder === "asc" ? a.total - b.total : b.total - a.total));
  } else if (params.sortBy === "slaDueAt") {
    filtered.sort((a, b) => {
      const aTime = a.slaDueAt ? new Date(a.slaDueAt).getTime() : 0;
      const bTime = b.slaDueAt ? new Date(b.slaDueAt).getTime() : 0;
      return params.sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  } else {
    filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return params.sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
  }

  // Calculate high-level stats
  const pendingProof = allOrders.filter(
    (o) => o.status === "ARTWORK_UPLOADED" || o.status === "REVISION_REQUESTED"
  ).length;
  const inProduction = allOrders.filter(
    (o) => o.status === "IN_PRINTING" || o.status === "CUSTOMER_APPROVED"
  ).length;
  const overdueCount = allOrders.filter((o) => computeOrderSla(o).isOverdue).length;

  // Pagination
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const mapped: MaskedOrderSummary[] = paginated.map((order) => {
    const sla = computeOrderSla(order);
    const addr = order.address as Record<string, string>;
    const productNames = Array.from(
      new Set(order.items.map((i) => i.productId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())))
    );

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      customerName: addr.customerName || "Customer",
      customerEmail: addr.email || "",
      customerPhone: addr.phone,
      itemCount: order.items.reduce((acc, i) => acc + i.qty, 0),
      productNames,
      totalPaise: isFinancialMasked ? undefined : order.total,
      paymentStatus: isFinancialMasked ? undefined : order.paymentStatus || "PAID",
      paymentMethod: order.paymentMethod,
      advancePaidPaise: order.advancePaidPaise,
      balanceDuePaise: order.balanceDuePaise,
      courierName: order.courierName || null,
      trackingNumber: order.trackingNumber || null,
      trackingUrl: order.trackingUrl || null,
      couponCode: order.couponCode || null,
      rtoRiskScore: order.rtoRiskScore ?? 0,
      rtoRiskReasons: order.rtoRiskReasons ?? [],
      assignedDesignerId: order.assignedDesignerId,
      assignedDesignerName: order.assignedDesignerId ? "Ananya Deshmukh" : null,
      slaDueAt: order.slaDueAt,
      isOverdue: sla.isOverdue,
      hoursRemaining: sla.hoursRemaining,
      isPaused: sla.isPaused,
      version: order.version,
    };
  });

  return {
    orders: mapped,
    total,
    page,
    pageSize,
    totalPages,
    stats: {
      totalOrders: allOrders.length,
      pendingProof,
      inProduction,
      overdueCount,
    },
  };
}

/**
 * Gets full order details with timeline, allowed actions, and role data masking.
 */
export async function getAdminOrderDetail(
  orderNumber: string,
  viewerRole: string
): Promise<MaskedOrderDetail | null> {
  seedInitialOrders();

  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) return null;

  const isFinancialMasked = ["GRAPHIC_DESIGNER", "FACTORY_MANAGER"].includes(viewerRole.toUpperCase());
  const addr = (order.address || {}) as Record<string, string>;

  // Compute allowed transitions for admin
  const possibleTargets: Array<{ target: OrderStatus; label: string; requiresReason: boolean }> = [
    { target: "ARTWORK_UPLOADED", label: "Upload Artwork", requiresReason: false },
    { target: "MOCKUP_SENT", label: "Send Mockup Proof", requiresReason: false },
    { target: "CUSTOMER_APPROVED", label: "Approve Proof", requiresReason: false },
    { target: "REVISION_REQUESTED", label: "Request Revision", requiresReason: true },
    { target: "IN_PRINTING", label: "Start Printing", requiresReason: false },
    { target: "DISPATCHED", label: "Mark Dispatched", requiresReason: false },
    { target: "DELIVERED", label: "Mark Delivered", requiresReason: false },
    { target: "RTO", label: "Mark Return to Origin (RTO)", requiresReason: true },
    { target: "CANCELLED", label: "Cancel Order", requiresReason: true },
    { target: "REFUNDED", label: "Issue Refund", requiresReason: true },
  ];

  const allowedTransitions = possibleTargets.filter((t) => {
    const check = canTransition(order.status, t.target, {
      orderCreatedAt: order.createdAt,
      moneyPaid: order.paymentStatus === "PAID" || order.total > 0,
      reason: "Check preview",
    });
    return check.allowed;
  });

  return {
    ...order,
    // Mask prices if designer or factory
    subtotal: isFinancialMasked ? 0 : order.subtotal,
    discount: isFinancialMasked ? 0 : order.discount,
    gst: isFinancialMasked ? 0 : order.gst,
    shipping: isFinancialMasked ? 0 : order.shipping,
    total: isFinancialMasked ? 0 : order.total,
    paymentMethod: isFinancialMasked ? "MASKED" : order.paymentMethod,
    paymentStatus: isFinancialMasked ? "MASKED" : order.paymentStatus,
    items: order.items.map((i) => ({
      ...i,
      unitPrice: isFinancialMasked ? 0 : i.unitPrice,
    })),
    customerName: addr.customerName || "Customer",
    customerEmail: addr.email || "",
    customerPhone: addr.phone || "",
    shippingAddress: {
      line1: addr.line1 || "",
      line2: addr.line2,
      city: addr.city || "",
      state: addr.state || "",
      pin: addr.pin || "",
    },
    allowedTransitions,
  };
}

/**
 * Bulk assigns a designer to multiple orders.
 */
export async function bulkAssignDesigner(
  orderNumbers: string[],
  designerId: string,
  actor: { email: string; role: string; name?: string }
): Promise<{ count: number; updated: string[] }> {
  seedInitialOrders();
  const updated: string[] = [];

  for (const num of orderNumbers) {
    const order =
      ORDER_STORE.get(num) ||
      Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === num);

    if (order) {
      order.assignedDesignerId = designerId;
      order.version += 1;
      order.updatedAt = new Date().toISOString();

      const event = {
        id: `evt_assign_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
        type: "DESIGNER_ASSIGNED",
        status: order.status,
        actor: actor.name ? `${actor.name} (${actor.email})` : actor.email,
        actorRole: actor.role.toUpperCase(),
        message: `Assigned to Graphic Designer (${designerId}).`,
        createdAt: new Date().toISOString(),
      };
      order.events = [event, ...(order.events || [])];
      ORDER_STORE.set(order.id, order);
      ORDER_STORE.set(order.orderNumber, order);
      updated.push(order.orderNumber);

      await writeAudit({
        actor: actor.email,
        actorRole: actor.role.toUpperCase(),
        action: "order.designer_assigned",
        entityType: "ORDER",
        entityId: order.orderNumber,
        after: { assignedDesignerId: designerId, version: order.version },
      });
    }
  }

  return { count: updated.length, updated };
}

/**
 * Adds an internal staff note to an order.
 */
export async function addOrderInternalNote(
  orderNumber: string,
  noteText: string,
  actor: { email: string; role: string; name?: string }
): Promise<{ success: boolean; eventId: string }> {
  seedInitialOrders();
  const order =
    ORDER_STORE.get(orderNumber) ||
    Array.from(ORDER_STORE.values()).find((o) => o.orderNumber === orderNumber);

  if (!order) throw new Error(`Order ${orderNumber} not found.`);

  const now = new Date();
  const nextVersion = order.version + 1;
  const eventId = `evt_note_${now.getTime()}_${crypto.randomBytes(3).toString("hex")}`;

  const event = {
    id: eventId,
    type: "INTERNAL_NOTE",
    status: order.status,
    actor: actor.name ? `${actor.name} (${actor.email})` : actor.email,
    actorRole: actor.role.toUpperCase(),
    message: noteText,
    createdAt: now.toISOString(),
  };

  order.version = nextVersion;
  order.notes = order.notes ? `${order.notes}\n[${now.toISOString().slice(0, 10)}] ${noteText}` : noteText;
  order.events = [event, ...(order.events || [])];
  order.updatedAt = now.toISOString();

  ORDER_STORE.set(order.id, order);
  ORDER_STORE.set(order.orderNumber, order);

  await writeAudit({
    actor: actor.email,
    actorRole: actor.role.toUpperCase(),
    action: "order.internal_note_added",
    entityType: "ORDER",
    entityId: order.orderNumber,
    after: { note: noteText, version: nextVersion },
  });

  return { success: true, eventId };
}

/**
 * Exports orders to CSV with DDE formula injection sanitization.
 */
export async function exportOrdersCsv(
  params: OrderListParams,
  viewerRole: string
): Promise<string> {
  const result = await listAdminOrders({ ...params, pageSize: 5000 }, viewerRole);
  const isFinancialMasked = ["GRAPHIC_DESIGNER", "FACTORY_MANAGER"].includes(viewerRole.toUpperCase());

  const headers = [
    "Order Number",
    "Date (IST)",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Status",
    "Items Count",
    "Products",
    ...(isFinancialMasked ? [] : ["Total (INR)", "Payment Status", "Payment Method"]),
    "Courier",
    "Tracking Number",
    "SLA Due (IST)",
    "Is Overdue",
  ];

  const rows = result.orders.map((o) => {
    const row = [
      safeCsvCell(o.orderNumber),
      safeCsvCell(o.createdAt),
      safeCsvCell(o.customerName),
      safeCsvCell(o.customerEmail),
      safeCsvCell(o.customerPhone || ""),
      safeCsvCell(o.status),
      safeCsvCell(String(o.itemCount)),
      safeCsvCell(o.productNames.join(", ")),
      ...(isFinancialMasked
        ? []
        : [
          safeCsvCell(((o.totalPaise || 0) / 100).toFixed(2)),
          safeCsvCell(o.paymentStatus || "PAID"),
          safeCsvCell(o.paymentMethod || "COD"),
        ]),
      safeCsvCell(o.courierName || ""),
      safeCsvCell(o.trackingNumber || ""),
      safeCsvCell(o.slaDueAt || "N/A"),
      safeCsvCell(o.isOverdue ? "YES" : "NO"),
    ];
    return row.join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

/**
 * Updates shipping address for an order (allowed only before dispatch).
 */
export async function updateOrderAddress(
  orderNumber: string,
  newAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
    phone?: string;
    customerName?: string;
  },
  actor: { email: string; role: string; name?: string },
  expectedVersion?: number
): Promise<{ success: boolean; order: StoredOrderRecord }> {
  seedInitialOrders();
  const order = await getOrderByIdOrNumber(orderNumber);
  if (!order) throw new Error(`Order ${orderNumber} not found.`);

  const lockedStatuses = ["DISPATCHED", "DELIVERED", "CANCELLED", "REFUNDED", "RTO"];
  if (lockedStatuses.includes(order.status)) {
    throw new Error(`Address cannot be modified after dispatch (${order.status}).`);
  }

  if (expectedVersion !== undefined && order.version !== expectedVersion) {
    throw new Error("Someone else changed this order, refresh.");
  }

  const prevAddr = { ...order.address };
  order.address = {
    ...order.address,
    ...newAddress,
  };
  order.shippingAddress = {
    line1: newAddress.line1,
    line2: newAddress.line2,
    city: newAddress.city,
    state: newAddress.state,
    pin: newAddress.pin,
  };
  if (newAddress.phone) order.customerPhone = newAddress.phone;
  if (newAddress.customerName) order.customerName = newAddress.customerName;

  order.version += 1;
  order.updatedAt = new Date().toISOString();

  const event = {
    id: `evt_addr_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
    type: "ADDRESS_UPDATED",
    status: order.status,
    actor: actor.name ? `${actor.name} (${actor.email})` : actor.email,
    actorRole: actor.role.toUpperCase(),
    message: `Delivery address updated to ${newAddress.line1}, ${newAddress.city} - ${newAddress.pin}.`,
    createdAt: new Date().toISOString(),
  };
  order.events = [event, ...(order.events || [])];

  ORDER_STORE.set(order.id, order);
  ORDER_STORE.set(order.orderNumber, order);

  await writeAudit({
    actor: actor.email,
    actorRole: actor.role.toUpperCase(),
    action: "order.address_updated",
    entityType: "ORDER",
    entityId: order.orderNumber,
    before: { address: prevAddr, version: order.version - 1 },
    after: { address: order.address, version: order.version },
  });

  return { success: true, order };
}

/**
 * Marks order shipped with mandatory courier name and tracking number.
 */
export async function markOrderShipped(
  orderNumber: string,
  shippingData: { courierName: string; trackingNumber: string; trackingUrl?: string },
  actor: { email: string; role: string; name?: string },
  expectedVersion?: number
) {
  if (!shippingData.courierName?.trim()) {
    throw new Error("Courier name is required to mark order as shipped.");
  }
  if (!shippingData.trackingNumber?.trim()) {
    throw new Error("Tracking number is required to mark order as shipped.");
  }
  const order = await getOrderByIdOrNumber(orderNumber);
  if (!order) throw new Error(`Order ${orderNumber} not found.`);

  order.courierName = shippingData.courierName.trim();
  order.trackingNumber = shippingData.trackingNumber.trim();
  order.trackingUrl = shippingData.trackingUrl?.trim() || null;

  return changeOrderStatus(
    orderNumber,
    "DISPATCHED",
    actor,
    `Shipped via ${order.courierName} (${order.trackingNumber})`,
    expectedVersion
  );
}

/**
 * Marks order delivered.
 */
export async function markOrderDelivered(
  orderNumber: string,
  actor: { email: string; role: string; name?: string },
  expectedVersion?: number
) {
  return changeOrderStatus(orderNumber, "DELIVERED", actor, "Delivered to customer", expectedVersion);
}

/**
 * Cancels order with required reason.
 */
export async function cancelOrderWithReason(
  orderNumber: string,
  reason: string,
  actor: { email: string; role: string; name?: string },
  expectedVersion?: number
) {
  if (!reason || reason.trim().length === 0) {
    throw new Error("Cancellation requires a written justification reason.");
  }
  return changeOrderStatus(orderNumber, "CANCELLED", actor, reason.trim(), expectedVersion);
}

/**
 * Bulk order status mutation (Dispatched, Delivered, Cancelled).
 */
export async function bulkChangeOrderStatus(
  orderNumbers: string[],
  targetStatus: "DISPATCHED" | "DELIVERED" | "CANCELLED",
  actor: { email: string; role: string; name?: string },
  details?: { reason?: string; courierName?: string; trackingNumber?: string; trackingUrl?: string }
): Promise<{
  successCount: number;
  failureCount: number;
  results: Array<{ orderNumber: string; success: boolean; error?: string }>;
}> {
  seedInitialOrders();
  const results: Array<{ orderNumber: string; success: boolean; error?: string }> = [];
  let successCount = 0;
  let failureCount = 0;

  for (const num of orderNumbers) {
    try {
      if (targetStatus === "DISPATCHED") {
        if (!details?.courierName || !details?.trackingNumber) {
          throw new Error("Courier name and tracking number are required for bulk dispatch.");
        }
        await markOrderShipped(
          num,
          {
            courierName: details.courierName,
            trackingNumber: details.trackingNumber,
            trackingUrl: details.trackingUrl,
          },
          actor
        );
      } else if (targetStatus === "DELIVERED") {
        await markOrderDelivered(num, actor);
      } else if (targetStatus === "CANCELLED") {
        if (!details?.reason || !details.reason.trim()) {
          throw new Error("Cancellation reason is required.");
        }
        await cancelOrderWithReason(num, details.reason, actor);
      }
      results.push({ orderNumber: num, success: true });
      successCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      results.push({ orderNumber: num, success: false, error: msg });
      failureCount++;
    }
  }

  return { successCount, failureCount, results };
}
