import { ALL_PRODUCTS } from "../catalogue";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  categorySlug: string;
  mrp: number;
  basePrice: number;
  minQty: number;
  qtyStep: number;
  active: boolean;
  priceTiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
}

export interface AdminCoupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minSubtotal: number;
  firstOrderOnly: boolean;
  expiresAt?: string | null;
  active: boolean;
  usageCount: number;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  photoUrls: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface AdminQuote {
  id: string;
  productSlug: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity?: number;
  budget?: number;
  notes?: string;
  briefFileUrl?: string;
  status: "IN_TOUCH" | "QUOTED" | "WON" | "LOST";
  createdAt: string;
}

// In-Memory Global Registries (Fallbacks for seed and local dev)
const PRODUCT_STORE = new Map<string, AdminProduct>();
const COUPON_STORE = new Map<string, AdminCoupon>();
const REVIEW_STORE = new Map<string, AdminReview>();
const QUOTE_STORE = new Map<string, AdminQuote>();

// Seed Products
function initProducts() {
  if (PRODUCT_STORE.size > 0) return;
  for (const p of ALL_PRODUCTS) {
    PRODUCT_STORE.set(p.slug, {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortName: p.shortName,
      categorySlug: p.categorySlug,
      mrp: p.mrp,
      basePrice: p.basePrice,
      minQty: p.minQty,
      qtyStep: p.qtyStep,
      active: true,
      priceTiers: p.priceTiers,
    });
  }
}

// Seed Coupons
function initCoupons() {
  if (COUPON_STORE.size > 0) return;
  const initialCoupons: AdminCoupon[] = [
    {
      id: "coup_1",
      code: "FIRSTORDER",
      type: "PERCENTAGE",
      value: 12,
      minSubtotal: 1000,
      firstOrderOnly: true,
      expiresAt: "2026-12-31T23:59:59Z",
      active: true,
      usageCount: 42,
      createdAt: new Date().toISOString(),
    },
    {
      id: "coup_2",
      code: "BULK15",
      type: "PERCENTAGE",
      value: 15,
      minSubtotal: 15000,
      firstOrderOnly: false,
      expiresAt: "2026-12-31T23:59:59Z",
      active: true,
      usageCount: 18,
      createdAt: new Date().toISOString(),
    },
    {
      id: "coup_3",
      code: "FESTIVE500",
      type: "FLAT",
      value: 500,
      minSubtotal: 5000,
      firstOrderOnly: false,
      expiresAt: "2026-11-30T23:59:59Z",
      active: true,
      usageCount: 9,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const c of initialCoupons) {
    COUPON_STORE.set(c.id, c);
  }
}

// Seed Reviews
function initReviews() {
  if (REVIEW_STORE.size > 0) return;
  const initialReviews: AdminReview[] = [
    {
      id: "rev_1",
      productId: "round-gloss-badge-58mm",
      productName: "58mm Round Gloss Magnetic Badge",
      authorName: "Ananya Deshmukh",
      rating: 5,
      title: "Outstanding finish, strong magnets!",
      body: "We ordered 200 badges for our annual developer summit in Bengaluru. The dual magnets held perfectly through thick blazers without leaving a single pinhole.",
      verified: true,
      photoUrls: ["/templates/badge-gloss.svg"],
      status: "APPROVED",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "rev_2",
      productId: "heavyweight-oversized-tee-240gsm",
      productName: "240 GSM Heavyweight Oversized Cotton T-Shirt",
      authorName: "Devendra Verma",
      rating: 5,
      title: "Screen print crispness is 10/10",
      body: "The 240 GSM french terry feels substantial. Our white vector logo on jet black showed zero crack after washing test.",
      verified: true,
      photoUrls: ["/templates/tee-heavy.svg"],
      status: "APPROVED",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "rev_3",
      productId: "matte-insulated-steel-flask",
      productName: "Double-Wall Insulated Matte Steel Flask (750ml)",
      authorName: "Meera Krishnan",
      rating: 4,
      title: "Laser engraving looks ultra premium",
      body: "The matte powder coat with silver laser etched logo came out very clean. One bottle had slight coating scuff on base, but replacement was delivered in 48 hours.",
      verified: true,
      photoUrls: [],
      status: "PENDING",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "rev_4",
      productId: "classic-pique-polo-220gsm",
      productName: "Classic 220 GSM Combed Cotton Piqué Polo",
      authorName: "Rahul Sengupta",
      rating: 5,
      title: "Perfect corporate executive apparel",
      body: "Embroidered chest logo is tight with 12,000 stitches. Size chart was completely accurate across S to 3XL.",
      verified: true,
      photoUrls: [],
      status: "PENDING",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const r of initialReviews) {
    REVIEW_STORE.set(r.id, r);
  }
}

// Seed Quotes
function initQuotes() {
  if (QUOTE_STORE.size > 0) return;
  const initialQuotes: AdminQuote[] = [
    {
      id: "quote_1",
      productSlug: "onboarding-kit-artisan",
      productName: "Artisan Welcome Kit (Matte Flask, Notebook, Pen & Badge)",
      customerName: "Pooja Hegde",
      customerEmail: "pooja.h@techscale.io",
      customerPhone: "+91 98450 11223",
      quantity: 150,
      budget: 150000,
      notes: "Need customized dual-colour packaging sleeve and individual employee name tags for Q4 new joiners.",
      briefFileUrl: "/templates/bottle-matte.svg",
      status: "IN_TOUCH",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "quote_2",
      productSlug: "heavyweight-oversized-tee-240gsm",
      productName: "240 GSM Heavyweight Oversized Cotton T-Shirt",
      customerName: "Karan Johar",
      customerEmail: "karan@creatorhub.co",
      customerPhone: "+91 98200 44556",
      quantity: 500,
      budget: 250000,
      notes: "Front puff print + back high-density screen print. Pantone 2685 C matching essential.",
      briefFileUrl: "/templates/tee-heavy.svg",
      status: "QUOTED",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ];

  for (const q of initialQuotes) {
    QUOTE_STORE.set(q.id, q);
  }
}

// Ensure initialized
initProducts();
initCoupons();
initReviews();
initQuotes();

// Product CRUD
export function getAdminProducts(): AdminProduct[] {
  initProducts();
  return Array.from(PRODUCT_STORE.values());
}

export function updateAdminProduct(slug: string, updates: Partial<AdminProduct>): AdminProduct | undefined {
  initProducts();
  const existing = PRODUCT_STORE.get(slug);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  PRODUCT_STORE.set(slug, updated);
  return updated;
}

// Coupon CRUD
export function getAdminCoupons(): AdminCoupon[] {
  initCoupons();
  return Array.from(COUPON_STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveAdminCoupon(coupon: Omit<AdminCoupon, "id" | "createdAt" | "usageCount"> & { id?: string }): AdminCoupon {
  initCoupons();
  const id = coupon.id || `coup_${Date.now()}`;
  const existing = COUPON_STORE.get(id);
  const record: AdminCoupon = {
    id,
    code: coupon.code.toUpperCase().trim(),
    type: coupon.type,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal,
    firstOrderOnly: coupon.firstOrderOnly,
    expiresAt: coupon.expiresAt || null,
    active: coupon.active,
    usageCount: existing ? existing.usageCount : 0,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
  COUPON_STORE.set(id, record);
  return record;
}

export function deleteAdminCoupon(id: string): boolean {
  initCoupons();
  return COUPON_STORE.delete(id);
}

// Review CRUD
export function getAdminReviews(): AdminReview[] {
  initReviews();
  return Array.from(REVIEW_STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateAdminReviewStatus(id: string, status: "APPROVED" | "REJECTED"): AdminReview | undefined {
  initReviews();
  const rev = REVIEW_STORE.get(id);
  if (!rev) return undefined;
  rev.status = status;
  REVIEW_STORE.set(id, rev);
  return rev;
}

export function addAdminReview(review: Omit<AdminReview, "id" | "createdAt">): AdminReview {
  initReviews();
  const id = `rev_${Date.now()}`;
  const record: AdminReview = {
    ...review,
    id,
    createdAt: new Date().toISOString(),
  };
  REVIEW_STORE.set(id, record);
  return record;
}

// Quote CRUD
export function getAdminQuotes(): AdminQuote[] {
  initQuotes();
  return Array.from(QUOTE_STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveAdminQuote(quote: Omit<AdminQuote, "id" | "createdAt" | "status"> & { id?: string; status?: AdminQuote["status"] }): AdminQuote {
  initQuotes();
  const id = quote.id || `quote_${Date.now()}`;
  const existing = QUOTE_STORE.get(id);
  const record: AdminQuote = {
    id,
    productSlug: quote.productSlug,
    productName: quote.productName,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    quantity: quote.quantity,
    budget: quote.budget,
    notes: quote.notes,
    briefFileUrl: quote.briefFileUrl,
    status: quote.status || (existing ? existing.status : "IN_TOUCH"),
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
  QUOTE_STORE.set(id, record);
  return record;
}

export function updateAdminQuoteStatus(id: string, status: AdminQuote["status"]): AdminQuote | undefined {
  initQuotes();
  const quote = QUOTE_STORE.get(id);
  if (!quote) return undefined;
  quote.status = status;
  QUOTE_STORE.set(id, quote);
  return quote;
}
