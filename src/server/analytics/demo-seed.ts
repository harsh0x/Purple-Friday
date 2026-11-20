import crypto from "crypto";
import { ORDER_STORE, StoredOrderRecord } from "@/server/orders/state-machine";
import { roundHalfUp } from "@/server/pricing/engine";
import prisma from "@/lib/prisma";

export interface DemoSeedResult {
  totalOrdersCreated: number;
  sampleOrdersCount: number;
  bulkOrdersCount: number;
  repeatCustomersCount: number;
  rtoCount: number;
  deliveredCount: number;
  dateRange: { start: string; end: string };
}

const CORPORATE_CLIENTS = [
  { name: "Aarav Sharma", email: "aarav.procurement@razorpay.com", company: "Razorpay Software Pvt Ltd", city: "Bengaluru", state: "Karnataka", pin: "560030", isRepeat: true },
  { name: "Pooja Hegde", email: "pooja.people@zomato.com", company: "Zomato Media Pvt Ltd", city: "Gurugram", state: "Haryana", pin: "122002", isRepeat: true },
  { name: "Nikhil Kamath", email: "operations@zerodha.com", company: "Zerodha Broking Ltd", city: "Bengaluru", state: "Karnataka", pin: "560078", isRepeat: true },
  { name: "Sneha Nair", email: "sneha.hr@swiggy.in", company: "Swiggy Technologies", city: "Bengaluru", state: "Karnataka", pin: "560103", isRepeat: true },
  { name: "Kunal Shah", email: "kunal.admin@cred.club", company: "Dreamplug Technologies (CRED)", city: "Bengaluru", state: "Karnataka", pin: "560038", isRepeat: true },
  { name: "Vikramaditya Rao", email: "admin@infosys.com", company: "Infosys BPM Limited", city: "Pune", state: "Maharashtra", pin: "411057", isRepeat: true },
  { name: "Ananya Deshmukh", email: "ananya.ops@freshworks.com", company: "Freshworks Inc", city: "Chennai", state: "Tamil Nadu", pin: "600096", isRepeat: true },
  { name: "Rohan Varma", email: "rohan@groww.in", company: "Groww Invest Tech", city: "Bengaluru", state: "Karnataka", pin: "560034", isRepeat: true },
  { name: "Meera Sundaram", email: "merchandise@titan.co.in", company: "Titan Company Ltd", city: "Bengaluru", state: "Karnataka", pin: "560100", isRepeat: true },
  { name: "Aditya Chopra", email: "culture@cult.fit", company: "Curefit Healthcare", city: "Bengaluru", state: "Karnataka", pin: "560068", isRepeat: true },
  // Occasional / One-time buyers
  { name: "Gaurav Sen", email: "gaurav@senconsulting.in", company: "Sen Consulting", city: "Delhi", state: "Delhi", pin: "110001", isRepeat: false },
  { name: "Ritu Kapoor", email: "ritu@kapoorlaw.com", company: "Kapoor & Associates", city: "Mumbai", state: "Maharashtra", pin: "400001", isRepeat: false },
  { name: "Deepak Verma", email: "deepak@vermatech.io", company: "Verma Labs", city: "Hyderabad", state: "Telangana", pin: "500081", isRepeat: false },
  { name: "Sunil Rao", email: "sunil.rao@aerocorp.in", company: "Aero Corp India", city: "Noida", state: "Uttar Pradesh", pin: "201301", isRepeat: false },
  { name: "Priyanka Patel", email: "priyanka@ahmedabadfin.com", company: "Gujarat Fin Services", city: "Ahmedabad", state: "Gujarat", pin: "380015", isRepeat: false },
  { name: "Arjun Nair", email: "arjun@kochinav.in", company: "Kochi Marine Logistics", city: "Kochi", state: "Kerala", pin: "682001", isRepeat: false },
  { name: "Harish Gupta", email: "harish@chandigarhedu.org", company: "North Valley Academics", city: "Chandigarh", state: "Punjab", pin: "160017", isRepeat: false },
  { name: "Suresh Menon", email: "suresh@menonprint.in", company: "Menon Agencies", city: "Coimbatore", state: "Tamil Nadu", pin: "641001", isRepeat: false },
];

const DEMO_PRODUCTS = [
  { id: "prod-polo", title: "Classic Pique Polo Shirt", category: "Apparel", sku: "BLANK-POLO-NAVY-M", samplePricePaise: 79900, bulkPricePaise: 54900, costPaise: 34000 },
  { id: "prod-hoodie", title: "Apex Heavyweight Pullover Hoodie", category: "Apparel", sku: "BLANK-HOODIE-BLK-L", samplePricePaise: 149900, bulkPricePaise: 119900, costPaise: 72000 },
  { id: "prod-tee", title: "Essential Bio-Wash T-Shirt", category: "Apparel", sku: "BLANK-TEE-WHT-L", samplePricePaise: 49900, bulkPricePaise: 32000, costPaise: 19000 },
  { id: "prod-tumbler", title: "Insulated Hydra Flask 750ml", category: "Drinkware", sku: "BLANK-FLASK-750-MATTE", samplePricePaise: 89900, bulkPricePaise: 59900, costPaise: 36000 },
  { id: "prod-badge", title: "Executive Enamel Lapel Pin", category: "Accessories", sku: "BLANK-PIN-GOLD-25MM", samplePricePaise: 19900, bulkPricePaise: 8500, costPaise: 4000 },
  { id: "prod-kit", title: "New Joinee Onboarding Pack", category: "Kits", sku: "KIT-ONBOARD-EXEC", samplePricePaise: 249900, bulkPricePaise: 189900, costPaise: 115000 },
  { id: "prod-cap", title: "Embroidered Twill Dad Cap", category: "Headwear", sku: "BLANK-CAP-NAVY", samplePricePaise: 49900, bulkPricePaise: 32000, costPaise: 18000 },
  { id: "prod-diary", title: "Vegan Leather Hardbound Executive Notebook", category: "Stationery", sku: "BLANK-NOTEBOOK-TAN-A5", samplePricePaise: 59900, bulkPricePaise: 38000, costPaise: 21000 },
];

/**
 * Deterministic pseudo-random number generator for reproducible demo analytics data.
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Creates ~400 realistic orders spread across 12 months with:
 * - Samples (2 pcs)
 * - Bulk orders (20 to 500 pcs)
 * - Repeat corporate buyers
 * - Seasonal spikes around Diwali (Oct-Nov), New Year (Dec-Jan), and April fiscal year onboarding
 * - Intentional RTOs (~15 orders)
 *
 * SAFETY GUARD: Refuses to execute in production.
 */
export async function seedAnalyticsDemoData(): Promise<DemoSeedResult> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL SAFETY GUARD: Analytics demo seed is strictly forbidden in production.");
  }

  const nowMs = Date.now();
  const ONE_DAY_MS = 24 * 3600 * 1000;
  const startMs = nowMs - 365 * ONE_DAY_MS;

  let totalOrdersCreated = 0;
  let sampleOrdersCount = 0;
  let bulkOrdersCount = 0;
  let rtoCount = 0;
  let deliveredCount = 0;

  // Track customer order history for sample-to-bulk conversion linkage
  const customerFirstOrderTime = new Map<string, number>();

  // 12 Months: generate targeted batches per month (total target: ~400 orders)
  // Month index 0 (11 months ago) to 11 (current month)
  for (let m = 0; m < 12; m++) {
    const monthStartMs = startMs + m * 30.5 * ONE_DAY_MS;
    const dateObj = new Date(monthStartMs);
    const calendarMonth = dateObj.getMonth(); // 0 = Jan, 3 = Apr, 9 = Oct, 10 = Nov, 11 = Dec

    // Seasonal Multipliers:
    // Diwali (Oct/Nov = 9, 10): 55-60 orders
    // New Year / Year-End (Dec/Jan = 11, 0): 45-50 orders
    // April (Fiscal Onboarding = 3): 50-55 orders
    // Baseline other months: ~25 orders
    let targetMonthOrders = 25;
    if (calendarMonth === 9 || calendarMonth === 10) {
      targetMonthOrders = 55; // Diwali rush
    } else if (calendarMonth === 11 || calendarMonth === 0) {
      targetMonthOrders = 45; // New Year rush
    } else if (calendarMonth === 3) {
      targetMonthOrders = 50; // April onboarding rush
    }

    for (let i = 0; i < targetMonthOrders; i++) {
      const seedVal = m * 1000 + i;
      const dayOffsetMs = seededRandom(seedVal) * 29 * ONE_DAY_MS;
      const orderTimeMs = Math.min(nowMs - 3600 * 1000, monthStartMs + dayOffsetMs);
      const orderDate = new Date(orderTimeMs);
      const orderDateStr = orderDate.toISOString();

      // Pick client
      const isCorporate = seededRandom(seedVal + 1) < 0.70;
      const clientIndex = Math.floor(
        seededRandom(seedVal + 2) * (isCorporate ? 10 : CORPORATE_CLIENTS.length)
      );
      const client = CORPORATE_CLIENTS[clientIndex];

      const clientFirstTime = customerFirstOrderTime.get(client.email);
      let isSample = false;
      let orderQty = 1;

      if (!clientFirstTime) {
        customerFirstOrderTime.set(client.email, orderTimeMs);
        // First order: 40% probability of being a 1-2 piece sample
        if (seededRandom(seedVal + 3) < 0.40) {
          isSample = true;
          orderQty = seededRandom(seedVal + 4) < 0.5 ? 1 : 2;
        } else {
          // Bulk directly
          orderQty = 20 + Math.floor(seededRandom(seedVal + 4) * 80);
        }
      } else {
        // Repeat order: likely bulk (20 to 500 units)
        const daysSinceFirst = (orderTimeMs - clientFirstTime) / ONE_DAY_MS;
        if (daysSinceFirst <= 60 && seededRandom(seedVal + 5) < 0.65) {
          // Sample-to-bulk converter!
          orderQty = 25 + Math.floor(seededRandom(seedVal + 6) * 150);
        } else {
          orderQty = 20 + Math.floor(seededRandom(seedVal + 7) * 200);
        }
      }

      if (isSample) {
        sampleOrdersCount++;
      } else {
        bulkOrdersCount++;
      }

      // Pick product
      const productIdx = Math.floor(seededRandom(seedVal + 8) * DEMO_PRODUCTS.length);
      const product = DEMO_PRODUCTS[productIdx];
      const unitPricePaise = isSample ? product.samplePricePaise : product.bulkPricePaise;
      const subtotalPaise = unitPricePaise * orderQty;
      const gstPaise = roundHalfUp(subtotalPaise * 0.18);
      const shippingPaise = orderQty >= 20 ? 0 : 15000;
      const totalPaise = subtotalPaise + gstPaise + shippingPaise;

      // Determine Status
      const isRecent = nowMs - orderTimeMs < 7 * ONE_DAY_MS;
      let status: StoredOrderRecord["status"] = "DELIVERED";
      const paymentStatus = "PAID";
      let isRto = false;

      // 4% realistic RTO rate on non-recent orders
      if (!isRecent && seededRandom(seedVal + 9) < 0.04) {
        status = "RTO";
        isRto = true;
        rtoCount++;
      } else if (isRecent) {
        const roll = seededRandom(seedVal + 10);
        if (roll < 0.15) status = "ORDER_PLACED";
        else if (roll < 0.30) status = "ARTWORK_UPLOADED";
        else if (roll < 0.45) status = "MOCKUP_SENT";
        else if (roll < 0.60) status = "CUSTOMER_APPROVED";
        else if (roll < 0.75) status = "IN_PRINTING";
        else if (roll < 0.90) status = "QC_PASSED";
        else status = "DISPATCHED";
      } else {
        deliveredCount++;
      }

      const orderNumber = `PF-DEMO-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, "0")}-${String(totalOrdersCreated + 1).padStart(4, "0")}`;

      const demoOrder: StoredOrderRecord = {
        id: `ord_demo_${crypto.randomUUID()}`,
        orderNumber,
        status,
        subtotal: Math.round(subtotalPaise / 100),
        discount: 0,
        gst: Math.round(gstPaise / 100),
        shipping: Math.round(shippingPaise / 100),
        total: Math.round(totalPaise / 100),
        paymentMethod: seededRandom(seedVal + 11) < 0.25 ? "COD" : "RAZORPAY",
        paymentStatus,
        address: {
          customerName: client.name,
          customerEmail: client.email,
          customerPhone: `98${String(10000000 + (totalOrdersCreated % 89999999))}`,
          companyName: client.company,
          line1: `Plot ${10 + (totalOrdersCreated % 90)}, Tech Park Road`,
          city: client.city,
          state: client.state,
          pin: client.pin,
        },
        items: [
          {
            id: `item_demo_${totalOrdersCreated}_1`,
            productId: product.id,
            options: { color: "Navy", size: "L" },
            qty: orderQty,
            unitPrice: Math.round(unitPricePaise / 100),
            mockupUrl: "/assets/products/polo-navy.jpg",
          },
        ],
        events: [
          {
            id: `evt_demo_${totalOrdersCreated}_1`,
            type: "ORDER_CREATED",
            status: "ORDER_PLACED",
            actor: client.email,
            actorRole: "CUSTOMER",
            message: `Order placed for ${orderQty} units of ${product.title}.`,
            createdAt: orderDateStr,
          },
        ],
        version: 1,
        totalPausedDurationMs: 0,
        nudgeCount: 0,
        advancePaidPaise: Math.round(totalPaise * 0.25),
        balanceDuePaise: status === "DELIVERED" ? 0 : Math.round(totalPaise * 0.75),
        rtoRiskScore: isRto ? 65 : 10,
        rtoRiskReasons: isRto ? ["Customer delivery refusal reported by courier"] : [],
        createdAt: orderDateStr,
        updatedAt: orderDateStr,
      };

      // Add to ORDER_STORE
      ORDER_STORE.set(orderNumber, demoOrder);
      totalOrdersCreated++;
    }
  }

  // Pre-seed some sample AdSpend rows over the last 12 months for margin engine
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(startMs + m * 30.5 * ONE_DAY_MS);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    // Ad spend between Rs 25,000 and Rs 65,000 per month
    const adSpendRupees = 30000 + (m % 4) * 8000;
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
        await prisma.adSpend.upsert({
          where: { date: monthKey },
          update: { amountPaise: adSpendRupees * 100 },
          create: {
            date: monthKey,
            amountPaise: adSpendRupees * 100,
            channel: "META_GOOGLE_PERFORMANCE",
            notes: "Monthly blended digital acquisition spend",
          },
        });
      }
    } catch {}
  }

  return {
    totalOrdersCreated,
    sampleOrdersCount,
    bulkOrdersCount,
    repeatCustomersCount: 10,
    rtoCount,
    deliveredCount,
    dateRange: {
      start: new Date(startMs).toISOString(),
      end: new Date(nowMs).toISOString(),
    },
  };
}
