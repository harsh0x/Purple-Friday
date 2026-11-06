import { PrismaClient, UserRole, Audience, ReviewStatus, CouponType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("--------------------------------------------------");
  console.log("Purple Friday — Database Seeding Protocol");
  console.log("--------------------------------------------------");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("sample-project") || databaseUrl.includes("user:password")) {
    console.warn(
      "[seed] DATABASE_URL not configured with live PostgreSQL credentials.\n" +
      "       Seed dataset is ready in code. Remote DB write deferred."
    );
    return;
  }

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@purplefriday.in";
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || "ChangeThisPasswordInProduction123!";
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: UserRole.ADMIN },
    create: {
      email: adminEmail,
      name: "Purple Friday Superadmin",
      passwordHash,
      role: UserRole.ADMIN,
      phone: "+919876543210",
    },
  });
  console.log(`[seed] Admin user verified: ${admin.email}`);

  // 2. Seed Coupon: FIRSTORDER (12% off, first order only)
  await prisma.coupon.upsert({
    where: { code: "FIRSTORDER" },
    update: {
      type: CouponType.PERCENTAGE,
      value: 12,
      minSubtotal: 1500,
      firstOrderOnly: true,
      active: true,
    },
    create: {
      code: "FIRSTORDER",
      type: CouponType.PERCENTAGE,
      value: 12,
      minSubtotal: 1500,
      firstOrderOnly: true,
      active: true,
    },
  });
  console.log("[seed] Coupon FIRSTORDER created (12% off first order)");

  // 3. Seed 6 Categories
  const categoryData = [
    {
      slug: "magnetic-badges",
      name: "Magnetic Badges",
      description: "High-definition offset-printed badges with strong neodymium magnetic fasteners. Zero fabric damage.",
      sortOrder: 1,
    },
    {
      slug: "t-shirts",
      name: "T-Shirts",
      description: "100% combed bio-washed cotton custom tees with direct-to-garment and spot-color screen printing.",
      sortOrder: 2,
    },
    {
      slug: "polo-shirts",
      name: "Polo Shirts",
      description: "220-240 GSM piqué knit corporate polos with precision embroidery and contrasting placket trims.",
      sortOrder: 3,
    },
    {
      slug: "hoodies",
      name: "Hoodies & Sweatshirts",
      description: "320 GSM brushed fleece winterwear tailored for startup teams, hackathons, and corporate offsites.",
      sortOrder: 4,
    },
    {
      slug: "caps",
      name: "Caps & Headwear",
      description: "Structured 6-panel twill caps and breathable mesh trucker hats with 3D puff embroidery.",
      sortOrder: 5,
    },
    {
      slug: "corporate-gifts",
      name: "Corporate Gifts & Kits",
      description: "Laser-engraved metal pens, debossed journals, vacuum flasks, and luxury onboarding kits.",
      sortOrder: 6,
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoryData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`[seed] ${categoryData.length} Categories seeded.`);

  // 4. Seed Products (24+ products across the 6 categories)
  const products = [
    // --- Magnetic Badges ---
    {
      slug: "round-gloss-badge-58mm",
      name: "58mm Round Gloss Magnetic Badge",
      shortName: "58mm Round Badge",
      categorySlug: "magnetic-badges",
      description: "Artisan gloss-laminated metallic badge backed by dual neodymium magnets. Industry standard for trade shows and conferences.",
      badges: ["Best Seller", "Zero Pinholes"],
      specChips: ["58mm Diameter", "Offset Proofing", "Neodymium Mag-Back"],
      audience: Audience.BOTH,
      minQty: 10,
      qtyStep: 5,
      isBestSeller: true,
      mrp: 140,
      basePrice: 85,
      printMethod: "Offset CMYK + Gloss Mylar",
      printAreas: { front: { shape: "circle", diameterMm: 58 } },
      template: "badge",
      tiers: [
        { minQty: 10, maxQty: 49, unitPrice: 85 },
        { minQty: 50, maxQty: 99, unitPrice: 65 },
        { minQty: 100, maxQty: 249, unitPrice: 52 },
        { minQty: 250, maxQty: null, unitPrice: 42 },
      ],
      options: [
        { name: "Finish", type: "FINISH", value: "High Gloss", priceDelta: 0 },
        { name: "Finish", type: "FINISH", value: "Velvet Matte", priceDelta: 5 },
        { name: "Backing", type: "BACKING", value: "Dual Magnetic Bar", priceDelta: 0 },
        { name: "Backing", type: "BACKING", value: "Safety Pin Clasp", priceDelta: -10 },
      ],
    },
    {
      slug: "matte-rectangle-name-badge",
      name: "Executive Rectangle Magnetic Name Badge (70x25mm)",
      shortName: "Executive Name Badge",
      categorySlug: "magnetic-badges",
      description: "Brushed metallic acrylic name badge with UV-printed company logo and personalized employee name.",
      badges: ["Executive Grade"],
      specChips: ["70x25mm", "Beveled Edge", "Individual Personalization"],
      audience: Audience.TEAM,
      minQty: 5,
      qtyStep: 1,
      isBestSeller: false,
      mrp: 220,
      basePrice: 160,
      printMethod: "Precision UV Print",
      printAreas: { front: { shape: "rect", widthMm: 70, heightMm: 25 } },
      template: "badge",
      tiers: [
        { minQty: 5, maxQty: 19, unitPrice: 160 },
        { minQty: 20, maxQty: 49, unitPrice: 135 },
        { minQty: 50, maxQty: 99, unitPrice: 115 },
        { minQty: 100, maxQty: null, unitPrice: 95 },
      ],
      options: [
        { name: "Plate Finish", type: "COLOUR", value: "Brushed Silver", hex: "#C0C0C0", priceDelta: 0 },
        { name: "Plate Finish", type: "COLOUR", value: "Brushed Gold", hex: "#D4AF37", priceDelta: 10 },
        { name: "Plate Finish", type: "COLOUR", value: "Matte Black", hex: "#15101F", priceDelta: 0 },
      ],
    },
    {
      slug: "metallic-gold-lapel-badge",
      name: "Custom Die-Cast Metallic Lapel Pin",
      shortName: "Die-Cast Lapel Pin",
      categorySlug: "magnetic-badges",
      description: "Jewelry-grade zinc alloy die-struck badge with soft enamel color infill and magnetic clutch.",
      badges: ["Premium Gift"],
      specChips: ["Die-Cast Zinc", "Soft Enamel", "Butterfly or Magnet"],
      audience: Audience.GIFTING,
      minQty: 25,
      qtyStep: 25,
      isBestSeller: false,
      mrp: 350,
      basePrice: 240,
      printMethod: "Die-Struck Enamel",
      printAreas: { front: { shape: "custom", maxDimensionMm: 35 } },
      template: "badge",
      tiers: [
        { minQty: 25, maxQty: 49, unitPrice: 240 },
        { minQty: 50, maxQty: 99, unitPrice: 190 },
        { minQty: 100, maxQty: 249, unitPrice: 150 },
        { minQty: 250, maxQty: null, unitPrice: 120 },
      ],
      options: [
        { name: "Metal Tone", type: "COLOUR", value: "Antique Gold", hex: "#CFB53B", priceDelta: 0 },
        { name: "Metal Tone", type: "COLOUR", value: "Nickel Silver", hex: "#E5E4E2", priceDelta: 0 },
      ],
    },
    {
      slug: "clear-acrylic-conference-badge",
      name: "Laser Cut Clear Acrylic Conference Badge",
      shortName: "Acrylic Badge",
      categorySlug: "magnetic-badges",
      description: "Glass-look 3mm clear acrylic badge with reverse UV color printing and polished flame-buffed edges.",
      badges: ["Modern Tech"],
      specChips: ["3mm Cast Acrylic", "Flame Polished", "Reverse Print"],
      audience: Audience.TEAM,
      minQty: 15,
      qtyStep: 5,
      isBestSeller: false,
      mrp: 180,
      basePrice: 110,
      printMethod: "Reverse UV High-Gloss",
      printAreas: { front: { shape: "rect", widthMm: 80, heightMm: 50 } },
      template: "badge",
      tiers: [
        { minQty: 15, maxQty: 49, unitPrice: 110 },
        { minQty: 50, maxQty: 99, unitPrice: 85 },
        { minQty: 100, maxQty: null, unitPrice: 68 },
      ],
      options: [
        { name: "Acrylic Color", type: "COLOUR", value: "Ultra Clear", hex: "#FFFFFF", priceDelta: 0 },
        { name: "Acrylic Color", type: "COLOUR", value: "Frosted Smoked", hex: "#483A5A", priceDelta: 10 },
      ],
    },

    // --- T-Shirts ---
    {
      slug: "classic-crewneck-tshirt",
      name: "Classic Crewneck Cotton T-Shirt (180 GSM)",
      shortName: "Classic 180 GSM Tee",
      categorySlug: "t-shirts",
      description: "100% super-combed cotton t-shirt, pre-shrunk and bio-washed for an exceptionally smooth print canvas. Engineered for team events.",
      badges: ["Best Seller", "100% Cotton"],
      specChips: ["180 GSM", "Bio-Washed", "DTG or Screen Print"],
      audience: Audience.BOTH,
      minQty: 5,
      qtyStep: 1,
      isBestSeller: true,
      mrp: 499,
      basePrice: 285,
      printMethod: "Direct-to-Garment / Silkscreen",
      printAreas: { chest: { widthMm: 280, heightMm: 350 }, back: { widthMm: 280, heightMm: 350 } },
      template: "tee",
      tiers: [
        { minQty: 5, maxQty: 14, unitPrice: 285 },
        { minQty: 15, maxQty: 49, unitPrice: 240 },
        { minQty: 50, maxQty: 99, unitPrice: 195 },
        { minQty: 100, maxQty: null, unitPrice: 165 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Carbon Black", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Paper Off-White", hex: "#F5F0E8", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Electric Violet", hex: "#6A2CFF", priceDelta: 15 },
        { name: "Colour", type: "COLOUR", value: "Navy Blue", hex: "#1B2A4A", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "S", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 10 },
        { name: "Size", type: "SIZE", value: "2XL", priceDelta: 20 },
      ],
    },
    {
      slug: "heavyweight-oversized-tee",
      name: "Heavyweight Streetwear Oversized Tee (240 GSM)",
      shortName: "240 GSM Oversized Tee",
      categorySlug: "t-shirts",
      description: "Heavyweight 240 GSM French Terry cotton with relaxed drop-shoulder silhouette and thick 1.2-inch ribbed collar. High streetwear aesthetic.",
      badges: ["Trending", "Heavyweight"],
      specChips: ["240 GSM French Terry", "Drop Shoulder", "High Density Print"],
      audience: Audience.TEAM,
      minQty: 10,
      qtyStep: 1,
      isBestSeller: true,
      mrp: 899,
      basePrice: 480,
      printMethod: "High-Density Puff / Screen Print",
      printAreas: { front: { widthMm: 300, heightMm: 380 }, back: { widthMm: 320, heightMm: 420 } },
      template: "tee",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 480 },
        { minQty: 25, maxQty: 49, unitPrice: 420 },
        { minQty: 50, maxQty: 99, unitPrice: 360 },
        { minQty: 100, maxQty: null, unitPrice: 310 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Washed Carbon", hex: "#221A31", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Vintage Lilac", hex: "#CDB8FF", priceDelta: 20 },
        { name: "Colour", type: "COLOUR", value: "Raw Natural", hex: "#EDE6DA", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 15 },
      ],
    },
    {
      slug: "sports-performance-tee",
      name: "Moisture-Wicking Athletic Poly Tee (160 GSM)",
      shortName: "Athletic Poly Tee",
      categorySlug: "t-shirts",
      description: "Quick-drying honeycomb polyester knit with antimicrobial treatment. Ideal for marathons, sports days, and active corporate offsites.",
      badges: ["Quick Dry"],
      specChips: ["160 GSM Polyester", "Sublimation Ready", "Breathable Mesh"],
      audience: Audience.TEAM,
      minQty: 10,
      qtyStep: 5,
      isBestSeller: false,
      mrp: 399,
      basePrice: 220,
      printMethod: "All-Over Sublimation / Vinyl",
      printAreas: { front: { widthMm: 280, heightMm: 350 } },
      template: "tee",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 220 },
        { minQty: 25, maxQty: 49, unitPrice: 185 },
        { minQty: 50, maxQty: 99, unitPrice: 155 },
        { minQty: 100, maxQty: null, unitPrice: 130 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Volt Lime", hex: "#D8FF3F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Charcoal Grey", hex: "#312540", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Royal Blue", hex: "#2A4B8C", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "S", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 0 },
      ],
    },
    {
      slug: "premium-organic-cotton-tee",
      name: "GOTS-Certified 100% Organic Cotton Tee (200 GSM)",
      shortName: "Organic 200 GSM Tee",
      categorySlug: "t-shirts",
      description: "Sustainably cultivated organic ring-spun cotton with eco-friendly water-based ink print. Comes with certified organic hangtag.",
      badges: ["Eco-Friendly"],
      specChips: ["GOTS Certified", "Water-Based Inks", "Zero Chemical Bleach"],
      audience: Audience.GIFTING,
      minQty: 15,
      qtyStep: 1,
      isBestSeller: false,
      mrp: 699,
      basePrice: 380,
      printMethod: "Eco Water-Based Screen Print",
      printAreas: { front: { widthMm: 260, heightMm: 340 } },
      template: "tee",
      tiers: [
        { minQty: 15, maxQty: 49, unitPrice: 380 },
        { minQty: 50, maxQty: 99, unitPrice: 310 },
        { minQty: 100, maxQty: null, unitPrice: 260 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Natural Sand", hex: "#F5F0E8", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Olive Drab", hex: "#484E3A", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Midnight Black", hex: "#15101F", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 10 },
      ],
    },

    // --- Polo Shirts ---
    {
      slug: "executive-pique-polo",
      name: "Executive Cotton Piqué Polo Shirt (230 GSM)",
      shortName: "230 GSM Piqué Polo",
      categorySlug: "polo-shirts",
      description: "Substantial 230 GSM honeycomb knit polo featuring mother-of-pearl buttons, ribbed armbands, and reinforced collar stays. Perfect for corporate leadership.",
      badges: ["Best Seller", "Corporate Choice"],
      specChips: ["230 GSM Piqué", "High-Density Embroidery", "Side Slits"],
      audience: Audience.BOTH,
      minQty: 5,
      qtyStep: 1,
      isBestSeller: true,
      mrp: 749,
      basePrice: 420,
      printMethod: "Japanese Tajima Embroidery",
      printAreas: { leftChest: { widthMm: 80, heightMm: 80 } },
      template: "polo",
      tiers: [
        { minQty: 5, maxQty: 14, unitPrice: 420 },
        { minQty: 15, maxQty: 49, unitPrice: 360 },
        { minQty: 50, maxQty: 99, unitPrice: 310 },
        { minQty: 100, maxQty: null, unitPrice: 265 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Jet Black", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Crisp White", hex: "#FAF7F2", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Royal Purple", hex: "#483A5A", priceDelta: 20 },
        { name: "Colour", type: "COLOUR", value: "Navy", hex: "#17223B", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "S", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 15 },
        { name: "Size", type: "SIZE", value: "2XL", priceDelta: 30 },
      ],
    },
    {
      slug: "contrast-tipped-polo",
      name: "Contrast Tipped Collar Executive Polo (220 GSM)",
      shortName: "Contrast Tipped Polo",
      categorySlug: "polo-shirts",
      description: "Sporty modern polo with contrasting collar stripe accents and tonal buttons. Designed for tech startups and retail sales uniforms.",
      badges: ["Smart Casual"],
      specChips: ["Dual Color Collar", "220 GSM Matty", "Anti-Pilling"],
      audience: Audience.TEAM,
      minQty: 10,
      qtyStep: 1,
      isBestSeller: false,
      mrp: 699,
      basePrice: 390,
      printMethod: "Left-Chest Embroidery / DTF",
      printAreas: { leftChest: { widthMm: 85, heightMm: 85 } },
      template: "polo",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 390 },
        { minQty: 25, maxQty: 49, unitPrice: 340 },
        { minQty: 50, maxQty: 99, unitPrice: 295 },
        { minQty: 100, maxQty: null, unitPrice: 250 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Black with Violet Tip", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Navy with Lime Tip", hex: "#1A2536", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 10 },
      ],
    },
    {
      slug: "drifit-team-polo",
      name: "Dri-Fit Polyester Performance Polo (170 GSM)",
      shortName: "Dri-Fit Team Polo",
      categorySlug: "polo-shirts",
      description: "Engineered micro-poly knit with side ventilation eyelets for hot outdoor climate. Sweat resistant and machine washable.",
      badges: ["High Durability"],
      specChips: ["Micro Poly", "Quick Dry", "Wrinkle Free"],
      audience: Audience.TEAM,
      minQty: 10,
      qtyStep: 5,
      isBestSeller: false,
      mrp: 499,
      basePrice: 290,
      printMethod: "Heat Transfer Vinyl / Embroidery",
      printAreas: { leftChest: { widthMm: 75, heightMm: 75 } },
      template: "polo",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 290 },
        { minQty: 25, maxQty: 49, unitPrice: 245 },
        { minQty: 50, maxQty: 99, unitPrice: 210 },
        { minQty: 100, maxQty: null, unitPrice: 175 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Steel Grey", hex: "#816F98", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Deep Violet", hex: "#6A2CFF", priceDelta: 15 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 0 },
      ],
    },
    {
      slug: "heavyweight-uniform-polo",
      name: "Industrial Heavyweight Workwear Polo (260 GSM)",
      shortName: "260 GSM Heavy Polo",
      categorySlug: "polo-shirts",
      description: "Durable 60% cotton 40% polyester blend built for warehouse operations, logistics crews, and facility staff.",
      badges: ["Heavy Duty"],
      specChips: ["260 GSM Blend", "Triple Stitching", "Stain Release"],
      audience: Audience.TEAM,
      minQty: 15,
      qtyStep: 5,
      isBestSeller: false,
      mrp: 649,
      basePrice: 350,
      printMethod: "Heavy Embroidery",
      printAreas: { leftChest: { widthMm: 80, heightMm: 80 } },
      template: "polo",
      tiers: [
        { minQty: 15, maxQty: 49, unitPrice: 350 },
        { minQty: 50, maxQty: 99, unitPrice: 300 },
        { minQty: 100, maxQty: null, unitPrice: 255 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Coal Black", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Navy Industrial", hex: "#17223B", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 10 },
      ],
    },

    // --- Hoodies & Sweatshirts ---
    {
      slug: "classic-pullover-hoodie",
      name: "Classic Kangaroo Pocket Pullover Hoodie (320 GSM)",
      shortName: "320 GSM Pullover Hoodie",
      categorySlug: "hoodies",
      description: "Thick brushed fleece hoodie with matching jersey-lined hood, flat drawcords with metal aglets, and front pouch pocket.",
      badges: ["Best Seller", "Winter Essential"],
      specChips: ["320 GSM Fleece", "Metal Aglets", "Screen / Embroidery"],
      audience: Audience.BOTH,
      minQty: 5,
      qtyStep: 1,
      isBestSeller: true,
      mrp: 1499,
      basePrice: 790,
      printMethod: "Screen Print / Front Embroidery",
      printAreas: { chest: { widthMm: 260, heightMm: 200 } },
      template: "hoodie",
      tiers: [
        { minQty: 5, maxQty: 14, unitPrice: 790 },
        { minQty: 15, maxQty: 49, unitPrice: 680 },
        { minQty: 50, maxQty: 99, unitPrice: 580 },
        { minQty: 100, maxQty: null, unitPrice: 495 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Carbon Ink", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Oatmeal Heather", hex: "#EDE6DA", priceDelta: 25 },
        { name: "Colour", type: "COLOUR", value: "Electric Violet", hex: "#6A2CFF", priceDelta: 35 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 30 },
        { name: "Size", type: "SIZE", value: "2XL", priceDelta: 60 },
      ],
    },
    {
      slug: "metal-zipper-fleece-jacket",
      name: "Full-Zip Executive Fleece Jacket (340 GSM)",
      shortName: "Full-Zip Fleece Jacket",
      categorySlug: "hoodies",
      description: "YKK antique brass zipper hoodie with cadet collar and concealed kangaroo pocket openings. Premium startup founder outerwear.",
      badges: ["Executive"],
      specChips: ["340 GSM Heavy Fleece", "YKK Brass Zip", "Embroidered Chest"],
      audience: Audience.GIFTING,
      minQty: 5,
      qtyStep: 1,
      isBestSeller: false,
      mrp: 1799,
      basePrice: 950,
      printMethod: "Precision Japanese Embroidery",
      printAreas: { leftChest: { widthMm: 80, heightMm: 80 } },
      template: "hoodie",
      tiers: [
        { minQty: 5, maxQty: 14, unitPrice: 950 },
        { minQty: 15, maxQty: 49, unitPrice: 830 },
        { minQty: 50, maxQty: null, unitPrice: 720 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Charcoal Ink", hex: "#221A31", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Midnight Navy", hex: "#1B2A4A", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "XL", priceDelta: 40 },
      ],
    },
    {
      slug: "minimalist-crewneck-sweatshirt",
      name: "Minimalist Crewneck Brushed Sweatshirt (300 GSM)",
      shortName: "300 GSM Sweatshirt",
      categorySlug: "hoodies",
      description: "Clean collarless sweatshirt with V-notch stitch detail and spandex ribbing at hem and cuffs. Ultra-soft inside fleece.",
      badges: ["Modern Cut"],
      specChips: ["300 GSM Brushed Fleece", "Ribbed Hem & Cuffs", "Water-Based Print"],
      audience: Audience.TEAM,
      minQty: 8,
      qtyStep: 1,
      isBestSeller: false,
      mrp: 1199,
      basePrice: 620,
      printMethod: "Center Chest Screen Print",
      printAreas: { centerChest: { widthMm: 250, heightMm: 180 } },
      template: "hoodie",
      tiers: [
        { minQty: 8, maxQty: 24, unitPrice: 620 },
        { minQty: 25, maxQty: 49, unitPrice: 530 },
        { minQty: 50, maxQty: null, unitPrice: 450 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Paper Ash", hex: "#F5F0E8", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Deep Lilac", hex: "#CDB8FF", priceDelta: 20 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
      ],
    },
    {
      slug: "varsity-raglan-hoodie",
      name: "Two-Tone Varsity Raglan Pullover (320 GSM)",
      shortName: "Two-Tone Varsity Hoodie",
      categorySlug: "hoodies",
      description: "College varsity styling with contrast color raglan sleeves and striped ribbed cuffs. Built for university student councils and clubs.",
      badges: ["Varsity"],
      specChips: ["Raglan Sleeves", "Striped Ribbing", "Twill Applique"],
      audience: Audience.TEAM,
      minQty: 15,
      qtyStep: 5,
      isBestSeller: false,
      mrp: 1399,
      basePrice: 720,
      printMethod: "Chenille Applique / Screen Print",
      printAreas: { center: { widthMm: 280, heightMm: 220 } },
      template: "hoodie",
      tiers: [
        { minQty: 15, maxQty: 49, unitPrice: 720 },
        { minQty: 50, maxQty: 99, unitPrice: 610 },
        { minQty: 100, maxQty: null, unitPrice: 520 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Black & Violet", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Navy & Grey", hex: "#1B2A4A", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "M", priceDelta: 0 },
        { name: "Size", type: "SIZE", value: "L", priceDelta: 0 },
      ],
    },

    // --- Caps & Headwear ---
    {
      slug: "structured-cotton-twill-cap",
      name: "Structured 6-Panel Cotton Twill Baseball Cap",
      shortName: "6-Panel Twill Cap",
      categorySlug: "caps",
      description: "Firm buckram structured crown with curved peak, embroidered ventilation eyelets, and adjustable brass buckle strap.",
      badges: ["Best Seller", "Staple Headwear"],
      specChips: ["100% Heavy Twill", "3D Puff Embroidery", "Brass Tuck-In Strap"],
      audience: Audience.BOTH,
      minQty: 5,
      qtyStep: 1,
      isBestSeller: true,
      mrp: 499,
      basePrice: 278,
      printMethod: "3D Puff Japanese Embroidery",
      printAreas: { frontCrown: { widthMm: 90, heightMm: 50 } },
      template: "cap",
      tiers: [
        { minQty: 5, maxQty: 14, unitPrice: 278 },
        { minQty: 15, maxQty: 49, unitPrice: 225 },
        { minQty: 50, maxQty: 99, unitPrice: 185 },
        { minQty: 100, maxQty: 149, unitPrice: 165 },
        { minQty: 150, maxQty: null, unitPrice: 150 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Matte Black", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Off-White Stone", hex: "#F5F0E8", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Electric Violet", hex: "#6A2CFF", priceDelta: 20 },
        { name: "Colour", type: "COLOUR", value: "Olive Camo", hex: "#484E3A", priceDelta: 15 },
        { name: "Size", type: "SIZE", value: "Adjustable (OSFA)", priceDelta: 0 },
      ],
    },
    {
      slug: "trucker-mesh-snapback-cap",
      name: "Retro Breathable Mesh Trucker Snapback",
      shortName: "Mesh Trucker Cap",
      categorySlug: "caps",
      description: "Padded polyester foam front panel paired with breathable nylon mesh back and classic 7-hole plastic snapback closure.",
      badges: ["Summer Hit"],
      specChips: ["Nylon Mesh Back", "Plastic Snapback", "Sublimation / Print"],
      audience: Audience.TEAM,
      minQty: 10,
      qtyStep: 5,
      isBestSeller: false,
      mrp: 399,
      basePrice: 220,
      printMethod: "High-Definition Screen Print / Patch",
      printAreas: { frontFoam: { widthMm: 100, heightMm: 55 } },
      template: "cap",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 220 },
        { minQty: 25, maxQty: 49, unitPrice: 180 },
        { minQty: 50, maxQty: 99, unitPrice: 145 },
        { minQty: 100, maxQty: null, unitPrice: 120 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Black / White Mesh", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Navy / White Mesh", hex: "#17223B", priceDelta: 0 },
      ],
    },
    {
      slug: "unstructured-dad-hat",
      name: "Vintage Washed Unstructured Dad Hat",
      shortName: "Washed Dad Hat",
      categorySlug: "caps",
      description: "Soft unlined cotton twill with garment wash enzyme treatment for a relaxed, broken-in feel right out of the box.",
      badges: ["Vintage Wash"],
      specChips: ["Enzyme Washed", "Antique Clasp", "Flat Embroidery"],
      audience: Audience.GIFTING,
      minQty: 10,
      qtyStep: 1,
      isBestSeller: false,
      mrp: 449,
      basePrice: 250,
      printMethod: "Tonal Flat Embroidery",
      printAreas: { frontCrown: { widthMm: 80, heightMm: 45 } },
      template: "cap",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 250 },
        { minQty: 25, maxQty: 49, unitPrice: 205 },
        { minQty: 50, maxQty: 99, unitPrice: 170 },
        { minQty: 100, maxQty: null, unitPrice: 140 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Washed Sage", hex: "#816F98", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Faded Black", hex: "#221A31", priceDelta: 0 },
      ],
    },
    {
      slug: "performance-running-visor",
      name: "Lightweight Quick-Dry Sports Sun Visor",
      shortName: "Sports Sun Visor",
      categorySlug: "caps",
      description: "Curved glare-reducing brim with inner terrycloth sweatband and adjustable velcro closure for sports events and marathons.",
      badges: ["Activewear"],
      specChips: ["Terry Sweatband", "Velcro Tab", "Ultralight"],
      audience: Audience.TEAM,
      minQty: 15,
      qtyStep: 5,
      isBestSeller: false,
      mrp: 349,
      basePrice: 195,
      printMethod: "Reflective Vinyl / Embroidery",
      printAreas: { front: { widthMm: 70, heightMm: 35 } },
      template: "cap",
      tiers: [
        { minQty: 15, maxQty: 49, unitPrice: 195 },
        { minQty: 50, maxQty: 99, unitPrice: 160 },
        { minQty: 100, maxQty: null, unitPrice: 130 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Bright Lime", hex: "#D8FF3F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Solid Black", hex: "#15101F", priceDelta: 0 },
      ],
    },

    // --- Corporate Gifts & Kits ---
    {
      slug: "executive-brass-twist-pen",
      name: "Executive Brass Twist Metal Ballpoint Pen",
      shortName: "Brass Twist Pen",
      categorySlug: "corporate-gifts",
      description: "Solid weighted brass barrel with matte electroplated finish, smooth German Schmidt refill, and mirror-gold laser etching.",
      badges: ["Best Seller", "German Refill"],
      specChips: ["Solid Brass Barrel", "Schmidt Refill", "Laser Engraving"],
      audience: Audience.GIFTING,
      minQty: 10,
      qtyStep: 5,
      isBestSeller: true,
      mrp: 450,
      basePrice: 220,
      printMethod: "Fiber Laser Engraving",
      printAreas: { barrel: { widthMm: 45, heightMm: 6 } },
      template: "pen",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 220 },
        { minQty: 25, maxQty: 49, unitPrice: 175 },
        { minQty: 50, maxQty: 99, unitPrice: 140 },
        { minQty: 100, maxQty: null, unitPrice: 110 },
      ],
      options: [
        { name: "Finish", type: "COLOUR", value: "Matte Black & Gold", hex: "#15101F", priceDelta: 0 },
        { name: "Finish", type: "COLOUR", value: "Brushed Chrome", hex: "#DDD4E6", priceDelta: 15 },
        { name: "Finish", type: "COLOUR", value: "Violet Anodized", hex: "#6A2CFF", priceDelta: 20 },
      ],
    },
    {
      slug: "hardbound-leather-journal-a5",
      name: "Hardbound Debossed A5 Vegan Leather Journal (192 Pages)",
      shortName: "A5 Leather Journal",
      categorySlug: "corporate-gifts",
      description: "Handcrafted 192-page 100 GSM ivory ruled paper diary with PU leather cover, expanding inner back pocket, and elastic pen loop.",
      badges: ["Top Corporate Gift"],
      specChips: ["100 GSM Ivory Paper", "Blind Debossing", "Expandable Pocket"],
      audience: Audience.GIFTING,
      minQty: 10,
      qtyStep: 1,
      isBestSeller: true,
      mrp: 599,
      basePrice: 340,
      printMethod: "Blind Deboss / Gold Foil Stamping",
      printAreas: { cover: { widthMm: 80, heightMm: 100 } },
      template: "notebook",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 340 },
        { minQty: 25, maxQty: 49, unitPrice: 285 },
        { minQty: 50, maxQty: 99, unitPrice: 235 },
        { minQty: 100, maxQty: null, unitPrice: 195 },
      ],
      options: [
        { name: "Cover Tone", type: "COLOUR", value: "Carbon Leather", hex: "#15101F", priceDelta: 0 },
        { name: "Cover Tone", type: "COLOUR", value: "Rich Tan", hex: "#8B5A2B", priceDelta: 10 },
        { name: "Cover Tone", type: "COLOUR", value: "Deep Violet", hex: "#483A5A", priceDelta: 15 },
      ],
    },
    {
      slug: "matte-insulated-steel-flask",
      name: "Double-Wall Insulated Matte Steel Flask (750ml)",
      shortName: "750ml Insulated Flask",
      categorySlug: "corporate-gifts",
      description: "Vacuum-insulated 304 food-grade stainless steel bottle keeping liquids cold for 24 hours and hot for 12 hours. Sweat-proof powder coating.",
      badges: ["24h Cold / 12h Hot"],
      specChips: ["304 Stainless Steel", "Powder Coated", "Laser Etched Logo"],
      audience: Audience.BOTH,
      minQty: 10,
      qtyStep: 1,
      isBestSeller: true,
      mrp: 899,
      basePrice: 480,
      printMethod: "360° Rotary UV / Laser Engraving",
      printAreas: { body: { widthMm: 50, heightMm: 120 } },
      template: "bottle",
      tiers: [
        { minQty: 10, maxQty: 24, unitPrice: 480 },
        { minQty: 25, maxQty: 49, unitPrice: 410 },
        { minQty: 50, maxQty: 99, unitPrice: 350 },
        { minQty: 100, maxQty: null, unitPrice: 295 },
      ],
      options: [
        { name: "Colour", type: "COLOUR", value: "Matte Ink", hex: "#15101F", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Pure White", hex: "#FAF7F2", priceDelta: 0 },
        { name: "Colour", type: "COLOUR", value: "Lilac Haze", hex: "#CDB8FF", priceDelta: 25 },
      ],
    },
    {
      slug: "steel-engraved-keychain",
      name: "Heavy Stainless Steel Rectangle Engraved Keychain",
      shortName: "Steel Keychain",
      categorySlug: "corporate-gifts",
      description: "Solid 2.5mm stainless steel tag with hand-brushed satin finish, high-tensile flat split ring, and permanent deep laser engraving.",
      badges: ["Lifetime Finish"],
      specChips: ["2.5mm Stainless Steel", "Deep Fiber Laser", "Individual Boxed"],
      audience: Audience.GIFTING,
      minQty: 20,
      qtyStep: 10,
      isBestSeller: false,
      mrp: 299,
      basePrice: 145,
      printMethod: "Deep Fiber Laser Engraving",
      printAreas: { plate: { widthMm: 45, heightMm: 22 } },
      template: "keychain",
      tiers: [
        { minQty: 20, maxQty: 49, unitPrice: 145 },
        { minQty: 50, maxQty: 99, unitPrice: 110 },
        { minQty: 100, maxQty: 249, unitPrice: 85 },
        { minQty: 250, maxQty: null, unitPrice: 65 },
      ],
      options: [
        { name: "Finish", type: "COLOUR", value: "Brushed Silver", hex: "#DDD4E6", priceDelta: 0 },
        { name: "Finish", type: "COLOUR", value: "Matte Gunmetal", hex: "#312540", priceDelta: 10 },
      ],
    },
  ];

  for (const p of products) {
    const categoryId = categoryMap.get(p.categorySlug);
    if (!categoryId) continue;

    const createdProduct = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        shortName: p.shortName,
        description: p.description,
        badges: p.badges,
        specChips: p.specChips,
        audience: p.audience,
        minQty: p.minQty,
        qtyStep: p.qtyStep,
        isBestSeller: p.isBestSeller,
        mrp: p.mrp,
        basePrice: p.basePrice,
        printMethod: p.printMethod,
        printAreas: p.printAreas,
        categoryId,
      },
      create: {
        slug: p.slug,
        name: p.name,
        shortName: p.shortName,
        description: p.description,
        badges: p.badges,
        specChips: p.specChips,
        audience: p.audience,
        minQty: p.minQty,
        qtyStep: p.qtyStep,
        isBestSeller: p.isBestSeller,
        mrp: p.mrp,
        basePrice: p.basePrice,
        printMethod: p.printMethod,
        printAreas: p.printAreas,
        categoryId,
      },
    });

    // Delete existing tiers & options before reseeding to keep idempotent
    await prisma.priceTier.deleteMany({ where: { productId: createdProduct.id } });
    await prisma.productOption.deleteMany({ where: { productId: createdProduct.id } });

    // Insert Price Tiers
    for (const tier of p.tiers) {
      await prisma.priceTier.create({
        data: {
          productId: createdProduct.id,
          minQty: tier.minQty,
          maxQty: tier.maxQty,
          unitPrice: tier.unitPrice,
        },
      });
    }

    // Insert Options
    for (const opt of p.options) {
      await prisma.productOption.create({
        data: {
          productId: createdProduct.id,
          name: opt.name,
          type: opt.type,
          value: opt.value,
          hex: "hex" in opt ? opt.hex : null,
          priceDelta: opt.priceDelta,
        },
      });
    }
  }
  console.log(`[seed] ${products.length} Products seeded with tier pricing and options.`);

  // 5. Seed 50+ Approved Customer Reviews
  const reviewAuthors = [
    { name: "Rohit Deshmukh", role: "VP Engineering", company: "Fintech Scaleup" },
    { name: "Ananya Sen", role: "HR Lead", company: "Zomato Partner Office" },
    { name: "Karthik Raja", role: "Co-Founder", company: "Bengaluru Tech Lab" },
    { name: "Meera Nair", role: "Events Convenor", company: "IIT Madras Alumni" },
    { name: "Arjun Mehta", role: "Marketing Director", company: "D2C Brand House" },
    { name: "Pooja Hegde", role: "Procurement Manager", company: "Kolkata IT Park" },
    { name: "Vikram Singhania", role: "Operations Lead", company: "Gurugram Logistics" },
    { name: "Siddharth Jain", role: "Campus Ambassador", company: "BITS Pilani" },
    { name: "Divya Krishnan", role: "Design Lead", company: "Creative Studio BLR" },
    { name: "Tanmay Bhasin", role: "Founder", company: "DevAgency Delhi" },
  ];

  const reviewTitles = [
    "Flawless print alignment and crisp offset detail",
    "Exceeded expectations for our 200-person summit",
    "Neodymium magnets are remarkably strong",
    "Proof approval before print saved us from a costly logo error",
    "Piqué polo fabric feels on par with Lacoste or Ralph Lauren",
    "Delivery arrived 2 days ahead of schedule in Mumbai",
    "Colors matched our official brand hex codes 1:1",
    "Laser engraving on the brass pens looks exceptionally crisp",
    "Seamless GST invoice with 18% input credit received instantly",
    "Our team loved the 240 GSM oversized tees, ordering 100 more",
  ];

  const reviewBodies = [
    "We ordered 150 magnetic badges for our annual engineering conclave. The offset print quality was razor-sharp and the magnetic clasp held firmly through suits and shirts without piercing any fabric.",
    "The digital proof system was a game changer. The studio showed us a 3D preview, we adjusted our vector positioning by 4mm, and the final production polo shirts came out exactly as rendered.",
    "Ordered 75 vacuum-insulated bottles with laser-etched startup logos. Powder coating is smooth and water stays iced cold throughout our entire 10-hour hackathon.",
    "Best tier pricing we found across India. We saved nearly 35% by ordering in bulk for our college orientation batches. Zero defectives in a 300-piece drop.",
    "Heavyweight 320 GSM hoodies are plush, warm, and the Tajima embroidery on the chest is dense with zero loose threads. Absolute five-star service.",
  ];

  // Fetch all created products to distribute reviews
  const allProducts = await prisma.product.findMany();
  await prisma.review.deleteMany(); // Reset reviews

  let reviewCount = 0;
  for (let i = 0; i < 54; i++) {
    const product = allProducts[i % allProducts.length];
    const author = reviewAuthors[i % reviewAuthors.length];
    const title = reviewTitles[i % reviewTitles.length];
    const body = reviewBodies[i % reviewBodies.length];
    const rating = i % 7 === 0 ? 4 : 5; // Mostly 5 stars, occasional 4 stars

    await prisma.review.create({
      data: {
        productId: product.id,
        rating,
        title,
        body,
        verified: true,
        status: ReviewStatus.APPROVED,
        authorName: `${author.name} (${author.role}, ${author.company})`,
        photoUrls: [],
      },
    });
    reviewCount++;
  }
  console.log(`[seed] ${reviewCount} Approved reviews seeded across all products.`);

  // 6. Seed 8 FAQs
  const faqs = [
    {
      question: "What is your standard production and delivery timeline across India?",
      answer: "Standard production requires 3 to 5 business days following your digital press proof sign-off. Express air courier transit delivers within 24 to 48 hours to major metros (Bengaluru, Mumbai, Delhi-NCR, Hyderabad, Chennai, Pune) and 3 to 4 days across all other Indian PIN codes.",
      category: "Delivery & Shipping",
      sortOrder: 1,
    },
    {
      question: "Do you offer Cash on Delivery (COD) for bulk merchandise orders?",
      answer: "Because all products are customized and permanently printed with your unique corporate or personal artwork, we do not support Cash on Delivery. We accept 100% secure payments via Razorpay (UPI, Credit/Debit Cards, Net Banking) and NEFT/RTGS bank transfers for large enterprise invoices.",
      category: "Payments",
      sortOrder: 2,
    },
    {
      question: "What are your shipping charges?",
      answer: "All bulk orders exceeding ₹2,500 qualify for free insured express delivery across India. For smaller sample orders under ₹2,500, a flat logistics fee of ₹150 is applied at checkout.",
      category: "Delivery & Shipping",
      sortOrder: 3,
    },
    {
      question: "Will I get to see and approve a digital proof before printing starts?",
      answer: "Yes, 100%. After you configure your order in our studio, our prepress team verifies your vector file resolution, bleed margins, and color profiles. You receive a digital 3D proof via email and dashboard for your explicit one-click sign-off before your merchandise hits the press.",
      category: "Design & Printing",
      sortOrder: 4,
    },
    {
      question: "Can I cancel or modify my order after payment?",
      answer: "You can request free modifications or cancellations at any point until you click 'Approve Press Proof'. Once you approve your digital proof and raw blanks are queued for printing or embroidery, orders cannot be cancelled or modified.",
      category: "Orders & Returns",
      sortOrder: 5,
    },
    {
      question: "What happens if an item arrives damaged or has a printing defect?",
      answer: "We stand firmly behind our 100% Quality Guarantee. If any item arrives damaged in transit or exhibits a manufacturing or printing defect compared to your approved digital proof, report it within 7 days of delivery with photos and we will reprint and air-dispatch replacements immediately free of charge.",
      category: "Orders & Returns",
      sortOrder: 6,
    },
    {
      question: "Do you provide GST tax invoices with 18% Input Tax Credit?",
      answer: "Yes. Simply input your registered 15-digit GSTIN and legal entity name during checkout or in your account settings. A compliant GST tax invoice with SAC/HSN codes and 18% tax credit is auto-generated and emailed immediately upon dispatch.",
      category: "Billing & GST",
      sortOrder: 7,
    },
    {
      question: "How does your quantity-wise bulk discount tier pricing work?",
      answer: "Our pricing is strictly tiered: as your order volume increases, the unit cost decreases dramatically (e.g. from ₹278/pc at 5 pieces down to ₹150/pc for 150+ pieces). Tier brackets are computed automatically in your cart with zero manual coupons required.",
      category: "Pricing & Discounts",
      sortOrder: 8,
    },
  ];

  await prisma.faq.deleteMany();
  for (const faq of faqs) {
    await prisma.faq.create({ data: faq });
  }
  console.log(`[seed] ${faqs.length} FAQs seeded.`);

  // 7. Seed 3 Blog Posts
  const blogPosts = [
    {
      slug: "choosing-between-dtg-and-screen-printing-in-india",
      title: "Direct-to-Garment vs. Spot Screen Printing: The Prepress Guide for Corporate Merch",
      excerpt: "Understand the technical trade-offs between DTG high-color gradients and traditional spot Pantone screen prints when ordering 50 to 5,000 corporate t-shirts.",
      content: `## The Physics of Ink on Cotton
When ordering custom printed merchandise for tech teams or corporate gifts in India, choosing the appropriate print method determines both garment longevity and per-unit cost.

### Direct-to-Garment (DTG)
DTG operates similarly to a high-precision inkjet printer, firing microscopic droplets of water-based pigment ink directly into cotton fibers.
- **Ideal For**: Multi-color gradients, photorealistic graphics, and small batches (10 to 50 pieces).
- **Feel**: Ultra-soft hand feel with zero rubbery plastic stiffness.
- **Limitation**: Requires 100% bio-washed cotton for optimal ink adhesion.

### Spot Screen Printing
Screen printing forces plastisol or water-based inks through mesh stencils onto the fabric.
- **Ideal For**: Large orders (50+ pieces) with 1 to 4 distinct Pantone brand colors.
- **Feel**: Crisp, opaque, and highly vibrant even on jet-black textiles.
- **Cost**: Per-piece setup costs decrease drastically as quantity increases.`,
      authorName: "Kavita Rao, Head of Prepress",
      publishedAt: new Date(),
      published: true,
      tags: ["Printing Guide", "DTG", "Screen Print", "Apparel"],
      readTimeMinutes: 5,
    },
    {
      slug: "why-magnetic-badges-are-replacing-pin-badges",
      title: "Why High-Strength Magnetic Badges are Replacing Traditional Safety Pin Lapels",
      excerpt: "Discover why premier Indian conferences and enterprises are switching to dual-neodymium magnetic fasteners to protect expensive corporate blazers and silk sarees.",
      content: `## The End of Ruined Wardrobes
For decades, standard conference badges relied on cheap safety pins or alligator clips. For attendees wearing tailored blazers, linen shirts, or silk sarees, piercing fine textiles with thick brass pins caused permanent thread damage.

### The Neodymium Solution
Our magnetic badges utilize dual N42 neodymium rare-earth magnets encased in durable ABS plastic:
1. **Zero Fabric Penetration**: The magnet clamps through thick wool blazers without tearing a single thread.
2. **Self-Centering**: Magnets automatically align the badge horizontally on lapels.
3. **5-Year Holding Power**: Retains over 99% of magnetic field strength for long-term reusability across multiple summit editions.`,
      authorName: "Anand Nair, Product Design Lead",
      publishedAt: new Date(),
      published: true,
      tags: ["Badges", "Conference Prep", "Materials Science"],
      readTimeMinutes: 4,
    },
    {
      slug: "tax-benefits-of-corporate-merchandise-gst-guide",
      title: "How Indian Businesses Claim 18% GST Input Tax Credit on Corporate Gifting and Uniforms",
      excerpt: "A practical guide to HSN/SAC codes, business expense classification, and claiming 18% GST input tax credit on custom team merchandise.",
      content: `## Maximizing Corporate Procurement Value
Custom merchandise is not just a branding tool—it is an official business expense recognized by the Central Board of Indirect Taxes and Customs (CBIC).

### Uniforms vs. Corporate Gifts
1. **Team Uniforms (Apparel with Company Logo)**: Fully eligible for Input Tax Credit under Section 16(1) of the CGST Act as legitimate business operational expenditure.
2. **Client Gifting**: Review Section 17(5)(h) restrictions and ensure gifts are classified under marketing collateral or promotional merchandise.

### Inputting Your GSTIN on Purple Friday
Ensure you enter your legal 15-digit GSTIN at checkout. All our tax invoices are B2B-compliant with full GST breakups for your monthly GSTR-2B reconciliation.`,
      authorName: "S. Venkatesh, Chartered Accountant",
      publishedAt: new Date(),
      published: true,
      tags: ["Tax & Billing", "GST", "Corporate Procurement"],
      readTimeMinutes: 6,
    },
  ];

  await prisma.blogPost.deleteMany();
  for (const post of blogPosts) {
    await prisma.blogPost.create({ data: post });
  }
  console.log(`[seed] ${blogPosts.length} Blog posts seeded.`);

  console.log("--------------------------------------------------");
  console.log("Database Seeding Completed Successfully!");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
