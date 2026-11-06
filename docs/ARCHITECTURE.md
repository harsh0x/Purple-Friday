# Purple Friday — Architecture & System Design Document

This document outlines the architecture, directory structure, data flow, pricing computation engine, and security infrastructure for the Purple Friday bulk customization platform.

---

## 1. High-Level System Architecture

```
[ Customer Browser ]
       │
       ▼
[ Next.js Edge / Node Middleware ] ───► CSP Nonce, Security Headers, Honeypot Checks
       │
       ▼
[ Next.js 15 App Router ]
  ├── App Shell (Sticky Header, Mega Menu, Rotating Announcement Bar, Footer)
  ├── Search Drawer (Live debounced Prisma search)
  ├── Cart / Wishlist Drawers (Zustand persistent state synchronized with /api/cart/price)
  ├── Mockup Studio (SVG vector template engine with recoloring & logo projection)
  └── Styleguide & Component Library (/styleguide developer workbench)
       │
       ▼
[ Hardened API Route Layer (/src/lib/api.ts) ]
  ├── Origin Validation against NEXT_PUBLIC_SITE_URL
  ├── Sliding-Window Rate Limiter (Upstash Redis with In-Memory LRU Fallback)
  ├── Zod Request Body & Query Parsing (strict mode)
  └── Central Error Handler & Pino Logger (with UUID request tracking)
       │
       ▼
[ Core Business Logic & Domain Services ]
  ├── src/lib/pricing.ts (The single source of truth for all financial math)
  ├── src/lib/rate-limit.ts (Dual Upstash/LRU sliding window limiter)
  ├── src/lib/turnstile.ts (Cloudflare Turnstile token verification with graceful bypass)
  └── src/lib/logger.ts (Pino with PII redaction)
       │
       ▼
[ Data Access Layer ]
  └── Prisma 6 ORM ──► PostgreSQL (Neon Serverless Pooler)
```

---

## 2. Directory Structure

```
purple-friday/
├── docs/
│   ├── RULES.md              # Design Bible, Engineering Protocols & Security Rules
│   ├── ARCHITECTURE.md       # Folder structure, data flow, and pricing specification
│   └── PROGRESS.md           # Granular step tracking, completed files, and issues
├── prisma/
│   ├── schema.prisma         # Postgres models, enums, indexes, and relations
│   └── seed.ts               # Production seed script with 24+ products, tiers, reviews
├── public/
│   ├── fonts/                # Self-hosted font woff2 fallbacks
│   └── textures/             # Inline SVG noise & halftone patterns
├── scripts/
│   └── db-migrate.ts         # Graceful migration and schema sync script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cart/price/   # Server pricing endpoint for cart validation
│   │   │   ├── search/       # Debounced catalog search endpoint
│   │   │   ├── newsletter/   # Newsletter subscription handler
│   │   │   └── csp-report/   # Content Security Policy violation logger
│   │   ├── styleguide/       # Developer-only design system playground
│   │   ├── layout.tsx        # Root HTML layout with self-hosted font variables
│   │   ├── page.tsx          # Homepage with hero, categories, and proof banner
│   │   ├── loading.tsx       # Root segment skeleton loading screen
│   │   ├── error.tsx         # Segment error boundary with request-id display
│   │   ├── not-found.tsx     # On-brand 404 screen with popular category recovery
│   │   ├── global-error.tsx  # Hardened global emergency error fallback
│   │   └── globals.css       # Print-shop design tokens, registration marks, halftones
│   ├── components/
│   │   ├── layout/           # Header, AnnouncementBar, Footer, MegaMenu, MobileMenu
│   │   ├── drawers/          # SearchDrawer, CartDrawer, WishlistDrawer
│   │   ├── ui/               # Button, Badge, Chip, Input, Select, Checkbox, Tabs,
│   │   │                     # Accordion, Dialog, Drawer, Tooltip, Toaster, Price,
│   │   │                     # Rating, SectionHeading, CropCorner, HalftoneBackground
│   │   ├── feedback/         # Skeleton primitives and composite cards
│   │   ├── motion/           # LenisProvider, Reveal, PageTransition, useMagneticHover
│   │   └── mockup/           # Vector SVG templates (tee, polo, hoodie, cap, badge, etc.)
│   ├── hooks/                # useCart, useWishlist, useDebounce, useMediaQuery
│   ├── lib/
│   │   ├── api.ts            # Standardized API wrapper with auth/rate/validation guards
│   │   ├── fonts.ts          # next/font/local definitions for Bricolage, Instrument, DM Mono
│   │   ├── logger.ts         # Redacted Pino structured logger
│   │   ├── pricing.ts        # Single source of truth for tier pricing, GST, coupons, shipping
│   │   ├── prisma.ts         # Cached singleton PrismaClient
│   │   ├── rate-limit.ts     # In-memory LRU and Upstash Redis sliding-window limiter
│   │   ├── turnstile.ts      # Cloudflare Turnstile token verification
│   │   └── utils.ts          # cn() tailwind merger, INR currency formatter
│   └── env.ts                # Strict Zod validation for runtime environment secrets
├── tailwind.config.ts        # Custom theme extensions (ink, paper, violet, lilac, spot-lime)
└── vitest.config.mts         # Unit test configuration with path aliases
```

---

## 3. Pricing Calculation Flow (`src/lib/pricing.ts`)

### Security Principle
**Under zero circumstances does the client dictate unit prices, subtotal, discount, GST, or delivery fees.**
The client browser submits only:
- Product ID (`productId`)
- Selected configuration (`options`: size, colour, shape, fabric)
- Quantity (`qty`: integer)
- Optional coupon code (`couponCode`)

### Server Calculation Pipeline
1. **Quantity Normalization**:
   - Check if `qty >= product.minQty`. If less, clamp to `minQty`.
   - Check step alignment: `(qty - minQty) % product.qtyStep === 0`. If not, adjust to nearest valid step.
2. **Tier Price Matching**:
   - Query product `PriceTier` records ordered by `minQty ASC`.
   - Find tier where `minQty <= qty` and `(maxQty === null || qty <= maxQty)`.
   - Base unit price defaults to `tier.unitPrice`. If no tier matches, fall back to `product.basePrice`.
3. **Option Price Delta**:
   - For each selected option with a price modifier (e.g. premium 300GSM fabric `+₹40`), add `priceDelta` to unit price.
4. **Item Line Calculation**:
   - `lineTotal = (unitPrice + optionDelta) * qty`.
5. **Subtotal & Bulk Discounts**:
   - Sum line totals across all cart items.
6. **Coupon Verification**:
   - If coupon code submitted:
     - Verify coupon exists, `active === true`, and not expired (`expiresAt > now`).
     - Check `subtotal >= coupon.minSubtotal`.
     - Check `firstOrderOnly` (against user order history).
     - Calculate discount: `PERCENTAGE` (`subtotal * (value / 100)`) or `FLAT` (`value`).
7. **GST (Goods & Services Tax in India)**:
   - For custom printed merchandise in India, standard GST is 18% (or 5%/12% for specific textiles).
   - The platform calculates GST transparently: `gst = Math.round((discountedSubtotal) * 0.18)`.
8. **Shipping Surcharge**:
   - Bulk orders exceeding ₹2,500 qualify for **Free Standard Courier across India**.
   - Orders below ₹2,500 apply a flat ₹150 logistics fee.
9. **Final Grand Total**:
   - `grandTotal = discountedSubtotal + gst + shipping`.

---

## 4. Vector Mockup System (`src/components/mockup`)

To eliminate reliance on external stock photos during development and customization:
- Vector SVG templates are rendered in pure code with precise print-bounding coordinates.
- Available templates:
  1. `TShirtTemplate` (Crewneck tee, front/back print area)
  2. `PoloTemplate` (Ribbed collar polo with chest embroidery zone)
  3. `HoodieTemplate` (Fleece hoodie with kangaroo pocket & chest print area)
  4. `CapTemplate` (6-panel baseball cap with front crown print area)
  5. `BadgeTemplate` (Round magnetic lapel pin badge with metallic bevel)
  6. `PenTemplate` (Laser-engraved executive twist metal pen)
  7. `KeychainTemplate` (Stainless steel rectangle & acrylic oval keychain)
  8. `NotebookTemplate` (Hardbound moleskine-style debossed A5 journal)
  9. `BottleTemplate` (Insulated matte stainless steel 750ml flask)
- Templates support dynamic fabric recoloring (`fill` props) and SVG `<image>` transform overlays for customer uploaded logos.

---

## 5. Security & Rate Limiting Architecture

- **Middleware Nonce Generation**: Every request receives a cryptographically secure random base64 nonce injected into the `Content-Security-Policy-Report-Only` header.
- **Rate Limiting**:
  - Sliding-window algorithm tracks timestamped requests per IP + route key.
  - If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present, distributed Redis counters manage the window across multiple serverless instances.
  - If missing, an in-memory LRU cache handles local rate-limiting gracefully.
- **Fail-Fast Environment (`src/env.ts`)**:
  - Validates all process environment variables at cold start using Zod.
  - Missing non-critical keys (Cloudinary, Razorpay, Resend, Turnstile, Upstash) log explicit development warnings and configure mocked safe fallbacks.

