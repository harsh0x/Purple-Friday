# Admin Dashboard Implementation Progress

> Project: Purple Friday Admin Dashboard  
> Parts: 6 Parts Planned  
> Current Active Part: **PART 3** (Status: **COMPLETE**)  

---

## Part 1 Tracker: Foundation, Auth, RBAC & Core Shell (COMPLETE)
- [x] Step 0: Read whole project, baseline audit, write `docs/ADMIN-ARCHITECTURE.md`
- [x] Step 1: Write `docs/ADMIN-RULES.md`
- [x] Step 2: Data Foundation (RBAC User roles, AuditLog append-only trigger, Notification, AppSetting)
- [x] Step 3: Admin Auth & RBAC (Isolated `/admin/login`, session idle timeout, permission guards)
- [x] Step 4: The Admin Shell (Sidebar, Topbar, Overview, Team & Roles, Audit Log, Settings, Notifications)
- [x] Step 5: Verification & Wrap-up (Typecheck, Lint, Tests, 0 storefront bundle impact, WCAG AA)

---

## Part 2 Tracker: Orders & Design-to-Print Pipeline (COMPLETE)

### Steps Overview
- [x] **Step 1: Pure Order State Machine & Cancellation Gate**
  - Canonical statuses: `ORDER_PLACED`, `ARTWORK_UPLOADED`, `MOCKUP_SENT`, `REVISION_REQUESTED`, `CUSTOMER_APPROVED`, `IN_PRINTING`, `QC_PASSED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`, `REFUNDED`, `RTO`.
  - Backwards-compatible `LEGACY_STATUS_MAP` and schema migration keeping legacy orders readable.
  - Strict transition matrix `TRANSITION_TABLE` in `src/server/orders/state-machine.ts`.
  - Pure function `canTransition(from, to, role, context)` enforcing table rules and RBAC matrix.
  - Sole mutation function `changeOrderStatus(orderId, to, actor, reason, expectedVersion)`.
  - Cancellation Gate: customer may only cancel within 2 hours of order creation (`cancellation_window_hours` setting) AND only before `IN_PRINTING`. Staff cancellation requires written justification reason.
  - QC Rework function `recordQcRework()` logs failure event on `IN_PRINTING` without changing status.
  - Comprehensive Vitest test suite (`src/__tests__/order-state-machine.test.ts` - 18 tests passing 100%).
- [x] **Step 2: Order List and Order Detail Pages**
  - Order service `src/server/orders/orders-service.ts` with seeded realistic Indian apparel & corporate gifting orders.
  - Server-paginated, URL-state-synced table at `/admin/orders` with search (order #, customer name, email, phone) and filters (status, payment status, overdue, designer).
  - Bulk actions: DDE formula-injection sanitized CSV export (`safeCsvCell`), bulk designer assignment.
  - Visual status badge component `<OrderStatusBadge />` with icon and color-coded status.
  - SLA badge `<OrderSlaBadge />`: green (>24h), amber (8-24h), red (<8h), pulsing `OVERDUE` with red border, and `PAUSED` indicator while waiting on customer.
  - Strict role-based financial masking: `GRAPHIC_DESIGNER` and `FACTORY_MANAGER` NEVER see prices, totals, or payment summaries.
  - Order Detail page `/admin/orders/[orderNumber]`: customer & address, items with artwork and mockup side-by-side, size breakdown, timeline (`OrderEvent`), internal notes, and permitted next action buttons driven strictly by `canTransition`.
  - Comprehensive Vitest test suite (`src/__tests__/order-service.test.ts` - 10 tests passing 100%).
- [x] **Step 3: Artwork Ingestion & Pre-Flight Analysis**
  - Module `src/server/artwork/artwork-ingestion.ts` and API `/api/admin/artwork/ingest`.
  - Accepts PNG, JPG, WebP, SVG, PDF directly; stores AI and CDR as downloadable source files (direct preview disabled).
  - Magic byte detection with `file-type`, 25 MB hard limit, random UUID filenames in `storage/artwork/`.
  - Private storage served only via permission-checked route `/api/admin/artwork/[artworkId]/download`.
  - SVG sanitization via `sanitizeSvg()` and rasterized PNG preview via `sharp`.
  - Effective DPI computation: pixels divided by print width in inches (`optimal` >= 300 DPI, `warning` 150-299 DPI, `very_low` < 150 DPI). Flags with plain explanation without blocking order.
  - Dominant color extraction: 3 to 5 colors with HEX and approximate CMYK percentages.
  - Manual Pantone PMS input field on order item card.
  - Comprehensive Vitest test suite (`src/__tests__/artwork-ingestion.test.ts` - 8 tests passing 100%).
- [x] **Step 4: Mockup and Print-Zone Placement Atelier**
  - Integrated `src/lib/customizer/print-areas.ts` and `src/lib/mockup-canvas.ts`.
  - Interactive canvas tool `<MockupPlacementEditor />` on order items:
    - Displays product base photo and boundary print-zone mask.
    - Clamped positioning: X, Y, scale, and rotation are strictly clipped inside the print-zone mask.
    - Print method selection: DTF, Sublimation, Embroidery, Laser Engraving.
    - Pantone PMS code and designer notes.
    - "Save Mockup & Placement" renders composite canvas to PNG and saves via `/api/admin/orders/[orderNumber]/items/[itemId]/mockup`.
  - Comprehensive Vitest test suite (`src/__tests__/mockup-placement.test.ts` - 2 tests passing 100%).
- [x] **Step 5: Proof & Approval Workflow**
  - Module `src/server/orders/proof-service.ts` and API `/api/admin/orders/[orderNumber]/send-mockup`.
  - Generates secure 24-byte random approval token stored hashed with SHA-256 and 14-day expiration.
  - Public mobile-first approval page `/proof/[token]` with rate limiting: large mockup view, original logo, size breakdown, "Approve Design Proof" and "Request Changes" with feedback textarea.
  - WhatsApp notification generator (`wa.me` fallback link for one-click staff dispatch) + Resend email adapter.
  - 48-hour Dispatch SLA clock: starts on `CUSTOMER_APPROVED`, pauses in `MOCKUP_SENT` / `REVISION_REQUESTED`, stores accumulated `totalPausedDurationMs`.
  - Cron tick handler `/api/cron/tick`: guards with `CRON_SECRET`, checks 24h & 48h unapproved proof reminders, logs idempotent `Job` rows, flags SLA breaches.
  - Comprehensive Vitest test suite (`src/__tests__/proof-workflow.test.ts` - 5 tests passing 100%).
- [x] **Step 6: Production Job Sheet & Queues**
  - One-click Job Sheet PDF generator `src/server/production/jobsheet-generator.ts` and endpoint `/api/admin/orders/[orderNumber]/jobsheet` using `pdf-lib`:
    - Scannable QR code matrix linking directly to admin order URL.
    - Physical print dimensions in mm and Pantone codes.
    - Print method and apparel size breakdown table with physical checkboxes (`[ ]`).
    - Packaging instructions and special handling.
    - Sign-off blocks for Print Operator and QC Inspector.
  - Design Approvals Queue `/admin/designs`: oldest `ARTWORK_UPLOADED` and `REVISION_REQUESTED` first with inline proofing actions.
  - Production Queue `/admin/production`: orders grouped by print method (DTF, Sublimation, Embroidery, Laser Engraving) for batch print runs, bulk "Mark IN_PRINTING" and "Mark QC_PASSED" actions.
  - Navigation Registry `src/lib/admin/navigation.ts`: revealed `Orders`, `Design Approvals`, and `Production` with permission gating.
  - Comprehensive Vitest test suite (`src/__tests__/jobsheet-and-queues.test.ts` - 2 tests passing 100%).
- [x] **Step 7: Verification & Final Commit**
  - End-to-end integration test `src/__tests__/order-pipeline-lifecycle.test.ts` covering entire lifecycle: order placement -> designer mockup -> forbidden skip attempt -> customer approval -> printing -> QC pass -> dispatch -> delivered.
  - Playwright E2E suite `e2e/admin-order-pipeline.spec.ts` covering route protections and public proof token validation.
  - Zero-error Typecheck (`tsc --noEmit`).
  - Zero-error Lint (`next lint` - 0 errors, 0 warnings).
  - 100% Vitest pass: 24 test suites, 166 tests passed.
  - Production build: 80 static & dynamic routes compiled cleanly.
  - Storefront bundle verification: `/` remains exactly 28 kB (216 kB first load JS) and shared JS remains 106 kB (zero admin bundle leakage).
  - WCAG AA contrast check: 14 token pairs audited and passed.

---

## Part 3 Tracker: Catalogue, Pricing & Inventory Management (COMPLETE)

### Steps Overview
- [x] **Step 1: One Unified Pure Pricing Engine**
  - Pure module `src/server/pricing/engine.ts`, zero database side-effects.
  - Strict integer paise storage and calculation (1 Rupee = 100 Paise).
  - Single rounding rule: round half up `Math.floor(x + 0.5)` applied once per line.
  - GST-inclusive display with configurable GST rate per product (default 18%).
  - Computes: unit price from volume slabs, MOQ and quantity-step constraints, bundle totals, coupon caps, shipping fees, and GST breakdown (CGST/SGST vs IGST).
  - Refactored `src/lib/pricing.ts` to delegate directly to `engine.ts`, eliminating duplicate pricing math.
  - Vitest test suites: `src/__tests__/pricing-engine.test.ts` (18 tests) & `src/__tests__/pricing.test.ts` (9 tests) passing 100%.
- [x] **Step 2: Product Management & Volume Pricing Matrix**
  - Prisma schema updates: `gstRate`, `seoTitle`, `seoDescription`, `costPrice`, `version`, `archived` on `Product`, and model `ProductSlugRedirect`.
  - Service `src/server/products/product-service.ts`:
    - Optimistic concurrency locking via integer `version` field.
    - Slug renaming with automatic 301 `ProductSlugRedirect` generation.
    - Soft archival: prevents deletion if orders reference product.
    - Audited updates via `writeAudit()`.
  - Interactive component `<VolumePricingMatrixEditor />`:
    - Live client-side validation blocking overlapping slabs, gaps, and ascending prices.
    - Real-time COGS profit margin calculation per slab (`(unitPrice - costPrice) / unitPrice`).
  - Admin UI at `/admin/products` (table, search, category/audience filters) and `/admin/products/[slug]` (full edit/create suite).
  - API endpoints `/api/admin/products` and `/api/admin/products/[slug]`.
  - Vitest test suite: `src/__tests__/product-management.test.ts` (8 tests passing 100%).
- [x] **Step 3: Inventory of Blanks & Movements Ledger**
  - Prisma models `BlankSku` and `StockMovement`.
  - Service `src/server/inventory/inventory-service.ts`:
    - Tracks stock on hand, reserved stock, reorder levels, supplier details, unit cost, and lead times.
    - Immutable stock movement ledger (`PURCHASE`, `ORDER_RESERVATION`, `PRODUCTION_USE`, `ADJUSTMENT`, `RETURN`, `ORDER_RELEASE`).
  - Automated transactional reservations on order payment in `src/lib/orders.ts`.
  - Automated transactional consumption on `IN_PRINTING` in `src/server/orders/state-machine.ts`.
  - Automated transactional release on order cancellation.
  - Admin UI `/admin/inventory`: low-stock warning highlights, quick adjustment modal, and movement ledger drawer.
  - API endpoints `/api/admin/inventory` and `/api/admin/inventory/[skuId]/movements`.
  - Vitest test suite: `src/__tests__/inventory-blanks.test.ts` (5 tests passing 100%).
- [x] **Step 4: Bundles & Joining Kits (Parent & Child SKUs)**
  - Prisma models `Kit` and `KitComponent`.
  - Service `src/server/kits/kits-service.ts`:
    - Parent-child SKU relationships with component quantities.
    - Real-time kit fulfillable stock calculation: bottleneck determination across all components.
    - Automated shortage detection with configured substitute product resolution.
    - Transactional bundle reservation and consumption across all component SKUs.
  - Admin UI `/admin/kits`: kit composition cards, fulfillable stock meters, and shortage warning badges.
  - API endpoint `/api/admin/kits`.
  - Vitest test suite: `src/__tests__/bundles-kits.test.ts` (5 tests passing 100%).
- [x] **Step 5: Quotes (RFQ) & Invoices**
  - Prisma models `Quote` and `InvoiceSequence`.
  - Service `src/server/quotes/quotes-service.ts`:
    - Converts public RFQs into formal quotes with custom line items and validity dates.
    - Enforces mandatory written justification audit log for rates quoted below catalog slab prices.
    - Razorpay payment link adapter with safe missing-key degradation and timing-safe HMAC webhook signature verification (`crypto.timingSafeEqual`).
    - Idempotent webhook order creation on payment link capture.
  - PDF generation `src/server/invoices/invoice-generator.ts` with `pdf-lib`:
    - Gapless sequential tax invoice numbering (`INV-2026-XXXX`).
    - GST-compliant Tax Invoices and Quote PDFs with seller/buyer GSTIN, HSN codes, and state-aware CGST/SGST vs IGST breakdown.
  - Admin UI `/admin/quotes`: Quote builder modal, payment link generator, and PDF download triggers.
  - API endpoints `/api/admin/quotes`, `/api/admin/quotes/[id]/payment-link`, `/api/admin/quotes/[id]/pdf`, `/api/admin/orders/[orderNumber]/invoice`, and `/api/webhooks/razorpay`.
  - Vitest test suite: `src/__tests__/quotes-and-invoices.test.ts` (9 tests passing 100%).
- [x] **Step 6: Coupons Manager & Race-Safe Redemption**
  - Prisma schema updates to `Coupon`: `maxDiscountCap`, `totalUsageLimit`, `usageCount`, `applicableCategories`, `startsAt`, `version`.
  - Service `src/server/coupons/coupon-service.ts`:
    - `FIRSTORDER` rule: 12% welcome discount, maximum cap, minimum subtotal, single redemption per customer.
    - Flat and percentage discounts, global usage quotas, category targeting, and expiration gating.
    - Mutex-locked atomic redemption preventing race conditions under high concurrent checkout traffic.
  - Admin UI `/admin/coupons`: coupon list with usage meters, active/inactive toggles, and campaign creation modal.
  - API endpoints `/api/admin/coupons` and `/api/admin/coupons/[id]`.
  - Vitest test suite: `src/__tests__/coupons.test.ts` (7 tests passing 100%).
- [x] **Step 7: Storefront Price Invariance Verification, Responsive Audit & Completion**
  - Navigation Registry `src/lib/admin/navigation.ts`: safely revealed `Products`, `Inventory`, `Kits`, `Quotes`, and `Coupons` while strictly keeping unbuilt future parts (Reviews, Customers, Analytics) hidden.
  - Storefront Price Invariance suite `src/__tests__/storefront-price-invariance.test.ts`:
    - Verified 20 real catalog products across badges, tees, polos, hoodies, caps, and drinkware.
    - 100% identical match between catalog tiers, pure pricing engine in integer paise, and storefront cart calculations across single and multi-item carts.
    - Confirmed strict adherence to step and MOQ rules.
  - Responsive audit suite `src/__tests__/admin-responsive.test.ts`:
    - Verified navigation registry exposed routes and permissions for Parts 1, 2, and 3.
    - Validated key breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop), plus 320px, 1024px, and 1920px.
  - Verification results:
    - Zero TypeScript errors (`tsc --noEmit`).
    - Zero ESLint errors or warnings (`next lint`).
    - 31 Vitest test suites, 262 tests passing 100%.
    - Production build: 85 routes compiled cleanly with 0 errors.
    - Storefront bundle invariance: `/` route remains exactly 28 kB (216 kB first load JS) and shared JS remains 106 kB.

---

## Part 3 Files Created & Modified

### Pricing & Business Logic Core:
- `purple-friday/prisma/schema.prisma`
- `purple-friday/src/server/pricing/engine.ts`
- `purple-friday/src/server/products/product-service.ts`
- `purple-friday/src/server/inventory/inventory-service.ts`
- `purple-friday/src/server/kits/kits-service.ts`
- `purple-friday/src/server/quotes/quotes-service.ts`
- `purple-friday/src/server/invoices/invoice-generator.ts`
- `purple-friday/src/server/coupons/coupon-service.ts`
- `purple-friday/src/lib/pricing.ts`
- `purple-friday/src/lib/orders.ts`
- `purple-friday/src/server/orders/state-machine.ts`
- `purple-friday/src/lib/admin/navigation.ts`

### UI Pages & Components:
- `purple-friday/src/app/admin/products/page.tsx`
- `purple-friday/src/app/admin/products/[slug]/page.tsx`
- `purple-friday/src/app/admin/inventory/page.tsx`
- `purple-friday/src/app/admin/kits/page.tsx`
- `purple-friday/src/app/admin/quotes/page.tsx`
- `purple-friday/src/app/admin/coupons/page.tsx`
- `purple-friday/src/components/admin/VolumePricingMatrixEditor.tsx`

### Admin & Public API Endpoints:
- `purple-friday/src/app/api/admin/products/route.ts`
- `purple-friday/src/app/api/admin/products/[slug]/route.ts`
- `purple-friday/src/app/api/admin/inventory/route.ts`
- `purple-friday/src/app/api/admin/inventory/[skuId]/movements/route.ts`
- `purple-friday/src/app/api/admin/kits/route.ts`
- `purple-friday/src/app/api/admin/quotes/route.ts`
- `purple-friday/src/app/api/admin/quotes/[id]/payment-link/route.ts`
- `purple-friday/src/app/api/admin/quotes/[id]/pdf/route.ts`
- `purple-friday/src/app/api/admin/coupons/route.ts`
- `purple-friday/src/app/api/admin/coupons/[id]/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/invoice/route.ts`
- `purple-friday/src/app/api/webhooks/razorpay/route.ts`

### Verification & Test Suites:
- `purple-friday/src/__tests__/pricing-engine.test.ts` (18 tests)
- `purple-friday/src/__tests__/pricing.test.ts` (9 tests)
- `purple-friday/src/__tests__/product-management.test.ts` (8 tests)
- `purple-friday/src/__tests__/inventory-blanks.test.ts` (5 tests)
- `purple-friday/src/__tests__/bundles-kits.test.ts` (5 tests)
- `purple-friday/src/__tests__/quotes-and-invoices.test.ts` (9 tests)
- `purple-friday/src/__tests__/coupons.test.ts` (7 tests)
- `purple-friday/src/__tests__/storefront-price-invariance.test.ts` (43 tests)
- `purple-friday/src/__tests__/admin-responsive.test.ts` (4 tests)
