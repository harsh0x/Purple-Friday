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

export const TrustChipSchema = z
  .object({
    id: z.string().max(40),
    label: z.string().min(1).max(50),
    icon: z.string().max(40).optional(),
  })
  .strict();

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
    trustChips: z
      .array(TrustChipSchema)
      .max(6)
      .default([
        { id: "c1", label: "Approve before we print" },
        { id: "c2", label: "Dispatch in 24–48 hours" },
        { id: "c3", label: "Pan-India courier" },
      ]),
    previewLogoText: z
      .string()
      .max(100)
      .default("Drop logo or vector file (PNG, SVG, PDF) to see 3D preview"),
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
    showOnHome: z.boolean().default(true),
  })
  .strict();

export const NavigationLinkSchema = z
  .object({
    id: z.string().max(40),
    label: z.string().min(1).max(50),
    url: z.string().min(1).max(200),
    sortOrder: z.number().int().default(0),
  })
  .strict();

export const NavigationConfigSchema = z
  .object({
    links: z.array(NavigationLinkSchema).max(20).default([]),
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
    whatsappNumber: z.string().max(30).default("+91 98765 43210"),
    officeAddress: z
      .string()
      .max(250)
      .default("42/1, 1st Cross, HSR Layout Sector 3, Bengaluru, Karnataka 560102"),
    newsletterTitle: z.string().max(80).default("The Print Dispatch Newsletter"),
    newsletterSubtitle: z
      .string()
      .max(200)
      .default("Prepress production guides, Pantone trend reports, and secret flash deals for corporate managers."),
    socialLinks: z
      .object({
        instagram: z.string().max(200).optional(),
        linkedin: z.string().max(200).optional(),
        twitter: z.string().max(200).optional(),
        youtube: z.string().max(200).optional(),
      })
      .default({}),
  })
  .strict();

export const DepartmentTileSchema = z
  .object({
    id: z.string().max(40),
    title: z.string().min(1).max(60),
    text: z.string().max(200),
    image: z.string().max(500),
    link: z.string().max(200),
    sortOrder: z.number().int().default(0),
  })
  .strict();

export const HowItWorksStepSchema = z
  .object({
    step: z.number().int(),
    title: z.string().min(1).max(80),
    description: z.string().max(300),
    tag: z.string().max(50).default(""),
  })
  .strict();

export const OrderProcessStepSchema = z
  .object({
    step: z.number().int(),
    title: z.string().min(1).max(80),
    description: z.string().max(300),
    duration: z.string().max(50).default(""),
  })
  .strict();

export const StatItemSchema = z
  .object({
    id: z.string().max(40),
    label: z.string().min(1).max(60),
    value: z.string().min(1).max(40),
    subtext: z.string().max(100).default(""),
  })
  .strict();

export const WallOfLoveEntrySchema = z
  .object({
    id: z.string().max(40),
    clientName: z.string().min(1).max(60),
    company: z.string().max(60),
    quote: z.string().min(5).max(400),
    rating: z.number().min(1).max(5).default(5),
    role: z.string().max(60).optional(),
  })
  .strict();

export const StoriesItemSchema = z
  .object({
    id: z.string().max(40),
    title: z.string().min(1).max(100),
    excerpt: z.string().max(250),
    link: z.string().max(200),
    readTime: z.string().max(30).default("4 min read"),
    tag: z.string().max(40).default("Dispatch"),
  })
  .strict();

export const ClosingBannerSchema = z
  .object({
    title: z.string().min(1).max(100).default("Ready to elevate your company merchandise?"),
    subtitle: z
      .string()
      .max(250)
      .default(
        "From 2-piece founder gifts to 50,000 offsite kits. Direct factory pricing with 100% pre-press proof guarantee."
      ),
    buttonText: z.string().max(40).default("Start Your Custom Order"),
    buttonUrl: z.string().max(200).default("/design/classic-crewneck-tshirt"),
    badgeText: z.string().max(60).default("PAN-INDIA EXPRESS AIR DISPATCH"),
  })
  .strict();

export const BestSellersConfigSchema = z
  .object({
    selectedProductSlugs: z.array(z.string().max(100)).max(30).default([]),
  })
  .strict();

export const CorePageSchema = z
  .object({
    id: z.string().max(40),
    slug: z.string().max(60),
    title: z.string().min(1).max(100),
    contentMarkdown: z.string().max(30000),
    seoTitle: z.string().max(100).default(""),
    seoDescription: z.string().max(300).default(""),
    updatedAt: z.string().default(() => new Date().toISOString()),
  })
  .strict();

export const CustomPageSchema = z
  .object({
    id: z.string().max(40),
    slug: z.string().min(2).max(100),
    title: z.string().min(1).max(100),
    contentMarkdown: z.string().max(50000),
    seoTitle: z.string().max(100).default(""),
    seoDescription: z.string().max(300).default(""),
    published: z.boolean().default(true),
    showInFooter: z.boolean().default(false),
    updatedAt: z.string().default(() => new Date().toISOString()),
  })
  .strict();

export const CmsBlogPostSchema = z
  .object({
    id: z.string().max(40),
    slug: z.string().min(2).max(100),
    title: z.string().min(3).max(150),
    coverImage: z.string().max(500).default(""),
    excerpt: z.string().min(5).max(500),
    contentMarkdown: z.string().max(50000),
    readingTimeMinutes: z.number().int().min(1).max(60).default(5),
    tags: z.array(z.string().max(40)).default([]),
    published: z.boolean().default(true),
    seoTitle: z.string().max(100).default(""),
    seoDescription: z.string().max(300).default(""),
    authorName: z.string().max(100).default("Purple Friday Atelier"),
    publishedAt: z.string().default(() => new Date().toISOString()),
  })
  .strict();

export const MediaItemSchema = z
  .object({
    id: z.string().max(40),
    url: z.string().min(1).max(1000),
    filename: z.string().min(1).max(255),
    alt: z.string().max(255).default(""),
    size: z.number().int().nonnegative().default(0),
    mimeType: z.string().max(100).default("image/png"),
    createdAt: z.string().default(() => new Date().toISOString()),
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
    announcements: z.array(AnnouncementMessageSchema).max(30).default([]),
    sections: z.array(HomepageSectionConfigSchema).max(20).default([]),
    faqs: z.array(FaqEntrySchema).max(60).default([]),
    navigation: NavigationConfigSchema.default({ links: [] }),
    footer: FooterConfigSchema,
    couponBanners: z.array(CouponBannerSchema).max(20).default([]),
    seo: z.array(PageSeoConfigSchema).max(50).default([]),
    departmentTiles: z.array(DepartmentTileSchema).max(12).default([]),
    howItWorks: z.array(HowItWorksStepSchema).max(10).default([]),
    orderProcess: z.array(OrderProcessStepSchema).max(10).default([]),
    stats: z.array(StatItemSchema).max(8).default([]),
    wallOfLove: z.array(WallOfLoveEntrySchema).max(20).default([]),
    stories: z.array(StoriesItemSchema).max(10).default([]),
    closingBanner: ClosingBannerSchema.default({
      title: "Ready to elevate your company merchandise?",
      subtitle:
        "From 2-piece founder gifts to 50,000 offsite kits. Direct factory pricing with 100% pre-press proof guarantee.",
      buttonText: "Start Your Custom Order",
      buttonUrl: "/design/classic-crewneck-tshirt",
      badgeText: "PAN-INDIA EXPRESS AIR DISPATCH",
    }),
    bestSellers: BestSellersConfigSchema.default({ selectedProductSlugs: [] }),
    corePages: z.array(CorePageSchema).max(10).default([]),
    customPages: z.array(CustomPageSchema).max(50).default([]),
    blogPosts: z.array(CmsBlogPostSchema).max(50).default([]),
    media: z.array(MediaItemSchema).max(200).default([]),
  })
  .strict();

export type HeroConfig = z.infer<typeof HeroConfigSchema>;
export type AnnouncementMessage = z.infer<typeof AnnouncementMessageSchema>;
export type HomepageSectionConfig = z.infer<typeof HomepageSectionConfigSchema>;
export type FaqEntry = z.infer<typeof FaqEntrySchema>;
export type NavigationLink = z.infer<typeof NavigationLinkSchema>;
export type NavigationConfig = z.infer<typeof NavigationConfigSchema>;
export type FooterLinkItem = z.infer<typeof FooterLinkItemSchema>;
export type FooterColumn = z.infer<typeof FooterColumnSchema>;
export type FooterConfig = z.infer<typeof FooterConfigSchema>;
export type CouponBanner = z.infer<typeof CouponBannerSchema>;
export type PageSeoConfig = z.infer<typeof PageSeoConfigSchema>;
export type DepartmentTile = z.infer<typeof DepartmentTileSchema>;
export type HowItWorksStep = z.infer<typeof HowItWorksStepSchema>;
export type OrderProcessStep = z.infer<typeof OrderProcessStepSchema>;
export type StatItem = z.infer<typeof StatItemSchema>;
export type WallOfLoveEntry = z.infer<typeof WallOfLoveEntrySchema>;
export type StoriesItem = z.infer<typeof StoriesItemSchema>;
export type ClosingBanner = z.infer<typeof ClosingBannerSchema>;
export type CorePage = z.infer<typeof CorePageSchema>;
export type CustomPage = z.infer<typeof CustomPageSchema>;
export type CmsBlogPost = z.infer<typeof CmsBlogPostSchema>;
export type MediaItem = z.infer<typeof MediaItemSchema>;
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
    trustChips: [
      { id: "c1", label: "Approve before we print" },
      { id: "c2", label: "Dispatch in 24–48 hours" },
      { id: "c3", label: "Pan-India courier" },
    ],
    previewLogoText: "Drop logo or vector file (PNG, SVG, PDF) to see 3D preview",
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
      showOnHome: true,
    },
    {
      id: "faq-vector",
      category: "Artwork",
      question: "What if my logo is only a low-res JPEG or PNG?",
      answer:
        "Our team vectorizes customer logos at no extra charge. We manually trace lines and verify typography so it renders crisp and sharp at any scale. If a file cannot be recovered cleanly, we contact you immediately with recommendations before proceeding.",
      sortOrder: 2,
      active: true,
      showOnHome: true,
    },
    {
      id: "faq-split",
      category: "Ordering",
      question: "Can we mix sizes and colors in a single apparel tier?",
      answer:
        "Absolutely. In a 50-piece hoodie order, you can split across Small, Medium, Large, and XL, and even mix fabric colours (e.g. 25 Black, 25 Navy) as long as the print artwork and print colourway remain identical.",
      sortOrder: 3,
      active: true,
      showOnHome: true,
    },
    {
      id: "faq-gst",
      category: "Billing",
      question: "Do you provide GST invoices and accept corporate POs?",
      answer:
        "Yes. Every order includes an official 18% GST invoice featuring your company's legal name, GSTIN, and state code for full input tax credit. For enterprise POs over ₹50,000, we also support net-30 vendor onboarding.",
      sortOrder: 4,
      active: true,
      showOnHome: true,
    },
  ],
  navigation: {
    links: [
      { id: "nav-tees", label: "Tees & Polos", url: "/category/tees", sortOrder: 1 },
      { id: "nav-hoodies", label: "Hoodies", url: "/category/hoodies", sortOrder: 2 },
      { id: "nav-badges", label: "Badges", url: "/category/badges", sortOrder: 3 },
      { id: "nav-corporate", label: "Corporate Gifting", url: "/corporate-gifting", sortOrder: 4 },
      { id: "nav-blog", label: "Press Log", url: "/blog", sortOrder: 5 },
    ],
  },
  footer: {
    brandStatement:
      "Purple Friday is India's premium custom merchandise atelier for high-growth tech startups and Fortune 500 enterprises.",
    copyrightText: "© 2026 Purple Friday Atelier Private Limited. All rights reserved.",
    contactEmail: "orders@purplefriday.in",
    contactPhone: "+91 80 4718 2000",
    whatsappNumber: "+91 98765 43210",
    officeAddress: "42/1, 1st Cross, HSR Layout Sector 3, Bengaluru, Karnataka 560102",
    newsletterTitle: "The Print Dispatch Newsletter",
    newsletterSubtitle:
      "Prepress production guides, Pantone trend reports, and secret flash deals for corporate managers.",
    socialLinks: {
      instagram: "https://instagram.com/purplefriday",
      linkedin: "https://linkedin.com/company/purplefriday",
      twitter: "https://twitter.com/purplefriday",
    },
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
  departmentTiles: [
    {
      id: "dep-apparel",
      title: "Heavyweight Textiles",
      text: "Combed bio-wash cotton tees and 380 GSM fleece hoodies with high-density embroidery",
      image: "/mockups/hoodie-black.png",
      link: "/category/hoodies",
      sortOrder: 1,
    },
    {
      id: "dep-badges",
      title: "Magnetic Badges",
      text: "Offset magnetic backings with scratch-proof crystal resin dome and brass plating",
      image: "/mockups/badge-front.png",
      link: "/category/badges",
      sortOrder: 2,
    },
    {
      id: "dep-drinkware",
      title: "Executive Drinkware",
      text: "Double-wall vacuum insulated flasks with rotary laser engraving",
      image: "/mockups/bottle-matte.png",
      link: "/corporate-gifting",
      sortOrder: 3,
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Choose Base Blank",
      description: "Select from curated combed cotton, metal badges, or stainless flasks.",
      tag: "Sourcing",
    },
    {
      step: 2,
      title: "Drop Vector Logo",
      description: "Instant 3D mockup calibration with automatic resolution pre-flight.",
      tag: "Pre-press",
    },
    {
      step: 3,
      title: "Approve 1:1 Proof",
      description: "Designer-prepared PDF proof with PMS spot match before printing.",
      tag: "Quality Gate",
    },
    {
      step: 4,
      title: "Air Dispatch Pan-India",
      description: "Dispatched from atelier floor to 28,000+ PIN codes with live tracking.",
      tag: "Logistics",
    },
  ],
  orderProcess: [
    {
      step: 1,
      title: "Digital Proof Generated",
      description: "Within 2 hours of order placement",
      duration: "2 Hours",
    },
    {
      step: 2,
      title: "Customer Sign-Off",
      description: "WhatsApp or email proof approval",
      duration: "Same Day",
    },
    {
      step: 3,
      title: "Precision Pressing",
      description: "Screen, DTF, or laser ablation",
      duration: "24-48 Hours",
    },
    {
      step: 4,
      title: "Express Dispatch",
      description: "Air courier to door",
      duration: "1-3 Days",
    },
  ],
  stats: [
    { id: "st-1", label: "Enterprise Clients", value: "2,400+", subtext: "Across India & SEA" },
    { id: "st-2", label: "Print Accuracy Rate", value: "99.8%", subtext: "Zero colorway variance" },
    { id: "st-3", label: "Pan-India PIN Codes", value: "28,000+", subtext: "Covered via air express" },
    { id: "st-4", label: "Average Proof SLA", value: "< 2 hrs", subtext: "Turnaround time" },
  ],
  wallOfLove: [
    {
      id: "wol-1",
      clientName: "Vikram Sethi",
      company: "Zomato",
      quote:
        "The 3D digital proof was pixel-accurate. When the 800 hoodies arrived for our hackathon, the embroidery tension was immaculate.",
      rating: 5,
      role: "VP Engineering",
    },
    {
      id: "wol-2",
      clientName: "Pooja Hegde",
      company: "Fintech Atelier",
      quote:
        "We order welcome hampers for all remote joiners. The magnetic badges feel executive grade and arrived in 48 hours.",
      rating: 5,
      role: "People Operations",
    },
  ],
  stories: [
    {
      id: "st-1",
      title: "Why vector curves beat 300 DPI rasters on metal badges",
      excerpt:
        "When edge-sharpness is measured in fractions of a millimeter, raster upscaling creates micro-fuzz. Here is how our vector auto-trace engine preserves crisp hairline typography.",
      link: "/blog/vector-proofs-300-dpi-guide",
      readTime: "4 min read",
      tag: "Pre-press",
    },
  ],
  closingBanner: {
    title: "Ready to elevate your company merchandise?",
    subtitle:
      "From 2-piece founder gifts to 50,000 offsite kits. Direct factory pricing with 100% pre-press proof guarantee.",
    buttonText: "Start Your Custom Order",
    buttonUrl: "/design/classic-crewneck-tshirt",
    badgeText: "PAN-INDIA EXPRESS AIR DISPATCH",
  },
  bestSellers: {
    selectedProductSlugs: [
      "classic-crewneck-tshirt",
      "classic-pullover-hoodie",
      "round-gloss-badge-58mm",
      "executive-pique-polo",
    ],
  },
  corePages: [
    {
      id: "cp-about",
      slug: "about",
      title: "About Our Print Atelier",
      contentMarkdown: `# About Purple Friday Atelier\n\nArtisan custom printing atelier for Indian startups, institutions, and enterprises.\n\n## Our Manufacturing Machinery\n- Tajima 14-Head High-Density Embroidery (Nagoya, Japan)\n- Brother GTX Pro Direct-to-Garment System (Tokyo, Japan)\n- Fiber Laser Rotary Engraving Rig (Biel, Switzerland)\n\n## 100% Pre-Print Approval\nWe never start pressing or stitching without your explicit WhatsApp/email signoff on exact 1:1 scale digital proofs.`,
      seoTitle: "About Our Print Atelier | Purple Friday",
      seoDescription:
        "The craft, machinery, and story behind Purple Friday. In-house manufacturing roots in Bengaluru and Tirupur, zero middlemen, and proof-ready precision.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cp-shipping",
      slug: "shipping-policy",
      title: "Shipping & Delivery Policy",
      contentMarkdown: `# Shipping & Delivery Policy\n\nExpress pan-India air dispatch across 28,000+ PIN codes.\n\n## SLAs & Dispatch Timelines\n- **Standard Apparel:** Dispatches in 24–48 hours after proof sign-off\n- **Custom Metal Badges:** Dispatches in 48–72 hours\n- **Air Express Transit:** 1–3 business days via Blue Dart and Delhivery\n\n## Free Shipping\nAll orders exceeding ₹2,500 qualify for 100% complimentary air shipping.`,
      seoTitle: "Shipping & Delivery Policy | Purple Friday",
      seoDescription:
        "Pan-India air courier dispatch timelines, tracking protocols, and delivery guarantees across 28,000+ PIN codes.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cp-cancellation",
      slug: "cancellation-and-refund",
      title: "Cancellation & Refund Policy",
      contentMarkdown: `# Cancellation & Refund Policy\n\nClear, transparent guidelines for customized print orders.\n\n## Cancellation Gate\nYou can cancel your order self-serve within 2 hours of placement before our pre-press designers begin film preparation.\n\n## Proof Revision Guarantee\nIf you are not satisfied with your digital proof, you can request unlimited design revisions or cancel for a 100% full refund before production starts.`,
      seoTitle: "Cancellation & Refund Policy | Purple Friday",
      seoDescription:
        "Information regarding our 2-hour pre-press cancellation window, proof revisions, and reprint guarantees.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cp-terms",
      slug: "terms",
      title: "Terms of Service",
      contentMarkdown: `# Terms of Service\n\nGoverned by the Laws of the Republic of India • Bengaluru Jurisdiction\n\n## 1. Commercial Scope\nThese Terms of Service govern all custom printing, apparel manufacturing, and merchandise fabrication orders placed with Purple Friday.\n\n## 2. Intellectual Property\nBy uploading artwork, you confirm you have legal authority to reproduce the mark.`,
      seoTitle: "Terms of Service | Purple Friday",
      seoDescription:
        "Commercial terms of service, B2B purchase orders, intellectual property, and production tolerances.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cp-privacy",
      slug: "privacy",
      title: "Privacy Policy",
      contentMarkdown: `# Privacy Policy\n\nYour security and privacy are paramount.\n\n## Data We Collect\nWe store contact information, shipping addresses, and uploaded artwork strictly to fulfill your merchandise orders.\n\n## We Never Sell Your Data\nYour details are never rented, sold, or shared with third-party advertisers.`,
      seoTitle: "Privacy Policy | Purple Friday",
      seoDescription:
        "How Purple Friday safeguards customer information, vector artwork uploads, and payment transactions.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cp-contact",
      slug: "contact",
      title: "Contact Atelier Support",
      contentMarkdown: `# Contact Atelier Support\n\nNeed assistance with a custom merchandise run, bulk quote, or sample request?\n\n- **Email:** orders@purplefriday.in\n- **Direct Line:** +91 80 4718 2000\n- **WhatsApp Desk:** +91 98765 43210\n- **Atelier Address:** 42/1, 1st Cross, HSR Layout Sector 3, Bengaluru, Karnataka 560102`,
      seoTitle: "Contact Us | Purple Friday",
      seoDescription:
        "Reach out to our Bengaluru print studio and prepress team for bulk quotation inquiries, proofs, or order tracking.",
      updatedAt: new Date().toISOString(),
    },
  ],
  customPages: [],
  blogPosts: [
    {
      id: "post-1",
      slug: "vector-proofs-300-dpi-guide",
      title: "Why vector curves beat 300 DPI rasters every single time on metal badges",
      coverImage: "/mockups/badge-front.png",
      excerpt:
        "When edge-sharpness is measured in fractions of a millimeter, raster upscaling creates micro-fuzz. Here is how our vector auto-trace engine preserves crisp hairline typography.",
      contentMarkdown: `# Why vector curves beat 300 DPI rasters on metal badges\n\nWhen edge-sharpness is measured in fractions of a millimeter on a 58mm metal badge, raster upscaling creates visible edge feathering under direct daylight.\n\nEven a 300 DPI JPEG image contains pixel grids that translate into jagged micro-steps when plated onto brass or zinc alloy.\n\n## The Mathematical Difference Between Rasters and Bezier Curves\n\nA raster image is a rigid coordinate grid of pixels. In contrast, vector formats store shapes as mathematical Bezier splines:\n\nThe laser or offset plate maker renders directly to the physical limit of the machine—at **2400 DPI physical resolution**.\n\n## Our Auto-Trace & Pre-Flight Protocol\n\nEvery logo uploaded to Purple Friday undergoes three automated quality gates:\n1. **Hairline Thickness Verification:** Ensuring no strokes are thinner than 0.15mm.\n2. **Pantone Spot Extraction:** Separating hex colors into ISO 12647 spot plates.\n3. **Curvature Optimization:** Smoothing anchor points to prevent jagged toolpaths on CNC laser heads.`,
      readingTimeMinutes: 4,
      tags: ["Prepress", "Typography", "Vector", "Badges"],
      published: true,
      seoTitle: "Why Vector Curves Beat 300 DPI Rasters | Purple Friday",
      seoDescription:
        "Deep dive into pre-press vector tolerances and laser engraving resolution for custom metal badges.",
      authorName: "Anand Ranganathan",
      publishedAt: new Date().toISOString(),
    },
  ],
  media: [],
};
