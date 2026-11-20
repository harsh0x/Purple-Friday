import { z } from "zod";

/**
 * Strips HTML tags and normalizes whitespace to enforce plain text safety.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // strip html tags
    .replace(/[\r\n]+/g, " ") // normalize linebreaks
    .trim();
}

export const HeroConfigSchema = z
  .object({
    badgeText: z.string().max(60).default("DIRECT FACTORY ATELIER • DISPATCHING PAN-INDIA"),
    headline: z.string().min(5).max(100).default("India's Cleanest Custom Merch & Corporate Gifting"),
    subtext: z
      .string()
      .min(10)
      .max(300)
      .default(
        "Low MOQs from 2 pieces for founder gifts to 50,000 for enterprise offsites. 100% digital proof approval before production."
      ),
    primaryButtonText: z.string().max(40).default("Start Instant Customizer"),
    primaryButtonUrl: z.string().max(200).default("/design/classic-crewneck-tshirt"),
    secondaryButtonText: z.string().max(40).default("Corporate Catalog & Swag Kits"),
    secondaryButtonUrl: z.string().max(200).default("/corporate-gifting"),
    quickProductsText: z.string().max(80).default("Instant Proofing Available For:"),
  })
  .strict();

export const AnnouncementMessageSchema = z
  .object({
    id: z.string().max(40),
    text: z.string().min(5).max(150),
    code: z.string().max(30).nullable().optional(),
    link: z.string().max(200).nullable().optional(),
    startDate: z.string().max(40).nullable().optional(),
    endDate: z.string().max(40).nullable().optional(),
    active: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })
  .strict();

export const HomepageSectionConfigSchema = z
  .object({
    id: z.enum([
      "hero",
      "trust",
      "best_sellers",
      "categories",
      "how_it_works",
      "reviews",
      "process",
      "stories",
      "factory",
      "faq",
      "cta",
    ]),
    name: z.string().max(60),
    visible: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })
  .strict();

export const FaqEntrySchema = z
  .object({
    id: z.string().max(40),
    category: z.string().max(50).default("General"),
    question: z.string().min(5).max(200),
    answer: z.string().min(10).max(1200),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  })
  .strict();

export const FooterLinkItemSchema = z
  .object({
    id: z.string().max(40),
    label: z.string().min(1).max(50),
    url: z.string().min(1).max(200),
  })
  .strict();

export const FooterColumnSchema = z
  .object({
    id: z.string().max(40),
    title: z.string().min(1).max(50),
    links: z.array(FooterLinkItemSchema).max(10),
  })
  .strict();

export const FooterConfigSchema = z
  .object({
    columns: z.array(FooterColumnSchema).max(6),
    brandStatement: z
      .string()
      .max(300)
      .default(
        "Purple Friday is India's premium custom merchandise atelier for high-growth tech startups and Fortune 500 enterprises."
      ),
    copyrightText: z.string().max(200).default("© 2026 Purple Friday Atelier Private Limited. All rights reserved."),
    contactEmail: z.string().email().max(100).default("orders@purplefriday.in"),
    contactPhone: z.string().max(30).default("+91 80 4718 2000"),
  })
  .strict();

export const CouponBannerSchema = z
  .object({
    id: z.string().max(40),
    title: z.string().min(3).max(100),
    subtitle: z.string().max(200),
    code: z.string().min(2).max(30),
    discountPercent: z.number().min(1).max(100).optional(),
    active: z.boolean().default(true),
    startDate: z.string().max(40).optional(),
    endDate: z.string().max(40).optional(),
  })
  .strict();

export const PageSeoConfigSchema = z
  .object({
    path: z.string().max(100), // e.g. "/", "/about", "/corporate-gifting"
    title: z.string().min(3).max(80),
    description: z.string().min(10).max(250),
    ogImage: z.string().max(300).optional(),
  })
  .strict();

export const StorefrontCmsDocumentSchema = z
  .object({
    hero: HeroConfigSchema,
    announcements: z.array(AnnouncementMessageSchema).max(20),
    sections: z.array(HomepageSectionConfigSchema).max(15),
    faqs: z.array(FaqEntrySchema).max(50),
    footer: FooterConfigSchema,
    couponBanners: z.array(CouponBannerSchema).max(10),
    seo: z.array(PageSeoConfigSchema).max(30),
  })
  .strict();

export type HeroConfig = z.infer<typeof HeroConfigSchema>;
export type AnnouncementMessage = z.infer<typeof AnnouncementMessageSchema>;
export type HomepageSectionConfig = z.infer<typeof HomepageSectionConfigSchema>;
export type FaqEntry = z.infer<typeof FaqEntrySchema>;
export type FooterLinkItem = z.infer<typeof FooterLinkItemSchema>;
export type FooterColumn = z.infer<typeof FooterColumnSchema>;
export type FooterConfig = z.infer<typeof FooterConfigSchema>;
export type CouponBanner = z.infer<typeof CouponBannerSchema>;
export type PageSeoConfig = z.infer<typeof PageSeoConfigSchema>;
export type StorefrontCmsDocument = z.infer<typeof StorefrontCmsDocumentSchema>;

/**
 * Built-in sensible defaults matching Purple Friday storefront design and content.
 */
export const DEFAULT_CMS_DOCUMENT: StorefrontCmsDocument = {
  hero: {
    badgeText: "DIRECT FACTORY ATELIER • DISPATCHING PAN-INDIA",
    headline: "India's Cleanest Custom Merch & Corporate Gifting",
    subtext:
      "Low MOQs from 2 pieces for founder gifts to 50,000 for enterprise offsites. 100% digital proof approval before production.",
    primaryButtonText: "Start Instant Customizer",
    primaryButtonUrl: "/design/classic-crewneck-tshirt",
    secondaryButtonText: "Corporate Catalog & Swag Kits",
    secondaryButtonUrl: "/corporate-gifting",
    quickProductsText: "Instant Proofing Available For:",
  },
  announcements: [
    {
      id: "ann-1",
      text: "Free express air courier across all India PIN codes on orders above ₹2,500",
      code: null,
      link: "/shipping-policy",
      startDate: null,
      endDate: null,
      active: true,
      sortOrder: 1,
    },
    {
      id: "ann-2",
      text: "Extra 12% off your first corporate merchandise run with code",
      code: "FIRSTORDER",
      link: "/checkout",
      startDate: null,
      endDate: null,
      active: true,
      sortOrder: 2,
    },
    {
      id: "ann-3",
      text: "Free 3D digital press proof approval before your merchandise hits the press",
      code: null,
      link: "/about",
      startDate: null,
      endDate: null,
      active: true,
      sortOrder: 3,
    },
  ],
  sections: [
    { id: "hero", name: "Hero Atelier Visualizer", visible: true, sortOrder: 1 },
    { id: "trust", name: "ISO Verification Strip", visible: true, sortOrder: 2 },
    { id: "best_sellers", name: "Curated Best Sellers", visible: true, sortOrder: 3 },
    { id: "categories", name: "Product Bento Grid", visible: true, sortOrder: 4 },
    { id: "how_it_works", name: "Prepress Workflow", visible: true, sortOrder: 5 },
    { id: "reviews", name: "Customer Review Proof Wall", visible: true, sortOrder: 6 },
    { id: "process", name: "Order Process Timeline", visible: true, sortOrder: 7 },
    { id: "stories", name: "Press & Atelier Stories", visible: true, sortOrder: 8 },
    { id: "factory", name: "Factory Floor & Team", visible: true, sortOrder: 9 },
    { id: "faq", name: "Frequently Asked Questions", visible: true, sortOrder: 10 },
    { id: "cta", name: "Closing Dispatch Call", visible: true, sortOrder: 11 },
  ],
  faqs: [
    {
      id: "faq-proof",
      category: "Proofing",
      question: "Will I see a proof before you print my order?",
      answer:
        "Yes, 100% of the time. Once you place an order, our pre-press designers prepare an exact 1:1 scale digital PDF proof specifying pantone/spot matches, dimensions, and positioning. We do not start production until you give explicit sign-off via email or WhatsApp.",
      sortOrder: 1,
      active: true,
    },
    {
      id: "faq-vector",
      category: "Artwork",
      question: "What if my logo is only a low-res JPEG or PNG?",
      answer:
        "Our team vectorizes customer logos at no extra charge. We manually trace lines and verify typography so it renders crisp and sharp at any scale. If a file cannot be recovered cleanly, we contact you immediately with recommendations before proceeding.",
      sortOrder: 2,
      active: true,
    },
    {
      id: "faq-split",
      category: "Ordering",
      question: "Can we mix sizes and colors in a single apparel tier?",
      answer:
        "Absolutely. In a 50-piece hoodie order, you can split across Small, Medium, Large, and XL, and even mix fabric colours (e.g. 25 Black, 25 Navy) as long as the print artwork and print colourway remain identical.",
      sortOrder: 3,
      active: true,
    },
    {
      id: "faq-gst",
      category: "Billing",
      question: "Do you provide GST invoices and accept corporate POs?",
      answer:
        "Yes. Every order includes an official 18% GST invoice featuring your company's legal name, GSTIN, and state code for full input tax credit. For enterprise POs over ₹50,000, we also support net-30 vendor onboarding.",
      sortOrder: 4,
      active: true,
    },
  ],
  footer: {
    brandStatement:
      "Purple Friday is India's premium custom merchandise atelier for high-growth tech startups and Fortune 500 enterprises.",
    copyrightText: "© 2026 Purple Friday Atelier Private Limited. All rights reserved.",
    contactEmail: "orders@purplefriday.in",
    contactPhone: "+91 80 4718 2000",
    columns: [
      {
        id: "col-products",
        title: "Apparel & Merch",
        links: [
          { id: "l1", label: "Heavyweight Hoodies", url: "/category/hoodies" },
          { id: "l2", label: "Executive Polos", url: "/category/polos" },
          { id: "l3", label: "Terry Cotton Tees", url: "/category/tees" },
          { id: "l4", label: "Magnetic Enamel Badges", url: "/category/badges" },
          { id: "l5", label: "Insulated Steel Drinkware", url: "/category/drinkware" },
        ],
      },
      {
        id: "col-corporate",
        title: "Corporate Gifting",
        links: [
          { id: "l6", label: "Onboarding Kits", url: "/corporate-gifting" },
          { id: "l7", label: "Bulk Quote Calculator", url: "/admin/quotes" },
          { id: "l8", label: "Sample Order Program", url: "/collections/best-sellers" },
          { id: "l9", label: "Multi-Address Air Dispatch", url: "/shipping-policy" },
        ],
      },
      {
        id: "col-legal",
        title: "Support & Legal",
        links: [
          { id: "l10", label: "Track Live Order", url: "/track-order" },
          { id: "l11", label: "Cancellation & Refunds", url: "/cancellation-and-refund" },
          { id: "l12", label: "Shipping Policy", url: "/shipping-policy" },
          { id: "l13", label: "Privacy Policy", url: "/privacy" },
          { id: "l14", label: "Terms of Service", url: "/terms" },
        ],
      },
    ],
  },
  couponBanners: [
    {
      id: "cb-1",
      title: "Special Corporate Introductory Offer",
      subtitle: "Get ₹1,000 off orders above ₹10,000 using corporate checkout",
      code: "CORP1000",
      discountPercent: 10,
      active: true,
    },
  ],
  seo: [
    {
      path: "/",
      title: "Purple Friday | India's Custom Merchandise & Corporate Gifting Atelier",
      description:
        "Order custom hoodies, t-shirts, magnetic badges, and executive drinkware with live 3D digital proofing and pan-India express air dispatch.",
      ogImage: "/og/home.png",
    },
    {
      path: "/corporate-gifting",
      title: "Corporate Gifting & Employee Onboarding Kits | Purple Friday",
      description:
        "Curated merchandise boxes, welcome hampers, and branded swag kits with multi-address CSV dispatch across 28,000+ PIN codes.",
      ogImage: "/og/corporate.png",
    },
  ],
};
