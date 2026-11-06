import { unstable_cache } from "next/cache";
import prisma from "./prisma";

export interface CatalogueProduct {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  categorySlug: string;
  description: string;
  badges: string[];
  specChips: string[];
  audience: "TEAM" | "GIFTING" | "BOTH";
  minQty: number;
  qtyStep: number;
  isBestSeller: boolean;
  mrp: number;
  basePrice: number;
  printMethod: string;
  template: string;
  rating: number;
  reviewCount: number;
  colors: Array<{ name: string; hex: string }>;
  priceTiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
  createdAt?: string;
}

export const ALL_PRODUCTS: CatalogueProduct[] = [
  // --- Magnetic Badges ---
  {
    id: "round-gloss-badge-58mm",
    slug: "round-gloss-badge-58mm",
    name: "58mm Round Gloss Magnetic Badge",
    shortName: "58mm Round Badge",
    categorySlug: "magnetic-badges",
    description: "Artisan gloss-laminated metallic badge backed by dual neodymium magnets. Industry standard for trade shows and conferences.",
    badges: ["Best Seller", "Zero Pinholes"],
    specChips: ["58mm Diameter", "Offset Proofing", "Neodymium Mag-Back"],
    audience: "BOTH",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: true,
    mrp: 140,
    basePrice: 85,
    printMethod: "Offset CMYK + Gloss Mylar",
    template: "badge",
    rating: 4.9,
    reviewCount: 142,
    colors: [
      { name: "White Core", hex: "#FFFFFF" },
      { name: "Ink Black", hex: "#15101F" },
      { name: "Spot Violet", hex: "#6A2CFF" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 49, unitPrice: 85 },
      { minQty: 50, maxQty: 99, unitPrice: 65 },
      { minQty: 100, maxQty: 249, unitPrice: 52 },
      { minQty: 250, maxQty: null, unitPrice: 42 },
    ],
  },
  {
    id: "matte-rectangle-name-badge",
    slug: "matte-rectangle-name-badge",
    name: "Executive Rectangle Magnetic Name Badge (70x25mm)",
    shortName: "Executive Name Badge",
    categorySlug: "magnetic-badges",
    description: "Brushed metallic acrylic name badge with UV-printed company logo and personalized employee name.",
    badges: ["Executive Grade"],
    specChips: ["70x25mm", "Beveled Edge", "Individual Personalization"],
    audience: "TEAM",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 220,
    basePrice: 160,
    printMethod: "Precision UV Print",
    template: "badge",
    rating: 4.8,
    reviewCount: 68,
    colors: [
      { name: "Brushed Silver", hex: "#C0C0C0" },
      { name: "Brushed Gold", hex: "#D4AF37" },
      { name: "Matte Black", hex: "#15101F" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 19, unitPrice: 160 },
      { minQty: 20, maxQty: 49, unitPrice: 135 },
      { minQty: 50, maxQty: 99, unitPrice: 115 },
      { minQty: 100, maxQty: null, unitPrice: 95 },
    ],
  },
  {
    id: "metallic-gold-lapel-badge",
    slug: "metallic-gold-lapel-badge",
    name: "Custom Die-Cast Metallic Lapel Pin",
    shortName: "Die-Cast Lapel Pin",
    categorySlug: "magnetic-badges",
    description: "Jewelry-grade zinc alloy die-struck badge with soft enamel color infill and magnetic clutch.",
    badges: ["Premium Gift"],
    specChips: ["Die-Cast Zinc", "Soft Enamel", "Butterfly or Magnet"],
    audience: "GIFTING",
    minQty: 25,
    qtyStep: 25,
    isBestSeller: false,
    mrp: 350,
    basePrice: 240,
    printMethod: "Die-Struck Enamel",
    template: "badge",
    rating: 5.0,
    reviewCount: 39,
    colors: [
      { name: "Antique Gold", hex: "#CFB53B" },
      { name: "Nickel Silver", hex: "#E5E4E2" },
    ],
    priceTiers: [
      { minQty: 25, maxQty: 49, unitPrice: 240 },
      { minQty: 50, maxQty: 99, unitPrice: 190 },
      { minQty: 100, maxQty: 249, unitPrice: 150 },
      { minQty: 250, maxQty: null, unitPrice: 120 },
    ],
  },
  {
    id: "clear-acrylic-conference-badge",
    slug: "clear-acrylic-conference-badge",
    name: "Laser Cut Clear Acrylic Conference Badge",
    shortName: "Acrylic Badge",
    categorySlug: "magnetic-badges",
    description: "Glass-look 3mm clear acrylic badge with reverse UV color printing and polished flame-buffed edges.",
    badges: ["Modern Tech"],
    specChips: ["3mm Cast Acrylic", "Flame Polished", "Reverse Print"],
    audience: "TEAM",
    minQty: 15,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 180,
    basePrice: 110,
    printMethod: "Reverse UV High-Gloss",
    template: "badge",
    rating: 4.7,
    reviewCount: 45,
    colors: [
      { name: "Ultra Clear", hex: "#FFFFFF" },
      { name: "Frosted Smoked", hex: "#483A5A" },
    ],
    priceTiers: [
      { minQty: 15, maxQty: 49, unitPrice: 110 },
      { minQty: 50, maxQty: 99, unitPrice: 85 },
      { minQty: 100, maxQty: null, unitPrice: 68 },
    ],
  },

  // --- T-Shirts ---
  {
    id: "classic-crewneck-tshirt",
    slug: "classic-crewneck-tshirt",
    name: "Classic Crewneck Cotton T-Shirt (180 GSM)",
    shortName: "Classic 180 GSM Tee",
    categorySlug: "t-shirts",
    description: "100% super-combed cotton t-shirt, pre-shrunk and bio-washed for an exceptionally smooth print canvas. Engineered for team events.",
    badges: ["Best Seller", "100% Cotton"],
    specChips: ["180 GSM", "Bio-Washed", "DTG or Screen Print"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 499,
    basePrice: 285,
    printMethod: "Direct-to-Garment / Silkscreen",
    template: "tee",
    rating: 4.9,
    reviewCount: 312,
    colors: [
      { name: "Carbon Black", hex: "#15101F" },
      { name: "Paper Off-White", hex: "#F5F0E8" },
      { name: "Electric Violet", hex: "#6A2CFF" },
      { name: "Navy Blue", hex: "#1B2A4A" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 285 },
      { minQty: 15, maxQty: 49, unitPrice: 240 },
      { minQty: 50, maxQty: 99, unitPrice: 195 },
      { minQty: 100, maxQty: null, unitPrice: 165 },
    ],
  },
  {
    id: "heavyweight-oversized-tee",
    slug: "heavyweight-oversized-tee",
    name: "Heavyweight Streetwear Oversized Tee (240 GSM)",
    shortName: "240 GSM Oversized Tee",
    categorySlug: "t-shirts",
    description: "Heavyweight 240 GSM French Terry cotton with relaxed drop-shoulder silhouette and thick 1.2-inch ribbed collar. High streetwear aesthetic.",
    badges: ["Trending", "Heavyweight"],
    specChips: ["240 GSM French Terry", "Drop Shoulder", "High Density Print"],
    audience: "TEAM",
    minQty: 10,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 899,
    basePrice: 480,
    printMethod: "High-Density Puff / Screen Print",
    template: "tee",
    rating: 4.9,
    reviewCount: 94,
    colors: [
      { name: "Washed Carbon", hex: "#221A31" },
      { name: "Vintage Lilac", hex: "#CDB8FF" },
      { name: "Raw Natural", hex: "#EDE6DA" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 480 },
      { minQty: 25, maxQty: 49, unitPrice: 420 },
      { minQty: 50, maxQty: 99, unitPrice: 360 },
      { minQty: 100, maxQty: null, unitPrice: 310 },
    ],
  },
  {
    id: "sports-performance-tee",
    slug: "sports-performance-tee",
    name: "Moisture-Wicking Athletic Poly Tee (160 GSM)",
    shortName: "Athletic Poly Tee",
    categorySlug: "t-shirts",
    description: "Quick-drying honeycomb polyester knit with antimicrobial treatment. Ideal for marathons, sports days, and active corporate offsites.",
    badges: ["Quick Dry"],
    specChips: ["160 GSM Polyester", "Sublimation Ready", "Breathable Mesh"],
    audience: "TEAM",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 399,
    basePrice: 220,
    printMethod: "All-Over Sublimation / Vinyl",
    template: "tee",
    rating: 4.6,
    reviewCount: 52,
    colors: [
      { name: "Volt Lime", hex: "#D8FF3F" },
      { name: "Charcoal Grey", hex: "#312540" },
      { name: "Royal Blue", hex: "#2A4B8C" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 220 },
      { minQty: 25, maxQty: 49, unitPrice: 185 },
      { minQty: 50, maxQty: 99, unitPrice: 155 },
      { minQty: 100, maxQty: null, unitPrice: 130 },
    ],
  },
  {
    id: "premium-organic-cotton-tee",
    slug: "premium-organic-cotton-tee",
    name: "GOTS-Certified 100% Organic Cotton Tee (200 GSM)",
    shortName: "Organic 200 GSM Tee",
    categorySlug: "t-shirts",
    description: "Sustainably cultivated organic ring-spun cotton with eco-friendly water-based ink print. Comes with certified organic hangtag.",
    badges: ["Eco-Friendly"],
    specChips: ["GOTS Certified", "Water-Based Inks", "Zero Chemical Bleach"],
    audience: "GIFTING",
    minQty: 15,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 699,
    basePrice: 380,
    printMethod: "Eco Water-Based Screen Print",
    template: "tee",
    rating: 4.9,
    reviewCount: 41,
    colors: [
      { name: "Natural Sand", hex: "#F5F0E8" },
      { name: "Olive Drab", hex: "#484E3A" },
      { name: "Midnight Black", hex: "#15101F" },
    ],
    priceTiers: [
      { minQty: 15, maxQty: 49, unitPrice: 380 },
      { minQty: 50, maxQty: 99, unitPrice: 310 },
      { minQty: 100, maxQty: null, unitPrice: 260 },
    ],
  },

  // --- Polo Shirts ---
  {
    id: "executive-pique-polo",
    slug: "executive-pique-polo",
    name: "Executive Cotton Piqué Polo Shirt (230 GSM)",
    shortName: "230 GSM Piqué Polo",
    categorySlug: "polo-shirts",
    description: "Substantial 230 GSM honeycomb knit polo featuring mother-of-pearl buttons, ribbed armbands, and reinforced collar stays. Perfect for corporate leadership.",
    badges: ["Best Seller", "Corporate Choice"],
    specChips: ["230 GSM Piqué", "High-Density Embroidery", "Side Slits"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 749,
    basePrice: 420,
    printMethod: "Japanese Tajima Embroidery",
    template: "polo",
    rating: 4.9,
    reviewCount: 184,
    colors: [
      { name: "Jet Black", hex: "#15101F" },
      { name: "Crisp White", hex: "#FAF7F2" },
      { name: "Royal Purple", hex: "#483A5A" },
      { name: "Navy", hex: "#17223B" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 420 },
      { minQty: 15, maxQty: 49, unitPrice: 360 },
      { minQty: 50, maxQty: 99, unitPrice: 310 },
      { minQty: 100, maxQty: null, unitPrice: 265 },
    ],
  },
  {
    id: "contrast-tipped-polo",
    slug: "contrast-tipped-polo",
    name: "Contrast Tipped Collar Executive Polo (220 GSM)",
    shortName: "Contrast Tipped Polo",
    categorySlug: "polo-shirts",
    description: "Sporty modern polo with contrasting collar stripe accents and tonal buttons. Designed for tech startups and retail sales uniforms.",
    badges: ["Smart Casual"],
    specChips: ["Dual Color Collar", "220 GSM Matty", "Anti-Pilling"],
    audience: "TEAM",
    minQty: 10,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 699,
    basePrice: 390,
    printMethod: "Left-Chest Embroidery / DTF",
    template: "polo",
    rating: 4.7,
    reviewCount: 76,
    colors: [
      { name: "Black with Violet Tip", hex: "#15101F" },
      { name: "Navy with Lime Tip", hex: "#1A2536" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 390 },
      { minQty: 25, maxQty: 49, unitPrice: 340 },
      { minQty: 50, maxQty: 99, unitPrice: 295 },
      { minQty: 100, maxQty: null, unitPrice: 250 },
    ],
  },
  {
    id: "drifit-team-polo",
    slug: "drifit-team-polo",
    name: "Dri-Fit Polyester Performance Polo (170 GSM)",
    shortName: "Dri-Fit Team Polo",
    categorySlug: "polo-shirts",
    description: "Engineered micro-poly knit with side ventilation eyelets for hot outdoor climate. Sweat resistant and machine washable.",
    badges: ["High Durability"],
    specChips: ["Micro Poly", "Quick Dry", "Wrinkle Free"],
    audience: "TEAM",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 499,
    basePrice: 290,
    printMethod: "Heat Transfer Vinyl / Embroidery",
    template: "polo",
    rating: 4.8,
    reviewCount: 63,
    colors: [
      { name: "Steel Grey", hex: "#5C5668" },
      { name: "Classic Navy", hex: "#17223B" },
      { name: "Pure White", hex: "#FFFFFF" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 290 },
      { minQty: 25, maxQty: 49, unitPrice: 245 },
      { minQty: 50, maxQty: 99, unitPrice: 210 },
      { minQty: 100, maxQty: null, unitPrice: 175 },
    ],
  },

  // --- Hoodies & Sweatshirts ---
  {
    id: "classic-pullover-hoodie",
    slug: "classic-pullover-hoodie",
    name: "Classic Kangaroo Pocket Pullover Hoodie (320 GSM)",
    shortName: "320 GSM Pullover Hoodie",
    categorySlug: "hoodies",
    description: "Heavyweight 320 GSM brushed fleece with double-layered thermal hood, flat shoelace drawstrings, and 2x2 lycra rib cuffs. Premium winter swag staple.",
    badges: ["Best Seller", "Heavy Fleece"],
    specChips: ["320 GSM Fleece", "Kangaroo Pocket", "Double Lined Hood"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 1499,
    basePrice: 790,
    printMethod: "Center-Chest DTF / Embroidery",
    template: "hoodie",
    rating: 4.9,
    reviewCount: 220,
    colors: [
      { name: "Midnight Black", hex: "#15101F" },
      { name: "Heather Grey", hex: "#A8A2B0" },
      { name: "Deep Navy", hex: "#1B2A4A" },
      { name: "Rich Lilac", hex: "#CDB8FF" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 790 },
      { minQty: 15, maxQty: 49, unitPrice: 680 },
      { minQty: 50, maxQty: 99, unitPrice: 580 },
      { minQty: 100, maxQty: null, unitPrice: 495 },
    ],
  },
  {
    id: "zipper-fleece-hoodie",
    slug: "zipper-fleece-hoodie",
    name: "Full-Zip Brushed Heavy Fleece Hoodie (340 GSM)",
    shortName: "Full-Zip 340 GSM Hoodie",
    categorySlug: "hoodies",
    description: "Warm 340 GSM cotton-poly fleece featuring a smooth YKK metal zipper, concealed phone pocket, and double-needle stitching throughout.",
    badges: ["YKK Zipper"],
    specChips: ["340 GSM Cotton Fleece", "YKK Brass Pull", "Inner Media Pocket"],
    audience: "TEAM",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 1799,
    basePrice: 940,
    printMethod: "Left-Chest Crest + Back Artwork",
    template: "hoodie",
    rating: 4.8,
    reviewCount: 88,
    colors: [
      { name: "Carbon Black", hex: "#15101F" },
      { name: "Slate Heather", hex: "#565261" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 940 },
      { minQty: 15, maxQty: 49, unitPrice: 820 },
      { minQty: 50, maxQty: 99, unitPrice: 710 },
      { minQty: 100, maxQty: null, unitPrice: 615 },
    ],
  },
  {
    id: "minimalist-crewneck-sweatshirt",
    slug: "minimalist-crewneck-sweatshirt",
    name: "Minimalist Drop-Shoulder Crewneck Sweatshirt (300 GSM)",
    shortName: "Crewneck Sweatshirt",
    categorySlug: "hoodies",
    description: "Modern no-hood silhouette engineered with 300 GSM combed cotton. Perfect for indoor office AC environments and tech campus swag.",
    badges: ["Minimalist"],
    specChips: ["300 GSM Cotton", "Raglan Sleeves", "No-Pill Fleece"],
    audience: "GIFTING",
    minQty: 10,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 1299,
    basePrice: 680,
    printMethod: "Subtle Tonal Embroidery / Puff",
    template: "hoodie",
    rating: 4.9,
    reviewCount: 95,
    colors: [
      { name: "Vintage Cream", hex: "#F5F0E8" },
      { name: "Sage Olive", hex: "#484E3A" },
      { name: "Washed Ink", hex: "#221A31" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 680 },
      { minQty: 25, maxQty: 49, unitPrice: 590 },
      { minQty: 50, maxQty: 99, unitPrice: 510 },
      { minQty: 100, maxQty: null, unitPrice: 440 },
    ],
  },

  // --- Caps & Headwear ---
  {
    id: "structured-cotton-twill-cap",
    slug: "structured-cotton-twill-cap",
    name: "Structured 6-Panel Cotton Twill Baseball Cap",
    shortName: "6-Panel Twill Cap",
    categorySlug: "caps",
    description: "Heavy brushed cotton twill with reinforced buckram crown, pre-curved visor with 6 rows of contrast stitching, and antique brass strap buckle.",
    badges: ["Best Seller", "Brass Buckle"],
    specChips: ["100% Cotton Twill", "3D Puff Embroidery", "Brass Metal Buckle"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 499,
    basePrice: 278,
    printMethod: "3D Raised Puff Embroidery",
    template: "cap",
    rating: 4.8,
    reviewCount: 164,
    colors: [
      { name: "Pitch Black", hex: "#15101F" },
      { name: "Navy Blue", hex: "#17223B" },
      { name: "Raw Khaki", hex: "#D6CBB8" },
      { name: "Deep Violet", hex: "#483A5A" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 278 },
      { minQty: 15, maxQty: 49, unitPrice: 225 },
      { minQty: 50, maxQty: 99, unitPrice: 185 },
      { minQty: 100, maxQty: null, unitPrice: 150 },
    ],
  },
  {
    id: "mesh-trucker-snapback",
    slug: "mesh-trucker-snapback",
    name: "Vintage Mesh Back Trucker Snapback",
    shortName: "Mesh Trucker Cap",
    categorySlug: "caps",
    description: "Retro high-crown trucker cap with premium foam front panel, breathable nylon mesh back, and 7-notch adjustable snapback.",
    badges: ["Breathable"],
    specChips: ["Nylon Mesh", "Sublimation / Screen", "Classic Snapback"],
    audience: "TEAM",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 449,
    basePrice: 240,
    printMethod: "Screen Print / High-Density Patch",
    template: "cap",
    rating: 4.7,
    reviewCount: 78,
    colors: [
      { name: "Black / White Mesh", hex: "#15101F" },
      { name: "Navy / White Mesh", hex: "#1B2A4A" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 240 },
      { minQty: 25, maxQty: 49, unitPrice: 195 },
      { minQty: 50, maxQty: 99, unitPrice: 160 },
      { minQty: 100, maxQty: null, unitPrice: 135 },
    ],
  },

  // --- Corporate Gifts & Kits ---
  {
    id: "matte-insulated-steel-flask",
    slug: "matte-insulated-steel-flask",
    name: "Double-Wall Insulated Matte Steel Flask (750ml)",
    shortName: "750ml Insulated Flask",
    categorySlug: "corporate-gifts",
    description: "Food-grade 304 stainless steel vacuum flask with copper insulation lining. Keeps beverages cold for 24h, hot for 12h. Finished in tactile matte powder coat.",
    badges: ["Best Seller", "24h Cold"],
    specChips: ["304 Stainless Steel", "Laser Etch 360°", "Leak-Proof Cap"],
    audience: "BOTH",
    minQty: 10,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 899,
    basePrice: 480,
    printMethod: "360° Rotary Laser Engraving",
    template: "bottle",
    rating: 4.9,
    reviewCount: 205,
    colors: [
      { name: "Matte Black", hex: "#15101F" },
      { name: "Brushed Steel", hex: "#D6D6D6" },
      { name: "Nordic White", hex: "#F5F0E8" },
      { name: "Deep Violet", hex: "#483A5A" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 480 },
      { minQty: 25, maxQty: 49, unitPrice: 410 },
      { minQty: 50, maxQty: 99, unitPrice: 350 },
      { minQty: 100, maxQty: null, unitPrice: 295 },
    ],
  },
  {
    id: "executive-hardbound-journal",
    slug: "executive-hardbound-journal",
    name: "Smyth-Sewn Hardbound Linen Journal (192 Pages)",
    shortName: "Linen Hardbound Journal",
    categorySlug: "corporate-gifts",
    description: "100 GSM acid-free ivory pages that lay completely flat at 180 degrees. Encased in textured bookbinding linen with pen loop and dual ribbon markers.",
    badges: ["Hand-Bound"],
    specChips: ["100 GSM Ivory Paper", "Blind Debossing", "180° Lay Flat"],
    audience: "GIFTING",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: true,
    mrp: 599,
    basePrice: 340,
    printMethod: "Blind Deboss / Gold Foil Stamping",
    template: "notebook",
    rating: 4.9,
    reviewCount: 132,
    colors: [
      { name: "Linen Paper", hex: "#F5F0E8" },
      { name: "Charcoal Slate", hex: "#2E2838" },
      { name: "Deep Violet", hex: "#483A5A" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 340 },
      { minQty: 25, maxQty: 49, unitPrice: 290 },
      { minQty: 50, maxQty: 99, unitPrice: 245 },
      { minQty: 100, maxQty: null, unitPrice: 210 },
    ],
  },
  {
    id: "matte-metal-rollerball-pen",
    slug: "matte-metal-rollerball-pen",
    name: "Precision Weighted Brass Rollerball Pen (0.5mm)",
    shortName: "Brass Rollerball Pen",
    categorySlug: "corporate-gifts",
    description: "Solid brass barrel with German Schneider ceramic roller refill. Laser engraved to expose the gleaming golden brass underneath the matte black coat.",
    badges: ["German Refill"],
    specChips: ["Solid Brass 32g", "Schneider Gel Ink", "Mirror Laser Etch"],
    audience: "GIFTING",
    minQty: 15,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 349,
    basePrice: 195,
    printMethod: "Fiber Laser Engraving",
    template: "pen",
    rating: 4.8,
    reviewCount: 97,
    colors: [
      { name: "Matte Black & Gold", hex: "#15101F" },
      { name: "Satin Silver", hex: "#D6D6D6" },
    ],
    priceTiers: [
      { minQty: 15, maxQty: 49, unitPrice: 195 },
      { minQty: 50, maxQty: 99, unitPrice: 165 },
      { minQty: 100, maxQty: 249, unitPrice: 135 },
      { minQty: 250, maxQty: null, unitPrice: 110 },
    ],
  },
  {
    id: "leather-loop-keychain",
    slug: "leather-loop-keychain",
    name: "Full-Grain Leather Loop Keyring with Matte Rivet",
    shortName: "Leather Loop Keyring",
    categorySlug: "corporate-gifts",
    description: "Vegetable-tanned harness leather hand-beveled and burnished with beeswax. Laser engraved or heat stamped with black nickel split ring.",
    badges: ["Full Grain"],
    specChips: ["Full-Grain Veg Tan", "Gunmetal Rivet", "Heat Embossing"],
    audience: "GIFTING",
    minQty: 20,
    qtyStep: 10,
    isBestSeller: false,
    mrp: 299,
    basePrice: 145,
    printMethod: "Hot Foil / Laser Engrave",
    template: "keychain",
    rating: 4.8,
    reviewCount: 64,
    colors: [
      { name: "Tan Saddle", hex: "#A06834" },
      { name: "Dark Walnut", hex: "#42281D" },
      { name: "Jet Black", hex: "#15101F" },
    ],
    priceTiers: [
      { minQty: 20, maxQty: 49, unitPrice: 145 },
      { minQty: 50, maxQty: 99, unitPrice: 118 },
      { minQty: 100, maxQty: null, unitPrice: 92 },
    ],
  },
];

export const CATEGORIES_LIST = [
  { id: "1", slug: "magnetic-badges", name: "Magnetic Badges", description: "No fabric damage magnetic lapel pins", sortOrder: 1, _count: { products: 4 } },
  { id: "2", slug: "t-shirts", name: "T-Shirts", description: "100% bio-washed custom printed cotton tees", sortOrder: 2, _count: { products: 4 } },
  { id: "3", slug: "polo-shirts", name: "Polo Shirts", description: "230 GSM piqué corporate embroidered polos", sortOrder: 3, _count: { products: 3 } },
  { id: "4", slug: "hoodies", name: "Hoodies & Sweatshirts", description: "320 GSM brushed heavy fleece hoodies", sortOrder: 4, _count: { products: 3 } },
  { id: "5", slug: "caps", name: "Caps & Headwear", description: "Structured 6-panel twill and trucker caps", sortOrder: 5, _count: { products: 2 } },
  { id: "6", slug: "corporate-gifts", name: "Corporate Gifts & Kits", description: "Laser pens, notebooks, and steel flasks", sortOrder: 6, _count: { products: 4 } },
];

/**
 * Fetch all active categories with cache tag 'categories'
 */
export const getCachedCategories = unstable_cache(
  async () => {
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        const categories = await prisma.category.findMany({
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        });
        if (categories.length > 0) return categories;
      } catch {
        // Fallback
      }
    }

    return CATEGORIES_LIST;
  },
  ["categories-cache-key"],
  { tags: ["catalogue", "categories"], revalidate: 3600 }
);

/**
 * Fetch flagship products with cache tag 'products'
 */
export const getCachedProducts = unstable_cache(
  async (categorySlug?: string) => {
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        const products = await prisma.product.findMany({
          where: {
            active: true,
            ...(categorySlug && categorySlug !== "all" && categorySlug !== "best-sellers"
              ? { category: { slug: categorySlug } }
              : {}),
            ...(categorySlug === "best-sellers" ? { isBestSeller: true } : {}),
          },
          include: {
            category: true,
            priceTiers: { orderBy: { minQty: "asc" } },
            options: true,
          },
          orderBy: { sortOrder: "asc" },
        });

        if (products.length > 0) {
          return products.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            shortName: p.shortName,
            categorySlug: p.category.slug,
            description: p.description,
            badges: p.badges,
            specChips: p.specChips,
            audience: p.audience as "TEAM" | "GIFTING" | "BOTH",
            minQty: p.minQty,
            qtyStep: p.qtyStep,
            isBestSeller: p.isBestSeller,
            mrp: p.mrp,
            basePrice: p.basePrice,
            printMethod: p.printMethod,
            template: p.slug,
            rating: 4.9,
            reviewCount: 42,
            colors: p.options
              .filter((o) => o.type === "COLOUR")
              .map((o) => ({ name: o.value, hex: o.hex || "#15101F" })),
            priceTiers: p.priceTiers.map((t) => ({
              minQty: t.minQty,
              maxQty: t.maxQty,
              unitPrice: t.unitPrice,
            })),
          }));
        }
      } catch {
        // Fallback
      }
    }

    // Static Fallback
    let items = ALL_PRODUCTS;
    if (categorySlug && categorySlug !== "all" && categorySlug !== "best-sellers") {
      items = items.filter((p) => p.categorySlug === categorySlug);
    } else if (categorySlug === "best-sellers") {
      items = items.filter((p) => p.isBestSeller);
    }
    return items;
  },
  ["products-cache-key"],
  { tags: ["catalogue", "products"], revalidate: 3600 }
);
