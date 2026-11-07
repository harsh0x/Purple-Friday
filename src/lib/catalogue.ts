import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { normalizeSlug, productHref, categoryHref } from "./urls";

export { normalizeSlug, productHref, categoryHref };

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
  // --- Magnetic Badges (4) ---
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
    qtyStep: 5,
    isBestSeller: false,
    mrp: 290,
    basePrice: 195,
    printMethod: "Die-Struck Enamel + Dual Magnet",
    template: "badge",
    rating: 4.9,
    reviewCount: 92,
    colors: [
      { name: "Mirror Gold", hex: "#D4AF37" },
      { name: "Antique Nickel", hex: "#708090" },
      { name: "Rose Copper", hex: "#B87333" },
    ],
    priceTiers: [
      { minQty: 25, maxQty: 49, unitPrice: 195 },
      { minQty: 50, maxQty: 99, unitPrice: 160 },
      { minQty: 100, maxQty: 249, unitPrice: 135 },
      { minQty: 250, maxQty: null, unitPrice: 110 },
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
    specChips: ["3mm Crystal Acrylic", "Flame Polished", "Reverse Print"],
    audience: "TEAM",
    minQty: 20,
    qtyStep: 10,
    isBestSeller: false,
    mrp: 180,
    basePrice: 110,
    printMethod: "Reverse UV Mirror Print",
    template: "badge",
    rating: 4.7,
    reviewCount: 54,
    colors: [
      { name: "Crystal Clear", hex: "#F5F0E8" },
      { name: "Smoked Grey", hex: "#483A5A" },
    ],
    priceTiers: [
      { minQty: 20, maxQty: 49, unitPrice: 110 },
      { minQty: 50, maxQty: 99, unitPrice: 90 },
      { minQty: 100, maxQty: 249, unitPrice: 75 },
      { minQty: 250, maxQty: null, unitPrice: 60 },
    ],
  },

  // --- T-Shirts (4) ---
  {
    id: "classic-crewneck-tshirt",
    slug: "classic-crewneck-tshirt",
    name: "Classic Crewneck Cotton T-Shirt (180 GSM)",
    shortName: "Classic 180 GSM Tee",
    categorySlug: "t-shirts",
    description: "100% super-combed cotton t-shirt, pre-shrunk and bio-washed for an exceptionally smooth print canvas. Engineered for team events.",
    badges: ["Best Seller", "100% Cotton"],
    specChips: ["180 GSM Combed Cotton", "Bio-Washed", "Double Needle Stitch"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 499,
    basePrice: 285,
    printMethod: "Direct-to-Garment / Screen Print",
    template: "tee",
    rating: 4.9,
    reviewCount: 310,
    colors: [
      { name: "Pitch Black", hex: "#15101F" },
      { name: "Off White", hex: "#FAF7F2" },
      { name: "Navy Blue", hex: "#1B2A4A" },
      { name: "Spot Violet", hex: "#6A2CFF" },
      { name: "Spot Lime", hex: "#D8FF3F" },
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
    specChips: ["240 GSM French Terry", "Drop Shoulder", "Thick Ribbed Collar"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 799,
    basePrice: 480,
    printMethod: "High-Density Puff / Screen Print",
    template: "tee",
    rating: 4.9,
    reviewCount: 188,
    colors: [
      { name: "Vintage Charcoal", hex: "#221A31" },
      { name: "Eggshell White", hex: "#EDE6DA" },
      { name: "Electric Violet", hex: "#6A2CFF" },
      { name: "Sage Olive", hex: "#484E3A" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 480 },
      { minQty: 15, maxQty: 49, unitPrice: 410 },
      { minQty: 50, maxQty: 99, unitPrice: 355 },
      { minQty: 100, maxQty: null, unitPrice: 310 },
    ],
  },
  {
    id: "sports-performance-tee",
    slug: "sports-performance-tee",
    name: "Athletic Quick-Dry Poly Performance Tee",
    shortName: "Sports Quick-Dry Tee",
    categorySlug: "t-shirts",
    description: "Moisture-wicking micro-polyester interlock mesh. Breathable, anti-static, and built for sports events, marathons, and fitness teams.",
    badges: ["Moisture Wicking"],
    specChips: ["160 GSM Micro-Poly", "UV 30+ Protection", "Anti-Odor Finish"],
    audience: "TEAM",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 399,
    basePrice: 220,
    printMethod: "Sublimation / Breathable Screen",
    template: "tee",
    rating: 4.7,
    reviewCount: 76,
    colors: [
      { name: "Neon Lime", hex: "#D8FF3F" },
      { name: "Cobalt Blue", hex: "#1E40AF" },
      { name: "Anthracite", hex: "#15101F" },
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
    name: "GOTS-Certified Organic Combed Cotton Tee",
    shortName: "Organic Cotton Tee",
    categorySlug: "t-shirts",
    description: "100% GOTS certified organic ring-spun cotton. Ultra-soft hand feel, sustainably dyed with non-toxic OEKO-TEX certified inks.",
    badges: ["Eco Friendly", "GOTS Certified"],
    specChips: ["100% Organic Cotton", "OEKO-TEX Inks", "Carbon Neutral"],
    audience: "GIFTING",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 649,
    basePrice: 360,
    printMethod: "Water-based Screen Print",
    template: "tee",
    rating: 4.8,
    reviewCount: 52,
    colors: [
      { name: "Natural Ecru", hex: "#F5F0E8" },
      { name: "Forest Moss", hex: "#2E3A2F" },
      { name: "Deep Ink", hex: "#15101F" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 360 },
      { minQty: 25, maxQty: 49, unitPrice: 310 },
      { minQty: 50, maxQty: 99, unitPrice: 265 },
      { minQty: 100, maxQty: null, unitPrice: 225 },
    ],
  },

  // --- Polo Shirts (4) ---
  {
    id: "executive-pique-polo",
    slug: "executive-pique-polo",
    name: "Executive 230 GSM Combed Cotton Piqué Polo",
    shortName: "Executive Piqué Polo",
    categorySlug: "polo-shirts",
    description: "Premium honeycomb piqué knit with reinforced ribbed collar, 3-button horn placket, and side vents with herringbone tape.",
    badges: ["Best Seller", "Corporate Standard"],
    specChips: ["230 GSM Cotton Piqué", "Tajima Embroidery", "Horn Button Placket"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 699,
    basePrice: 420,
    printMethod: "Japanese Tajima Embroidery",
    template: "polo",
    rating: 4.9,
    reviewCount: 220,
    colors: [
      { name: "Obsidian Black", hex: "#15101F" },
      { name: "Classic Navy", hex: "#17223B" },
      { name: "Royal Purple", hex: "#483A5A" },
      { name: "Chalk White", hex: "#FAF7F2" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 420 },
      { minQty: 15, maxQty: 49, unitPrice: 360 },
      { minQty: 50, maxQty: 99, unitPrice: 305 },
      { minQty: 100, maxQty: null, unitPrice: 260 },
    ],
  },
  {
    id: "contrast-tipped-polo",
    slug: "contrast-tipped-polo",
    name: "Dual-Tipped Collar Corporate Polo (220 GSM)",
    shortName: "Contrast Tipped Polo",
    categorySlug: "polo-shirts",
    description: "Contemporary team polo featuring sharp contrast tipping on collar edge and sleeve bands. Tailored athletic fit.",
    badges: ["Modern Cut"],
    specChips: ["220 GSM Rich Blend", "Contrast Ribbed Trim", "Preshrunk"],
    audience: "TEAM",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 649,
    basePrice: 390,
    printMethod: "Chest Embroidery / DTF Print",
    template: "polo",
    rating: 4.8,
    reviewCount: 84,
    colors: [
      { name: "Black / Lime Tip", hex: "#15101F" },
      { name: "Navy / White Tip", hex: "#1B2A4A" },
      { name: "Grey / Violet Tip", hex: "#64537A" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 390 },
      { minQty: 15, maxQty: 49, unitPrice: 330 },
      { minQty: 50, maxQty: 99, unitPrice: 280 },
      { minQty: 100, maxQty: null, unitPrice: 240 },
    ],
  },
  {
    id: "drifit-team-polo",
    slug: "drifit-team-polo",
    name: "Dri-Fit Wicking Corporate Sports Polo",
    shortName: "Dri-Fit Sports Polo",
    categorySlug: "polo-shirts",
    description: "Engineered polyester pique with moisture dispersion channels. Keeps teams cool during outdoor summits and team sports days.",
    badges: ["Quick Dry"],
    specChips: ["180 GSM Poly Pique", "Quick Dry Finish", "Laser Welded Buttonhole"],
    audience: "TEAM",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 549,
    basePrice: 320,
    printMethod: "High-Precision Embroidery",
    template: "polo",
    rating: 4.7,
    reviewCount: 65,
    colors: [
      { name: "Graphite", hex: "#312540" },
      { name: "Electric Blue", hex: "#1E40AF" },
      { name: "Arctic White", hex: "#FFFFFF" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 320 },
      { minQty: 25, maxQty: 49, unitPrice: 275 },
      { minQty: 50, maxQty: 99, unitPrice: 235 },
      { minQty: 100, maxQty: null, unitPrice: 198 },
    ],
  },
  {
    id: "heavyweight-uniform-polo",
    slug: "heavyweight-uniform-polo",
    name: "Industrial Heavyweight Workwear Polo (260 GSM)",
    shortName: "260 GSM Heavy Polo",
    categorySlug: "polo-shirts",
    description: "Durable 60% cotton 40% polyester blend built for warehouse operations, logistics crews, and facility staff.",
    badges: ["Heavy Duty"],
    specChips: ["260 GSM Blend", "Triple Stitching", "Stain Release"],
    audience: "TEAM",
    minQty: 15,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 649,
    basePrice: 350,
    printMethod: "Heavy Embroidery",
    template: "polo",
    rating: 4.8,
    reviewCount: 47,
    colors: [
      { name: "Coal Black", hex: "#15101F" },
      { name: "Navy Industrial", hex: "#17223B" },
    ],
    priceTiers: [
      { minQty: 15, maxQty: 49, unitPrice: 350 },
      { minQty: 50, maxQty: 99, unitPrice: 300 },
      { minQty: 100, maxQty: null, unitPrice: 255 },
    ],
  },

  // --- Hoodies & Sweatshirts (4) ---
  {
    id: "classic-pullover-hoodie",
    slug: "classic-pullover-hoodie",
    name: "320 GSM Brushed Heavy Fleece Pullover Hoodie",
    shortName: "320 GSM Pullover Hoodie",
    categorySlug: "hoodies",
    description: "Plush 320 GSM combed cotton-rich fleece. Double-layered hood, heavy matching drawstrings with gunmetal aglets, and roomy kangaroo pocket.",
    badges: ["Best Seller", "Heavy Fleece"],
    specChips: ["320 GSM Brushed Fleece", "Double Layer Hood", "Gunmetal Aglets"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: true,
    mrp: 1299,
    basePrice: 799,
    printMethod: "Screen Print / High-Density Embroidery",
    template: "hoodie",
    rating: 4.9,
    reviewCount: 268,
    colors: [
      { name: "Ink Black", hex: "#15101F" },
      { name: "Deep Heather Grey", hex: "#64537A" },
      { name: "Spot Violet", hex: "#6A2CFF" },
      { name: "Midnight Navy", hex: "#17223B" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 799 },
      { minQty: 15, maxQty: 49, unitPrice: 680 },
      { minQty: 50, maxQty: 99, unitPrice: 575 },
      { minQty: 100, maxQty: null, unitPrice: 495 },
    ],
  },
  {
    id: "metal-zipper-fleece-jacket",
    slug: "metal-zipper-fleece-jacket",
    name: "Full-Zip Metal Zipper Heavyweight Fleece Jacket",
    shortName: "Full-Zip Fleece Jacket",
    categorySlug: "hoodies",
    description: "Premium heavy fleece jacket with antique brass YKK zipper, cadet stand collar, and concealed headphone cable routing hole.",
    badges: ["YKK Zipper", "Executive Cut"],
    specChips: ["340 GSM Heavyweight", "Antique Brass YKK", "Cadet Stand Collar"],
    audience: "BOTH",
    minQty: 5,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 1599,
    basePrice: 990,
    printMethod: "Chest Embroidery / Leather Patch",
    template: "hoodie",
    rating: 4.9,
    reviewCount: 114,
    colors: [
      { name: "Pitch Black", hex: "#15101F" },
      { name: "Deep Navy", hex: "#17223B" },
      { name: "Slate Melange", hex: "#483A5A" },
    ],
    priceTiers: [
      { minQty: 5, maxQty: 14, unitPrice: 990 },
      { minQty: 15, maxQty: 49, unitPrice: 850 },
      { minQty: 50, maxQty: 99, unitPrice: 740 },
      { minQty: 100, maxQty: null, unitPrice: 650 },
    ],
  },
  {
    id: "minimalist-crewneck-sweatshirt",
    slug: "minimalist-crewneck-sweatshirt",
    name: "Minimalist Crewneck Sweatshirt (300 GSM)",
    shortName: "Crewneck Sweatshirt",
    categorySlug: "hoodies",
    description: "Clean-line raglan sleeve crewneck in smooth face fleece. Features classic V-notch rib insert at neck and spandex-reinforced cuffs.",
    badges: ["Minimalist"],
    specChips: ["300 GSM Smooth Face", "Raglan Sleeve", "Spandex Ribbing"],
    audience: "BOTH",
    minQty: 10,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 999,
    basePrice: 680,
    printMethod: "Center Chest DTG / Minimal Embroidery",
    template: "hoodie",
    rating: 4.8,
    reviewCount: 89,
    colors: [
      { name: "Heather Grey", hex: "#9F8CB8" },
      { name: "Oatmeal Milk", hex: "#EDE6DA" },
      { name: "Deep Ink", hex: "#15101F" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 680 },
      { minQty: 25, maxQty: 49, unitPrice: 590 },
      { minQty: 50, maxQty: 99, unitPrice: 510 },
      { minQty: 100, maxQty: null, unitPrice: 440 },
    ],
  },
  {
    id: "varsity-raglan-hoodie",
    slug: "varsity-raglan-hoodie",
    name: "Two-Tone Varsity Raglan Pullover (320 GSM)",
    shortName: "Two-Tone Varsity Hoodie",
    categorySlug: "hoodies",
    description: "College varsity styling with contrast color raglan sleeves and striped ribbed cuffs. Built for university student councils and clubs.",
    badges: ["Varsity"],
    specChips: ["Raglan Sleeves", "Striped Ribbing", "Twill Applique"],
    audience: "TEAM",
    minQty: 15,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 1399,
    basePrice: 720,
    printMethod: "Chenille Applique / Screen Print",
    template: "hoodie",
    rating: 4.8,
    reviewCount: 39,
    colors: [
      { name: "Black & Violet", hex: "#15101F" },
      { name: "Navy & Grey", hex: "#1B2A4A" },
    ],
    priceTiers: [
      { minQty: 15, maxQty: 49, unitPrice: 720 },
      { minQty: 50, maxQty: 99, unitPrice: 610 },
      { minQty: 100, maxQty: null, unitPrice: 520 },
    ],
  },

  // --- Caps & Headwear (4) ---
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
    id: "trucker-mesh-snapback-cap",
    slug: "trucker-mesh-snapback-cap",
    name: "Vintage Mesh Back Trucker Snapback",
    shortName: "Mesh Trucker Cap",
    categorySlug: "caps",
    description: "Retro high-crown trucker cap with premium foam front panel, breathable nylon mesh back, and 7-notch adjustable snapback.",
    badges: ["Breathable", "Summer Hit"],
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
  {
    id: "unstructured-dad-hat",
    slug: "unstructured-dad-hat",
    name: "Vintage Washed Unstructured Dad Hat",
    shortName: "Washed Dad Hat",
    categorySlug: "caps",
    description: "Soft unlined cotton twill with garment wash enzyme treatment for a relaxed, broken-in feel right out of the box.",
    badges: ["Vintage Wash"],
    specChips: ["Enzyme Washed", "Antique Clasp", "Flat Embroidery"],
    audience: "GIFTING",
    minQty: 10,
    qtyStep: 1,
    isBestSeller: false,
    mrp: 449,
    basePrice: 250,
    printMethod: "Tonal Flat Embroidery",
    template: "cap",
    rating: 4.8,
    reviewCount: 56,
    colors: [
      { name: "Washed Sage", hex: "#816F98" },
      { name: "Faded Black", hex: "#221A31" },
    ],
    priceTiers: [
      { minQty: 10, maxQty: 24, unitPrice: 250 },
      { minQty: 25, maxQty: 49, unitPrice: 205 },
      { minQty: 50, maxQty: 99, unitPrice: 170 },
      { minQty: 100, maxQty: null, unitPrice: 140 },
    ],
  },
  {
    id: "performance-running-visor",
    slug: "performance-running-visor",
    name: "Lightweight Quick-Dry Sports Sun Visor",
    shortName: "Sports Sun Visor",
    categorySlug: "caps",
    description: "Curved glare-reducing brim with inner terrycloth sweatband and adjustable velcro closure for sports events and marathons.",
    badges: ["Activewear"],
    specChips: ["Terry Sweatband", "Velcro Tab", "Ultralight"],
    audience: "TEAM",
    minQty: 15,
    qtyStep: 5,
    isBestSeller: false,
    mrp: 349,
    basePrice: 195,
    printMethod: "Reflective Vinyl / Embroidery",
    template: "cap",
    rating: 4.7,
    reviewCount: 41,
    colors: [
      { name: "Bright Lime", hex: "#D8FF3F" },
      { name: "Solid Black", hex: "#15101F" },
    ],
    priceTiers: [
      { minQty: 15, maxQty: 49, unitPrice: 195 },
      { minQty: 50, maxQty: 99, unitPrice: 160 },
      { minQty: 100, maxQty: null, unitPrice: 130 },
    ],
  },

  // --- Corporate Gifts & Kits (4) ---
  {
    id: "executive-brass-twist-pen",
    slug: "executive-brass-twist-pen",
    name: "Executive Brass Twist Metal Ballpoint Pen",
    shortName: "Brass Twist Pen",
    categorySlug: "corporate-gifts",
    description: "Solid weighted brass barrel with matte electroplated finish, smooth German Schmidt refill, and mirror-gold laser etching.",
    badges: ["Best Seller", "German Refill"],
    specChips: ["Solid Brass 32g", "Schmidt Refill", "Mirror Laser Etch"],
    audience: "GIFTING",
    minQty: 15,
    qtyStep: 5,
    isBestSeller: true,
    mrp: 349,
    basePrice: 195,
    printMethod: "Fiber Laser Engraving",
    template: "pen",
    rating: 4.9,
    reviewCount: 145,
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
    id: "hardbound-leather-journal-a5",
    slug: "hardbound-leather-journal-a5",
    name: "Hardbound Debossed A5 Vegan Leather Journal (192 Pages)",
    shortName: "A5 Leather Journal",
    categorySlug: "corporate-gifts",
    description: "Handcrafted 192-page 100 GSM ivory ruled paper diary with PU leather cover, expanding inner back pocket, and elastic pen loop.",
    badges: ["Top Corporate Gift"],
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
    id: "steel-engraved-keychain",
    slug: "steel-engraved-keychain",
    name: "Heavy Stainless Steel Rectangle Engraved Keychain",
    shortName: "Steel Keychain",
    categorySlug: "corporate-gifts",
    description: "Solid 2.5mm stainless steel tag with hand-brushed satin finish, high-tensile flat split ring, and permanent deep laser engraving.",
    badges: ["Lifetime Finish"],
    specChips: ["Solid Stainless Steel", "Permanent Laser Etch", "Heavy Duty Ring"],
    audience: "GIFTING",
    minQty: 20,
    qtyStep: 10,
    isBestSeller: false,
    mrp: 299,
    basePrice: 145,
    printMethod: "Deep Laser Engrave",
    template: "keychain",
    rating: 4.8,
    reviewCount: 64,
    colors: [
      { name: "Brushed Steel", hex: "#D6D6D6" },
      { name: "Matte Black", hex: "#15101F" },
      { name: "Mirror Gold", hex: "#D4AF37" },
    ],
    priceTiers: [
      { minQty: 20, maxQty: 49, unitPrice: 145 },
      { minQty: 50, maxQty: 99, unitPrice: 118 },
      { minQty: 100, maxQty: null, unitPrice: 92 },
    ],
  },
];

export const CATEGORIES_LIST = [
  { id: "1", slug: "magnetic-badges", name: "Magnetic Badges", description: "Dual-neodymium magnetic fastener lapel pins and badges", sortOrder: 1, _count: { products: 4 } },
  { id: "2", slug: "t-shirts", name: "T-Shirts", description: "100% bio-washed custom printed cotton tees (includes athletic & heavyweight)", sortOrder: 2, _count: { products: 8 } },
  { id: "3", slug: "polo-shirts", name: "Polo Shirts", description: "230 GSM piqué corporate embroidered polos", sortOrder: 3, _count: { products: 4 } },
  { id: "4", slug: "hoodies", name: "Hoodies & Sweatshirts", description: "320 GSM brushed heavy fleece hoodies & sweatshirts", sortOrder: 4, _count: { products: 4 } },
  { id: "5", slug: "caps", name: "Caps & Headwear", description: "Structured 6-panel twill and retro mesh trucker caps", sortOrder: 5, _count: { products: 4 } },
  { id: "6", slug: "corporate-gifts", name: "Corporate Gifts & Kits", description: "Laser pens, notebooks, and insulated flasks", sortOrder: 6, _count: { products: 4 } },
];

/**
 * Normalizes slug and finds matching product from in-memory catalog
 */
export function findProductBySlug(rawSlug: string): CatalogueProduct | undefined {
  if (!rawSlug) return undefined;
  const canonical = normalizeSlug(rawSlug);
  return (
    ALL_PRODUCTS.find((p) => p.slug === canonical || p.id === canonical) ||
    ALL_PRODUCTS.find((p) => p.slug.toLowerCase() === rawSlug.toLowerCase().trim() || p.id.toLowerCase() === rawSlug.toLowerCase().trim())
  );
}

/**
 * Normalizes slug and finds matching category
 */
export function findCategoryBySlug(rawSlug: string) {
  if (!rawSlug) return undefined;
  const slug = rawSlug.toLowerCase().trim();
  if (slug === "all") {
    return {
      id: "all",
      slug: "all",
      name: "All Print Merchandise",
      description: "The complete atelier catalogue of proof-ready custom merchandise with bulk tier pricing.",
      _count: { products: ALL_PRODUCTS.length },
    };
  }
  if (slug === "best-sellers") {
    return {
      id: "best-sellers",
      slug: "best-sellers",
      name: "Best Selling Merchandise",
      description: "Our top-rated products chosen by over 1,200 Indian tech companies, college festivals, and design teams.",
      _count: { products: ALL_PRODUCTS.filter((p) => p.isBestSeller).length },
    };
  }
  return CATEGORIES_LIST.find((c) => c.slug === slug);
}

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
        // Fallback to static
      }
    }

    return CATEGORIES_LIST;
  },
  ["categories-cache-key"],
  { tags: ["catalogue", "categories"], revalidate: 3600 }
);

/**
 * Fetch products with cache tag 'products'
 * Special: "t-shirts" includes "polo-shirts" per design specification.
 */
export const getCachedProducts = unstable_cache(
  async (categorySlug?: string) => {
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        const whereClause: Prisma.ProductWhereInput = { active: true };
        if (categorySlug === "t-shirts") {
          whereClause.category = { slug: { in: ["t-shirts", "polo-shirts"] } };
        } else if (categorySlug && categorySlug !== "all" && categorySlug !== "best-sellers") {
          whereClause.category = { slug: categorySlug };
        } else if (categorySlug === "best-sellers") {
          whereClause.isBestSeller = true;
        }

        const products = await prisma.product.findMany({
          where: whereClause,
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
      if (categorySlug === "t-shirts") {
        items = items.filter((p) => p.categorySlug === "t-shirts" || p.categorySlug === "polo-shirts");
      } else if (categorySlug && categorySlug !== "all" && categorySlug !== "best-sellers") {
        items = items.filter((p) => p.categorySlug === categorySlug);
      } else if (categorySlug === "best-sellers") {
        items = items.filter((p) => p.isBestSeller);
      }
      return items;
    },
    ["products-cache-key"],
      { tags: ["catalogue", "products"], revalidate: 3600 }
);

/**
 * Async lookup helper for single product
 */
export async function getProductBySlug(rawSlug: string): Promise<CatalogueProduct | undefined> {
  const canonical = normalizeSlug(rawSlug);
  const products = await getCachedProducts();
  return (
    products.find((p) => p.slug === canonical || p.id === canonical) ||
    products.find((p) => p.slug.toLowerCase() === rawSlug.toLowerCase().trim()) ||
    findProductBySlug(rawSlug)
  );
}

/**
 * Async lookup helper for single category
 */
export async function getCategoryBySlug(rawSlug: string) {
  const slug = rawSlug.toLowerCase().trim();
  const categories = await getCachedCategories();
  if (slug === "all") {
    return {
      id: "all",
      slug: "all",
      name: "All Print Merchandise",
      description: "The complete atelier catalogue of proof-ready custom merchandise with bulk tier pricing.",
      _count: { products: ALL_PRODUCTS.length },
    };
  }
  if (slug === "best-sellers") {
    return {
      id: "best-sellers",
      slug: "best-sellers",
      name: "Best Selling Merchandise",
      description: "Our top-rated products chosen by over 1,200 Indian tech companies, college festivals, and design teams.",
      _count: { products: ALL_PRODUCTS.filter((p) => p.isBestSeller).length },
    };
  }
  return categories.find((c) => c.slug === slug) || findCategoryBySlug(slug);
}
