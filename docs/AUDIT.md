# Purple Friday — Codebase Architecture & Technical Audit

**Date**: 2026-11-07  
**Project**: Purple Friday (Production B2B & B2C Custom-Printed Merchandise Storefront for India)  
**Author**: Antigravity Technical Lead  
**Audit Purpose**: Complete preflight analysis before resolving 404 navigation failures, contrast defects, category pages, and full-spec product detail pages.

---

## 1. Framework & Core Stack Versions

From [`purple-friday/package.json`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/package.json):

* **Framework**: Next.js `15.1.7` (App Router, TypeScript strict mode enabled)
* **Runtime**: React `19.0.0` / React DOM `19.0.0`
* **CSS Framework**: Tailwind CSS `3.4.17` with PostCSS and custom editorial design tokens
* **Database & ORM**: Prisma Client `6.4.1` with PostgreSQL (Neon) and in-memory singleton fallback
* **Authentication**: NextAuth `4.24.15` (Credentials provider with bcryptjs password hashing and brute-force lockout policy)
* **Form & Validation**: React Hook Form `7.91.0` + Zod `4.6.7` + `@hookform/resolvers`
* **State Management**: Zustand `5.0.3` with `persist` middleware (local storage hydration)
* **Motion & Animation**:
  * GSAP `3.15.1` with ScrollTrigger
  * Lenis `1.3.27` smooth scroll integrated into the GSAP ticker
  * Motion (`motion/react`) `14.10.0`
* **Graphics & Prepress**:
  * Konva `10.9.1` & React-Konva `19.3.2` (dynamic client-side canvas customizer)
  * Sharp `0.35.5` (server-side image rasterization, EXIF stripping, and magic byte sanitization)
  * PDF-Lib `1.17.1` (automated GST Tax Invoice & Corporate Quote PDF generation)
  * Isomorphic-DOMPurify `4.7.0` (strict SVG sanitizer)
* **Payment Gateway**: Razorpay `2.9.8` (Test mode with server-side HMAC-SHA256 signature verification)
* **Testing**: Vitest `5.1.0` + Playwright

---

## 2. Directory Structure & Existing Routes (`src/app`)

Audit of all existing endpoints in `src/app`:

### Storefront & Content Pages
* `/` (`src/app/page.tsx`) — Flagship 11-section editorial home page
* `/_not-found` (`src/app/not-found.tsx`) — On-brand custom 404 page ("This Press Plate Does Not Exist")
* `/about` (`src/app/about/page.tsx`) — Atelier story, Bengaluru & Tirupur manufacturing capabilities
* `/corporate-gifting` (`src/app/corporate-gifting/page.tsx`) — B2B Kit planner & instant PDF quote generator
* `/contact` (`src/app/contact/page.tsx`) — Contact & bulk inquiry form
* `/styleguide` (`src/app/styleguide/page.tsx`) — Design tokens, typography specimens, and button matrix
* `/track-order` (`src/app/track-order/page.tsx`) — Public order status & courier milestone tracker
* `/blog` (`src/app/blog/page.tsx`) & `/blog/[slug]` (`src/app/blog/[slug]/page.tsx`) — Prepress technical journal
* Policy Pages:
  * `/privacy` (`src/app/privacy/page.tsx`)
  * `/terms` (`src/app/terms/page.tsx`)
  * `/shipping-policy` (`src/app/shipping-policy/page.tsx`)
  * `/cancellation-and-refund` (`src/app/cancellation-and-refund/page.tsx`)

### Commerce & Checkout Flows
* `/cart` (`src/app/cart/page.tsx`) — Full cart view with GST breakdown and coupon controls
* `/wishlist` (`src/app/wishlist/page.tsx`) — Customer saved items
* `/checkout` (`src/app/checkout/page.tsx`) — 3-step checkout (Contact, Shipping with PIN code validation, Payment)
* `/checkout/success/[orderNumber]` (`src/app/checkout/success/[orderNumber]/page.tsx`) — Order receipt & next-steps
* `/design/[slug]` (`src/app/design/[slug]/page.tsx`) — Interactive Konva logo customizer studio route

### Existing Category & Product Dynamic Routes
* `/collections/[slug]` (`src/app/collections/[slug]/page.tsx`)
* `/collections/all` (`src/app/collections/all/page.tsx`)
* `/collections/best-sellers` (`src/app/collections/best-sellers/page.tsx`)
* `/products/[slug]` (`src/app/products/[slug]/page.tsx`)
* ⚠️ **MISSING ROUTES (Root Cause of 404s)**:
  * `/product/[slug]` — **Did not exist** (All UI links were pointing here!)
  * `/category/[slug]` — **Did not exist** (All header, menu, and card links pointed here!)

### Customer Account & Admin Control Room
* `/account` (`src/app/account/page.tsx`) & `/account/orders/[id]` (`src/app/account/orders/[id]/page.tsx`)
* `/admin` (`src/app/admin/page.tsx`)
* `/admin/orders` (`src/app/admin/orders/page.tsx`)
* `/admin/products` (`src/app/admin/products/page.tsx`)
* `/admin/coupons` (`src/app/admin/coupons/page.tsx`)
* `/admin/quotes` (`src/app/admin/quotes/page.tsx`)
* `/admin/reviews` (`src/app/admin/reviews/page.tsx`)
* `/admin/settings` (`src/app/admin/settings/page.tsx`)

### API Routes (30+ Endpoints)
* `/api/uploads` & `/api/uploads/[id]`
* `/api/designs` & `/api/designs/[id]`
* `/api/cart/price`
* `/api/orders`, `/api/orders/user`, `/api/orders/[orderNumber]/invoice`, `/api/orders/[orderNumber]/proof`
* `/api/payments/verify`, `/api/webhooks/razorpay`
* `/api/assistant`
* `/api/corporate/quotation-pdf`
* `/api/admin/*` (audit, coupons, products, quotes, reviews, orders export, proof management)
* `/api/auth/*` (register, sync, forgot-password, reset-password, [...nextauth])

---

## 3. Product & Category Data Architecture

Data is structured with dual-layer resilience:

1. **Database Layer ([`prisma/schema.prisma`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/prisma/schema.prisma) & [`prisma/seed.ts`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/prisma/seed.ts))**:
   * Models: `Category`, `Product`, `PriceTier`, `ProductColor`, `ProductSpec`, `Review`, `Order`, `OrderItem`, `Design`, `Upload`, `Coupon`, `AuditLog`.
   * Seeded with 24 flagship products across 6 active departments.
2. **Static & Cache Layer ([`src/lib/catalogue.ts`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/lib/catalogue.ts))**:
   * `getCachedCategories()` and `getCachedProducts()` wrapped with Next.js `unstable_cache`.
   * Falls back gracefully to `ALL_PRODUCTS` and `CATEGORIES_LIST` when database credentials are not connected or during isolated build steps.
3. **Pricing Calculations ([`src/lib/pricing.ts`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/lib/pricing.ts))**:
   * Source of truth for tier price brackets, FIRSTORDER 12% coupon discount, 18% GST (CGST 9% + SGST 9% or IGST 18%), and free air express shipping threshold (> ₹2,500).

---

## 4. Exact Slug Inventory

### Categories:
1. `magnetic-badges` — Dual-neodymium magnetic fastener lapel pins and conference badges.
2. `t-shirts` — 100% bio-washed custom printed cotton tees (includes athletic & heavyweight).
3. `polo-shirts` — 230 GSM piqué corporate embroidered polos.
4. `hoodies` — 320 GSM brushed heavy fleece hoodies & sweatshirts.
5. `caps` — Structured 6-panel twill and retro mesh trucker caps.
6. `corporate-gifts` — Laser pens, notebooks, and insulated flasks.
* Virtual views: `best-sellers`, `all`.

### Products (Complete 24-Item Matrix):
| Slug | Category | Template | Min Qty | Base Price (INR) |
| :--- | :--- | :--- | :--- | :--- |
| `round-gloss-badge-58mm` | magnetic-badges | badge | 10 | ₹85 |
| `matte-rectangle-name-badge` | magnetic-badges | badge | 5 | ₹160 |
| `metallic-gold-lapel-badge` | magnetic-badges | badge | 25 | ₹180 |
| `clear-acrylic-conference-badge` | magnetic-badges | badge | 20 | ₹75 |
| `classic-crewneck-tshirt` | t-shirts | tee | 5 | ₹285 |
| `heavyweight-oversized-tee` | t-shirts | tee | 5 | ₹420 |
| `sports-performance-tee` | t-shirts | tee | 10 | ₹240 |
| `premium-organic-cotton-tee` | t-shirts | tee | 10 | ₹340 |
| `executive-pique-polo` | polo-shirts | polo | 5 | ₹380 |
| `contrast-tipped-polo` | polo-shirts | polo | 5 | ₹410 |
| `drifit-team-polo` | polo-shirts | polo | 10 | ₹320 |
| `heavyweight-uniform-polo` | polo-shirts | polo | 10 | ₹450 |
| `classic-pullover-hoodie` | hoodies | hoodie | 5 | ₹680 |
| `metal-zipper-fleece-jacket` (alias `zipper-fleece-hoodie`) | hoodies | hoodie | 5 | ₹820 |
| `minimalist-crewneck-sweatshirt` | hoodies | hoodie | 5 | ₹590 |
| `varsity-raglan-hoodie` | hoodies | hoodie | 5 | ₹750 |
| `structured-cotton-twill-cap` | caps | cap | 10 | ₹225 |
| `trucker-mesh-snapback-cap` (alias `mesh-trucker-snapback`) | caps | cap | 10 | ₹195 |
| `unstructured-dad-hat` | caps | cap | 10 | ₹210 |
| `performance-running-visor` | caps | cap | 10 | ₹180 |
| `executive-brass-twist-pen` (alias `matte-metal-rollerball-pen`) | corporate-gifts | pen | 20 | ₹145 |
| `hardbound-leather-journal-a5` (alias `executive-hardbound-journal`) | corporate-gifts | notebook | 15 | ₹260 |
| `matte-insulated-steel-flask` | corporate-gifts | bottle | 10 | ₹420 |
| `steel-engraved-keychain` (alias `leather-loop-keychain`) | corporate-gifts | badge | 25 | ₹95 |

---

## 5. Link Generation Audit & 404 Discrepancy Findings

### Discrepancy Analysis:
* **The Root Cause**: All UI navigation links in [`ProductCard.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/product/ProductCard.tsx), [`PosterCard.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday customization/purple-friday/src/components/product/PosterCard.tsx), [`MegaMenu.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/layout/MegaMenu.tsx), [`CategoryBentoGrid.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/home/CategoryBentoGrid.tsx), [`HeroSection.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/home/HeroSection.tsx), [`Footer.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/layout/Footer.tsx), and [`SearchDrawer.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/drawers/SearchDrawer.tsx) explicitly used:
  * `/product/[slug]` (singular)
  * `/category/[slug]` (singular)
* However, the Next.js routes created initially in `src/app` were named:
  * `/products/[slug]` (plural)
  * `/collections/[slug]` (plural)
* Furthermore, several product slugs had slight naming mismatches between `MegaMenu.tsx` and `src/lib/catalogue.ts` (e.g., `trucker-mesh-snapback-cap` vs `mesh-trucker-snapback`).
* **The Fix**:
  1. Build dedicated route handlers for `/product/[slug]` and `/category/[slug]`.
  2. Maintain backward-compatibility redirects for `/products/[slug]` and `/collections/[slug]`.
  3. Establish a single typed URL helper module (`src/lib/urls.ts`) with `productHref(slug)` and `categoryHref(slug)`.
  4. Normalize all slug aliases so any valid variant resolves to the authoritative product.

---

## 6. Cart & Checkout State Audit

* **State Store**: [`src/hooks/useCart.ts`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/hooks/useCart.ts) using Zustand with `persist({ name: "pf-cart-v1" })`.
* **Synchronized Features**:
  * Line items support `productId`, `optionKey`, `qty`, `name`, `slug`, `unitPrice`, `template`, `options`, `designId`, `designPreview`.
  * Real-time coupon code storage (default: `FIRSTORDER`).
  * Dedicated slide-over drawers: [`CartDrawer.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/drawers/CartDrawer.tsx) and [`WishlistDrawer.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/drawers/WishlistDrawer.tsx).
* **Checkout Integration**:
  * [`src/app/checkout/page.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/app/checkout/page.tsx) handles complete 3-step validation with 6-digit Indian PIN code validation, 10-digit mobile number check, and optional GSTIN.
  * Server-side order creation at `/api/orders` re-validates all pricing tiers and stock rules before persisting.
  * Razorpay integration verified at `/api/payments/verify`.

---

## 7. Motion & Animation Setup

* **Smooth Scroll**: [`LenisProvider.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/motion/LenisProvider.tsx) initializes Lenis with `smoothWheel: true`.
* **GSAP**: ScrollTrigger plugin registered; synchronized with Lenis RAF ticker to eliminate scroll jitter.
* **Accessibility**: `prefers-reduced-motion` guards prevent animations for users who require reduced motion.

---

## 8. Root Cause Analysis: Low Contrast & Invisible Text

Audit of sections identified in screen recording:
1. **"Built by makers, not drop-shippers" ([`FactoryTeamSection.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/home/FactoryTeamSection.tsx))**:
   * *Cause*: Used classes with non-existent prefix `pf-` (e.g. `bg-pf-ink`, `border-pf-ink`, `text-pf-lime`, `text-pf-lilac`). Tailwind 3.4 stripped these classes because `pf-` was not in `tailwind.config.ts`. As a result, the card had no background (white), while inner text was `text-white` — rendering white text on white.
2. **Closing Banner "Ready to put your logo..." ([`ClosingCtaBand.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/home/ClosingCtaBand.tsx))**:
   * *Cause*: Used `bg-pf-ink text-white`. Without the background class resolving, the section fell back to transparent/white with white headline and faint buttons.
3. **"How Purple Friday Works" ([`HowItWorksSequence.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/home/HowItWorksSequence.tsx))**:
   * *Cause*: Fixed `h-[500px] overflow-hidden` wrapper trapped cards on viewports where GSAP ScrollTrigger pinning was inactive, and `text-ink/50` failed WCAG AA contrast.
4. **Timeline "From your proof to your door" ([`OrderProcessTimeline.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/home/OrderProcessTimeline.tsx))**:
   * *Cause*: Unselected stage nodes used `text-pf-ink/50` without background styles, rendering faded, unreadable icons.
5. **Floating "Print Assistant" Pill ([`PurpleAssistant.tsx`](file:///c:/Users/seoha/Desktop/Purple%20firday%20customization/purple-friday/src/components/chat/PurpleAssistant.tsx))**:
   * *Cause*: The text label had `hidden sm:inline`. On viewports under 640px (or scaled windows), the label collapsed completely, showing only an icon.

---

## 9. Baseline Quality Gate Result

Conducted on 2026-11-07 before any code modification:
* **TypeScript Check (`tsc --noEmit`)**: 0 errors ✅
* **ESLint (`next lint`)**: 0 errors, 0 warnings ✅
* **Unit Tests (`vitest run`)**: **94/94 tests passing** across 13 test suites ✅
* **Production Build (`next build`)**: **60/60 static & dynamic routes compiled** with exit code 0 ✅

