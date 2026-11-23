export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "vector-proofs-300-dpi-guide",
    title: "Why vector curves beat 300 DPI rasters every single time on metal badges",
    category: "Pre-Press & Proofing",
    excerpt:
      "When edge-sharpness is measured in fractions of a millimeter, raster upscaling creates micro-fuzz. Here is how our vector auto-trace engine preserves crisp hairline typography.",
    publishedAt: "12 Oct 2026",
    readTime: "4 min read",
    author: {
      name: "Anand Ranganathan",
      role: "Head of Pre-Press & Typography",
      avatarInitials: "AR",
    },
    tags: ["Prepress", "Typography", "Vector", "Badges"],
    content: `
# Why vector curves beat 300 DPI rasters on metal badges

When edge-sharpness is measured in fractions of a millimeter on a 58mm metal badge, raster upscaling creates visible edge feathering under direct daylight. 

Even a 300 DPI JPEG image contains pixel grids that translate into jagged micro-steps when plated onto brass or zinc alloy.

## The Mathematical Difference Between Rasters and Bezier Curves

A raster image is a rigid coordinate grid of pixels. When you resize a 500x500 PNG to fit a 70x25mm executive badge:
- The printer interpolation engine must guess pixel color transitions.
- High-contrast letterforms (like small 7pt sans-serif text) acquire gray fringing.
- Laser ablation tables cannot follow pixel grids without micro-stutters.

In contrast, vector formats (SVG, PDF, EPS) store shapes as mathematical Bezier splines:

$$\\mathbf{B}(t) = (1-t)^3 \\mathbf{P}_0 + 3(1-t)^2 t \\mathbf{P}_1 + 3(1-t) t^2 \\mathbf{P}_2 + t^3 \\mathbf{P}_3$$

The laser or offset plate maker renders directly to the physical limit of the machine—at **2400 DPI physical resolution**.

## Our Auto-Trace & Pre-Flight Protocol

Every logo uploaded to Purple Friday undergoes three automated quality gates:
1. **Hairline Thickness Verification:** Ensuring no strokes are thinner than 0.15mm (the physical ink-bridging threshold).
2. **Pantone Spot Extraction:** Separating hex colors into ISO 12647 spot plates.
3. **Curvature Optimization:** Smoothing anchor points to prevent jagged toolpaths on CNC laser heads.

Before we press a single piece, you review a 1:1 scale vector PDF proof on your phone or workstation screen.
    `,
  },
  {
    slug: "dtf-vs-screen-printing-bulk-apparel",
    title: "Direct-to-Film vs Silk Screen: The honest guide for runs between 25 and 500 pcs",
    category: "Apparel Engineering",
    excerpt:
      "Screen printing wins on ink density for single-colour bulk; DTF wins on multi-colour gradients and elastane stretch. We break down the cost curves and wash durability tests.",
    publishedAt: "28 Sep 2026",
    readTime: "6 min read",
    author: {
      name: "Kavitha Murugesan",
      role: "Textile Engineering Director",
      avatarInitials: "KM",
    },
    tags: ["Apparel", "Screen Printing", "DTF", "T-Shirts"],
    content: `
# Direct-to-Film vs Silk Screen: The Honest Guide for Bulk Apparel

Choosing the right printing method for your company tees or hackathon hoodies comes down to run quantity, artwork color count, and fabric elastane percentage.

## The Cost Curve Breakdown

Traditional silk screen printing requires physical emulsion mesh screens—one screen per color plate.
- **Setup Overhead:** Each screen costs roughly ₹600 to expose and register.
- **Breakeven Point:** For 1 to 2 color designs with 100+ pieces, silk screen provides the lowest unit price (down to ₹165/pc).
- **Multi-Color Limitation:** A 6-color gradient artwork on 30 hoodies would require ₹3,600 in screen fees alone!

Direct-to-Film (DTF) eliminates screen fees completely. Pigment inks with a hot-melt polyamide powder backing are printed onto release PET film and transferred under 6 Bar pneumatic heat at 165°C.

## Wash Durability Testing in Tirupur

In our wash testing lab, we subject prints to 50 automated wash cycles at 40°C with harsh commercial detergent:
- **DTF:** Retains 94% color vibrancy without crack lines, provided the garment is ironed inside-out.
- **Screen Print:** Offers unmatched ink penetration into the 180 GSM cotton yarn, virtually indestructible over years of heavy wear.

Our recommendation:
- **Runs under 50 pieces with multiple colors:** Choose DTF.
- **Runs over 100 pieces with 1-2 solid colors:** Choose Silkscreen.
    `,
  },
  {
    slug: "magnetic-badge-engineering",
    title: "Neodymium dual-magnet backing: zero pinholes, zero blazer fabric tear",
    category: "Materials Science",
    excerpt:
      "Traditional safety pins ruin premium suiting fabrics. How triple-plated NdFeB magnets provide 2.8 kg pull strength while remaining lightweight on silk and linen blends.",
    publishedAt: "14 Sep 2026",
    readTime: "3 min read",
    author: {
      name: "Farhan Qureshi",
      role: "Precision Metals Engineer",
      avatarInitials: "FQ",
    },
    tags: ["Hardware", "Magnets", "Engineering", "Badges"],
    content: `
# Neodymium Dual-Magnet Backing: Zero Pinholes, Zero Fabric Tear

Safety pin clasps were designed over a century ago for coarse wool and canvas. On modern high-thread-count super 120s wool blazers, silk sarees, and bamboo tees, piercing steel pins destroy fabric wefts permanently.

## The Neodymium NdFeB Solution

At Purple Friday, we standardized all executive lapel badges on **N42 sintered Neodymium-Iron-Boron (NdFeB)** magnetic bars:
- **Holding Force:** 2.8 kg vertical shear resistance.
- **Triple-Plating:** Nickel-Copper-Nickel electroplating prevents oxidation and rust from body sweat.
- **Weight Distribution:** The dual-pole magnetic bar spreads clamping force across a 45mm span, preventing localized fabric stretching.

Attendees at multi-day summits can clip their badges on and off in one second without poking holes into their formal wardrobe.
    `,
  },
  {
    slug: "corporate-swag-that-lasts",
    title: "How Fintech & Zepto onboarded 1,200 team members with zero waste packaging",
    category: "Client Spotlights",
    excerpt:
      "Moving away from throwaway plastic junk toward heavyweight 280 GSM fleece hoodies, dual-wall steel thermal flasks, and Smyth-sewn linen journals that people actually keep.",
    publishedAt: "02 Sep 2026",
    readTime: "5 min read",
    author: {
      name: "Anand Ranganathan",
      role: "Head of Pre-Press & Typography",
      avatarInitials: "AR",
    },
    tags: ["Case Study", "Corporate Gifts", "Sustainability"],
    content: `
# How Leading Tech Teams Onboarded 1,200 Members With Zero Waste

Most corporate onboarding kits end up in landfill bins: plastic keychains that snap, polyester tees that smell after one sweat, and cheap pens that skip after two sentences.

## The Shift to Heirloom Merchandise

In 2026, leading Indian startups completely shifted their merchandise strategy:
- **Heavyweight 320 GSM Fleece Hoodies:** Brushed cotton that employees wear out to dinner, not just to sleep in.
- **304 Food-Grade Stainless Steel Flasks:** Laser-etched with employee names; keeps water cold for 24 hours in hot Indian summers.
- **Smyth-Sewn Hardbound Journals:** 100 GSM acid-free ivory pages that lay flat at 180 degrees.

By investing in high-spec blanks with subtle tonal branding instead of garish loud logos, retention rate rose from 30% to over 96%.
    `,
  },
];
