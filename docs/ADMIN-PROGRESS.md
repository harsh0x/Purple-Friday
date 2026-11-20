# Admin Dashboard Implementation Progress

> Project: Purple Friday Admin Dashboard  
> Parts: 6 Parts Planned  
> Current Active Part: **PART 6** (Status: **COMPLETE**)  

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

---

## Part 4 Progress (Payments, Risk & Shipping for India) - COMPLETED

- [x] **Step 1: Partial Cash on Delivery (COD)**
  - AppSettings configured in `src/lib/admin/app-settings.ts`: COD enabled, advance percentage (default 25%, constrained to 20-30%), maximum COD order value (Rs 15,000 / 1,500,000 paise).
  - Pure payment service in `src/server/payments/cod-service.ts`:
    - `validateCodEligibility()`: server-side evaluation of COD rules, maximum order value, and RTO risk.
    - `processCodAdvancePayment()`: idempotent handling of Razorpay advance webhook event, transitioning payment status to `ADVANCE_PAID`.
    - `markCodBalanceCollected()`: audited staff action to record courier cash settlement with date and actor tracking.
  - State machine production gate in `src/server/orders/state-machine.ts`: prevents moving to `IN_PRINTING` if payment is COD and advance has not been paid (`ADVANCE_PAID` or `PAID`).
  - Production jobsheet generator `src/server/production/jobsheet-generator.ts`: draws prominent `"PAYMENT COD: COLLECT Rs X on delivery"` banner on thermal jobsheet.
  - Checkout & payment verification routes updated in `src/app/api/orders/route.ts` and `src/app/api/payments/verify/route.ts`.
  - API endpoint `/api/admin/orders/[orderNumber]/collect-balance/route.ts`.
  - Vitest test suite: `src/__tests__/partial-cod.test.ts` (10 tests passing 100%).

- [x] **Step 2: RTO Risk Score (Pure Tested Module)**
  - Pure scoring engine in `src/server/risk/rto.ts`:
    - Six calibrated rules: historic PIN code RTO rate > threshold (+30), previous phone RTO (+35), multiple names used on same phone/address (+20), suspicious/incomplete address missing house/street/digits or keyboard mash (+25), state mismatch on COD (+15), high COD first-timer (+20).
    - Threshold evaluation (50): scores >= 50 automatically disable COD and return "Prepaid only for this address" with a polite customer message.
    - Staff manual override with mandatory written justification and full audit trail (`overrideOrderRtoRisk()`).
  - Persistent & in-memory `PinStats` table tracking total orders, delivered count, RTO count, and live RTO percentage.
  - UI badge component `src/components/admin/RtoRiskBadge.tsx`: color-coded risk points (Low green, Moderate amber, High rose) with hover explanation of triggered risk rules and override badges.
  - Integrated into orders table (`/admin/orders`) and order details (`/admin/orders/[orderNumber]`).
  - Vitest test suite: `src/__tests__/rto-risk.test.ts` (20 tests passing 100%).

- [x] **Step 3: Shipping Adapters & Label Generation**
  - Shipping provider architecture in `src/server/shipping/shipping-provider.ts` and `src/server/shipping/providers.ts`:
    - `ShippingProvider` standard interface: `createShipment`, `cancelShipment`, `track`, `getLabel`.
    - `ManualProvider`: staff specifies courier name and AWB; always available.
    - `ShiprocketProvider`: verified against official v2 endpoints (`/auth/login`, `/orders/create/adhoc`, `/courier/assign/awb`, `/generate/label`, `/courier/track/awb`, `/orders/cancel`). Safely degrades to ManualProvider when credentials are not configured.
  - 4x6" Thermal Shipping Label Generator `src/server/shipping/label-generator.ts` with `pdf-lib`:
    - Standard 288x432 pt thermal label format.
    - Includes barcode representation, sender & recipient details, destination PIN, and prominent COD collection box.
  - Webhook route `/api/webhooks/shipping/route.ts`: verifies webhook secret, updates shipment tracking timeline, and triggers `syncParentOrderStatus()` (`DELIVERED` or `RTO`), automatically updating `PinStats`.
  - Label download endpoint `/api/admin/shipments/[shipmentNumber]/label/route.ts`.

- [x] **Step 4: Split & Multi-Address CSV Dispatch Engine**
  - Bulk multi-address dispatch in `src/server/shipping/shipping-service.ts`:
    - `validateSplitDispatchCsv()`: enforces 500 row maximum limit, validates Indian 10-digit mobile (`^[6-9][0-9]{9}$`) and 6-digit PIN (`^[1-9][0-9]{5}$`), validates address length and positive integer quantities.
    - Quantity matching: verifies sum of row quantities matches exact order item count.
    - `generateErrorCsv()`: generates downloadable error CSV appending specific validation error reasons per row.
    - `executeSplitDispatch()`: manifests shipments row-by-row with progress reporting. Idempotent and retry-safe: deterministic shipment numbers (`${orderNumber}-SH${idx}`) ensure failed runs can be retried without duplicating already manifested shipments.
  - Synchronizes parent order status to `DISPATCHED` once all destination shipments are manifested.
  - API endpoints `/api/admin/dispatch/template`, `/api/admin/orders/[orderNumber]/split-preview`, `/api/admin/orders/[orderNumber]/split-dispatch`, and `/api/admin/orders/[orderNumber]/shipments`.

- [x] **Step 5: Dispatch Queue, Shipments Tracking, Cancellation Gate & Refunds**
  - Admin UI `/admin/dispatch`:
    - Filtered queue of orders in `QC_PASSED` status awaiting fulfillment.
    - Single shipment creation modal with courier selection and AWB input.
    - Multi-address CSV split dispatch modal with live error preview, quantity sum validation, and error CSV download.
  - Admin UI `/admin/shipments`:
    - Live shipment tracking ledger with carrier badges, tracking history modal, and 4x6" PDF thermal label triggers.
  - Admin UI `/admin/payments`:
    - Financial ledger with KPI cards (Gross Captured, COD Advance Paid, Pending COD Balance, Total Refunded).
    - Modal for staff to mark COD balance as collected upon courier settlement.
    - Refund modal with reason and amount validation.
  - Storefront customer self-serve cancellation endpoint `/api/orders/[orderNumber]/cancel/route.ts`:
    - Enforces 2-hour cancellation window (AppSettings) and blocks cancellation once order reaches `IN_PRINTING`.
  - Pure refund engine `src/server/refunds/refund-service.ts`:
    - Role limit enforcement: Support Agents restricted to limit (default Rs 5,000 / 500,000 paise); Super Admin authorization required for larger amounts.
    - Idempotency key tracking: prevents duplicate gateway charges or duplicate refund records.
    - Partial refund support with remaining balance tracking.
    - Automatic inventory blank release on cancelled order refund.
  - API endpoints `/api/admin/orders/[orderNumber]/refund` and `/api/admin/orders/[orderNumber]/override-risk`.
  - Vitest test suites: `src/__tests__/shipping-and-split.test.ts` (9 tests) and `src/__tests__/refunds.test.ts` (5 tests).
  - Playwright E2E test suite: `e2e/admin-payments-shipping.spec.ts` (6 tests).

- [x] **Step 6: Verification, Responsive Audit & Completion**
  - Navigation Registry `src/lib/admin/navigation.ts`: revealed `Dispatch` (`/admin/dispatch`), `Shipments` (`/admin/shipments`), and `Payments` (`/admin/payments`) under Operations, while keeping future parts hidden.
  - Updated responsive navigation test `src/__tests__/admin-responsive.test.ts` covering Parts 1, 2, 3, and 4 routes across 375px, 768px, and 1440px viewports.
  - Verification results:
    - Zero TypeScript errors (`tsc --noEmit`).
    - Zero ESLint warnings or errors (`next lint`).
    - 35 Vitest test suites, 306 tests passing 100%.
    - Production build: 92 routes compiled cleanly with 0 errors.
    - Storefront bundle invariance: `/` route remains exactly 28 kB (216 kB first load JS) and shared JS remains 106 kB.

---

## Part 4 Files Created & Modified

### Shipping, Risk, Payments & Refunds Core:
- `purple-friday/prisma/schema.prisma`
- `purple-friday/src/lib/admin/app-settings.ts`
- `purple-friday/src/server/payments/cod-service.ts`
- `purple-friday/src/server/risk/rto.ts`
- `purple-friday/src/server/shipping/shipping-provider.ts`
- `purple-friday/src/server/shipping/providers.ts`
- `purple-friday/src/server/shipping/shipping-service.ts`
- `purple-friday/src/server/shipping/label-generator.ts`
- `purple-friday/src/server/refunds/refund-service.ts`
- `purple-friday/src/server/orders/state-machine.ts`
- `purple-friday/src/server/orders/orders-service.ts`
- `purple-friday/src/server/production/jobsheet-generator.ts`
- `purple-friday/src/lib/orders.ts`
- `purple-friday/src/lib/admin/navigation.ts`

### UI Pages & Components:
- `purple-friday/src/app/admin/dispatch/page.tsx`
- `purple-friday/src/app/admin/shipments/page.tsx`
- `purple-friday/src/app/admin/payments/page.tsx`
- `purple-friday/src/app/admin/orders/page.tsx`
- `purple-friday/src/app/admin/orders/[orderNumber]/page.tsx`
- `purple-friday/src/components/admin/RtoRiskBadge.tsx`

### Admin & Public API Endpoints:
- `purple-friday/src/app/api/admin/dispatch/template/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/collect-balance/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/override-risk/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/refund/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/shipments/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/split-preview/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/split-dispatch/route.ts`
- `purple-friday/src/app/api/admin/payments/route.ts`
- `purple-friday/src/app/api/admin/shipments/route.ts`
- `purple-friday/src/app/api/admin/shipments/[shipmentNumber]/label/route.ts`
- `purple-friday/src/app/api/orders/[orderNumber]/cancel/route.ts`
- `purple-friday/src/app/api/payments/verify/route.ts`
- `purple-friday/src/app/api/webhooks/shipping/route.ts`

### Verification & Test Suites:
- `purple-friday/src/__tests__/partial-cod.test.ts` (10 tests)
- `purple-friday/src/__tests__/rto-risk.test.ts` (20 tests)
- `purple-friday/src/__tests__/shipping-and-split.test.ts` (9 tests)
- `purple-friday/src/__tests__/refunds.test.ts` (5 tests)
- `purple-friday/src/__tests__/admin-responsive.test.ts` (4 tests)
- `purple-friday/e2e/admin-payments-shipping.spec.ts` (6 tests)


---

## Part 5 Tracker: Analytics and Intelligence (COMPLETE)

### Steps Overview
- [x] **Step 1: Seed Demo Realistic Order Data (Development Only)**
  - Script `scripts/seed-analytics-demo.ts` and server module `src/server/analytics/demo-seed.ts`.
  - Generates 425 realistic orders spanning 12 months with seasonal spikes (Diwali in Oct/Nov, New Year in Dec/Jan, April onboarding rush).
  - Simulates corporate gifting accounts (Infosys, Wipro, Swiggy, Cred, Zerodha, Razorpay), sample orders (1-2 pcs) converting to bulk orders (25-500 pcs), and realistic RTOs across Indian PIN codes.
  - Environment safety gate: strictly throws and refuses execution in production (`process.env.NODE_ENV === "production"`).
  - API endpoint: `/api/admin/analytics/seed-demo` (restricted to Super Admin).

- [x] **Step 2: Command-Centre Overview (Design Spec Layout)**
  - Replaced empty Overview with full Command-Centre in `src/app/admin/page.tsx`, `src/components/admin/OverviewCommandCentre.tsx`, and `src/server/analytics/overview-service.ts`.
  - Time-aware Indian greeting ("Good morning / afternoon / evening") with real-time count of items needing attention.
  - Live operational funnel strip with real order counts: Pending design approvals, In production, In production overdue (>48h SLA breach), Ready to dispatch, In transit, and RTO this month. Each count links to filtered order lists.
  - Interactive revenue and margin chart card with 7-day, 30-day, and 90-day segmented range control.
  - Category breakdown donut card with interactive legends.
  - Count-up KPI tiles: Orders, Net Revenue, Average Order Value (AOV), Repeat Corporate Customers %, Sample-to-Bulk Conversion %, and On-Time Dispatch SLA %.
  - Super Admin financial visibility vs Operational masking for other roles enforced on the server.
  - "Needs your attention" urgency cards and recent activity audit feed.

- [x] **Step 3: True Net Margin Tracker**
  - Pure calculation engine `src/server/analytics/margin-engine.ts` with integer paise precision and explicit rounding.
  - Unit economics waterfall breakdown:
    $$\text{True Net Margin} = \text{Revenue (excl. GST)} - \text{COGS} - \text{Gateway Fees} - \text{Shipping} - \text{RTO Losses} - \text{Ad Spend}$$
  - RTO custom merchandise scrapped loss rule: custom branded merchandise cannot be restocked as blank inventory; loss equals outbound shipping + return shipping + full COGS.
  - Monthly ad spend ledger with audit logging.
  - Admin UI `/admin/margin`: Waterfall visualization, Order-by-order unit economics table, Product catalog margin contribution, and 12-month trajectory.
  - Low margin (<15%) and negative margin alert badges.
  - Safe DDE formula-injection sanitized CSV export.

- [x] **Step 4: Corporate vs Retail Analytics & Cohorts**
  - Pure analytics module `src/server/analytics/cohorts.ts` and Admin UI `/admin/analytics`.
  - Sample-to-Bulk conversion rate tracker: monitors customers whose first order was $\le 2$ pieces and subsequent order $\ge 20$ pieces within a configurable window (default 60 days).
  - 12-Month Cohort Retention Matrix: tracks repeat order activity by customer acquisition month with visual heatmap shading.
  - Geographic Pan-India reach analysis: Tier 1 metro (BLR, BOM, DEL, HYD, MAA, PNQ) vs Tier 2/3 revenue distribution and top PIN codes with RTO rates.
  - Top corporate accounts ledger sorted by lifetime volume.

- [x] **Step 5: RFM Customer Segments & Reorder Nudges**
  - Pure RFM engine `src/server/analytics/rfm.ts` and Admin UI `/admin/customers`.
  - Quintile distribution scoring (1 to 5) for Recency, Frequency, and Monetary spend.
  - Customer segmentation: VIP Corporate, High-Value Repeat, At-Risk Corporate, Promising Regular, One-Time Sample, New Customer, and Lapsed.
  - Customer profile drawer with order history, lifetime units, and reorder gap tracking.
  - Reorder Due alert badge: flags when days since last order exceeds the customer's typical reorder cycle.
  - 1-Click personalized Email and WhatsApp reorder nudge message generation with strict safety guard against automatic unsolicited sending.

- [x] **Step 6: Merchandising Intelligence (FBT & Smart Ranking)**
  - Association rule mining engine `src/server/recommendations/fbt.ts`:
    - Computes support, confidence, and lift for product pairs in order baskets.
    - Data-thin safeguard: suppresses recommendations if catalog orders $<3$ or pair support $<2$.
    - Public storefront recommendation endpoint: `/api/recommendations/fbt`.
  - Smart catalog ranking engine `src/server/recommendations/smart-ranking.ts`:
    - Computes composite merchandise score: 30% sales conversion velocity + 30% gross margin contribution + 20% inventory availability + 20% verified review rating.
    - Hard penalty constraints: out-of-stock items capped at 10 points; negative-margin products heavily penalized (never boosted).
    - Public storefront ranking endpoint: `/api/recommendations/smart-ranking`.

- [x] **Step 7: Raw Material Forecasting & Reorder Point**
  - Pure forecasting engine `src/server/inventory/forecasting.ts` and Admin UI `/admin/forecasting`.
  - 4-week and 8-week blended moving velocity calculations.
  - Monthly seasonal multipliers: baseline (1.0x), Diwali peak (2.2x), New Year swag (1.8x), April fresher onboarding rush (2.0x).
  - Safety stock and lead time demand forecasting:
    $$\text{Reorder Point} = \max(\text{reorderLevel}, \text{Lead Time Demand} + \text{Safety Stock})$$
  - Stock runout day estimates and low stock reorder alerts dispatched via cron tick.
  - Formula-injection sanitized Supplier Purchase Order CSV export.

- [x] **Step 8: Customer Reviews & Support Loop**
  - Customer review and support pipeline in `src/server/reviews/review-service.ts`.
  - Post-delivery review invitation scheduled in cron tick (`/api/cron/tick`) 3 days post-delivery with secure HMAC verification token.
  - Customer review screen `/review/[token]`: star ratings plus custom-print feedback chips (Print Clarity, Fabric Feel, Colour Match) and image upload.
  - Smart triage: 4-5★ reviews auto-approved; 1-3★ reviews quarantined for moderation and automatically spawn a private `SupportTicket`.
  - Admin moderation UI `/admin/reviews` and ticket resolution workspace `/admin/support`.

- [x] **Step 9: Navigation Registry & Verification**
  - Updated `src/lib/admin/navigation.ts` revealing `Overview`, `Margin Tracker` (`/admin/margin`), `Analytics` (`/admin/analytics`), `Customers` (`/admin/customers`), `Forecasting` (`/admin/forecasting`), `Reviews` (`/admin/reviews`), and `Support` (`/admin/support`).
  - Unit tests: 41 test files, 326 unit tests passed 100%.
  - Typecheck: 0 errors (`tsc --noEmit`).
  - Lint: 0 warnings, 0 errors (`next lint`).
  - Production build: 106 static and dynamic routes compiled cleanly.
  - Storefront bundle invariance: `/` route remains exactly 28.1 kB (216 kB first load JS) and shared JS remains 106 kB.

---

## Part 5 Files Created & Modified

### Analytics, Margin & Intelligence Engines:
- `purple-friday/src/server/analytics/demo-seed.ts`
- `purple-friday/scripts/seed-analytics-demo.ts`
- `purple-friday/src/server/analytics/margin-engine.ts`
- `purple-friday/src/server/analytics/cohorts.ts`
- `purple-friday/src/server/analytics/rfm.ts`
- `purple-friday/src/server/recommendations/fbt.ts`
- `purple-friday/src/server/recommendations/smart-ranking.ts`
- `purple-friday/src/server/inventory/forecasting.ts`
- `purple-friday/src/server/reviews/review-service.ts`
- `purple-friday/src/server/analytics/overview-service.ts`

### UI Pages & Components:
- `purple-friday/src/app/admin/page.tsx`
- `purple-friday/src/components/admin/OverviewCommandCentre.tsx`
- `purple-friday/src/app/admin/margin/page.tsx`
- `purple-friday/src/app/admin/analytics/page.tsx`
- `purple-friday/src/app/admin/customers/page.tsx`
- `purple-friday/src/app/admin/forecasting/page.tsx`
- `purple-friday/src/app/admin/reviews/page.tsx`
- `purple-friday/src/app/admin/support/page.tsx`
- `purple-friday/src/app/review/[token]/page.tsx`

### Admin & Public API Endpoints:
- `purple-friday/src/app/api/admin/overview/route.ts`
- `purple-friday/src/app/api/admin/margin/route.ts`
- `purple-friday/src/app/api/admin/analytics/route.ts`
- `purple-friday/src/app/api/admin/analytics/seed-demo/route.ts`
- `purple-friday/src/app/api/admin/customers/route.ts`
- `purple-friday/src/app/api/admin/customers/[id]/route.ts`
- `purple-friday/src/app/api/admin/forecasting/route.ts`
- `purple-friday/src/app/api/admin/reviews/route.ts`
- `purple-friday/src/app/api/admin/support/route.ts`
- `purple-friday/src/app/api/admin/support/[ticketNumber]/route.ts`
- `purple-friday/src/app/api/recommendations/fbt/route.ts`
- `purple-friday/src/app/api/recommendations/smart-ranking/route.ts`
- `purple-friday/src/app/api/reviews/route.ts`
- `purple-friday/src/app/api/cron/tick/route.ts`

### Schema, Settings & Navigation:
- `purple-friday/prisma/schema.prisma`
- `purple-friday/src/lib/admin/app-settings.ts`
- `purple-friday/src/lib/admin/navigation.ts`
- `purple-friday/src/lib/utils.ts`

### Verification & Test Suites:
- `purple-friday/src/__tests__/net-margin.test.ts` (4 tests)
- `purple-friday/src/__tests__/cohorts-analytics.test.ts` (4 tests)
- `purple-friday/src/__tests__/rfm-segments.test.ts` (4 tests)
- `purple-friday/src/__tests__/recommendations-ranking.test.ts` (3 tests)
- `purple-friday/src/__tests__/forecasting.test.ts` (2 tests)
- `purple-friday/src/__tests__/reviews-support.test.ts` (3 tests)
- `purple-friday/src/__tests__/admin-responsive.test.ts` (4 tests)
- `purple-friday/e2e/admin-analytics-intelligence.spec.ts` (8 tests)


---

## Part 6 Tracker: Storefront CMS, Hardening and Launch (COMPLETE)

### Steps Overview
- [x] **Step 1: No-Code Storefront CMS (Super Admin Only)**
  - Schema & Data Model `src/server/cms/schema.ts`:
    - Strict length limits and validation on Hero (headline, subtext, badge, CTAs), Announcements (text, code, dates, active), Section order and visibility, FAQs, Footer links, Coupon Banners, and SEO tags.
    - Plain-text sanitization `sanitizePlainText()` preventing raw HTML/XSS injection.
    - Sensible defaults `DEFAULT_CMS_DOCUMENT` guaranteeing storefront resilience even if CMS storage is empty.
  - Server Service `src/server/cms/cms-service.ts`:
    - `getPublishedCms()`: cached storefront retrieval with Next.js cache tag revalidation (`revalidateTag("cms-content")`).
    - `getDraftCms()` & `saveDraftCms()`: draft workspace allowing changes to be staged without touching live customers.
    - `createCmsPreviewToken()` & `verifyCmsPreviewToken()`: HMAC-SHA256 signed preview token for viewing live draft state via `/?previewToken=...`.
    - `publishCms()`: publishes draft to live storefront, creates an immutable version snapshot, trims history to keep the last 10 versions, writes audit log, and invalidates cache.
    - `restoreCmsVersion()`: 1-click rollback restoring any of the last 10 snapshots to live storefront.
  - Admin Studio UI `/admin/cms`:
    - Full tabbed management interface for Hero, Announcements, Page Sections Order, FAQs, Footer, Coupons, SEO, and Version History.
    - Protected exclusively for Super Admin role (`SUPER_ADMIN`).
  - Public & Admin API endpoints:
    - `/api/admin/cms`: GET (draft, published, history, preview token) & POST (save draft, publish, restore).
    - `/api/cms/published`: public cached endpoint with 60s ISR header.
    - `/api/cms/preview`: preview redirect endpoint with HMAC token verification.
  - Storefront Integration:
    - `src/components/home/HeroSection.tsx`: accepts dynamic CMS hero props with graceful fallbacks.
    - `src/components/layout/AnnouncementBar.tsx`: accepts dynamic announcements with active scheduling.
    - `src/components/home/FaqSection.tsx`: renders dynamic FAQs across 2 responsive columns.
    - `src/app/page.tsx`: server component reads published CMS with preview token support, dynamically filters section visibility and ordering, and generates dynamic metadata.
  - Vitest Unit Test Suite:
    - `src/__tests__/storefront-cms.test.ts` (7 tests passing 100%).

- [x] **Step 2: Final Security Pass & `docs/ADMIN-SECURITY.md`**
  - Compiled comprehensive security evidence document `docs/ADMIN-SECURITY.md` addressing all 12 points:
    1. Permission matrix test (`src/__tests__/permission-matrix.test.ts` - 6 tests passing).
    2. Mutating route audit (Rate limiting, Origin checks, Zod validation across all routes).
    3. Audit log PostgreSQL trigger `reject_audit_log_mutation()` blocking UPDATE and DELETE.
    4. File upload security (magic byte detection, SVG script stripping, 25MB limits, private downloads).
    5. Token cryptography (24-byte random, SHA-256 hashed, expiring, rate-limited tokens).
    6. Webhook security (timing-safe `crypto.timingSafeEqual`, raw body hashing, idempotent replay protection).
    7. Secrets zero-leakage (startup validation in `src/lib/env.ts`, `.env*` gitignored, client bundle scanned).
    8. Production HTTP security headers (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors none, no X-Powered-By, no-store admin caching). Script `scripts/check-headers.sh`.
    9. Sessions security (8h max age, 15m idle timeout, logout invalidation, 5-attempt account lockout).
    10. Dependency audit & Dependabot config (`.github/dependabot.yml`).
    11. CSV formula-injection mitigation (`safeCsvCell()` prepending `'` on `=, +, -, @`).
    12. Database backup PITR runbook and disaster recovery checklist for Neon PostgreSQL.

- [x] **Step 3: Performance and Accessibility**
  - Admin bundles strictly code-split per route; zero storefront bundle impact.
  - Charts (SVG based) and Mockup canvas tool load strictly on demand.
  - Server-driven table pagination and skeleton states eliminate cumulative layout shift (CLS = 0).
  - Accessibility & Contrast: WCAG AA contrast compliance verified in `src/__tests__/a11y.test.ts` across Ink (`#15101F`), Paper (`#F5F0E8`), Violet (`#6A2CFF`), and Spot-Lime (`#D8FF3F`).

- [x] **Step 4: End-to-End Tests (Desktop & Tablet)**
  - Comprehensive Playwright test suite `e2e/admin-launch-lifecycle.spec.ts` covering Desktop (1440x900) and Tablet (768x1024):
    - Full lifecycle pipeline: order -> proof -> production -> split dispatch -> delivery -> review.
    - High-risk COD address protection: automatic prepaid gate enforcement.
    - CMS publish reflection on live customer storefront.
    - Role restrictions and unauthenticated redirect verification.

- [x] **Step 5: Documentation & Client Launch Checklist**
  - Updated `README.md` with full Admin Architecture guide, RBAC roles matrix, first login procedure, environment variables reference table, cron tick scheduler setup, and webhook guides.
  - Updated `.env.example` with documented keys, comments, and instructions.
  - Created `docs/ADMIN-LAUNCH-CHECKLIST.md` for client: 7 pre-launch technical steps and 4 one-page plain-language staff handbooks (Super Admin, Graphic Designer, Factory Manager, Support Agent).

- [x] **Step 6: Final Verification Gate**
  - Zero TypeScript errors (`tsc --noEmit`).
  - Zero ESLint warnings or errors (`next lint`).
  - 100% Vitest tests passing (43 test suites, 339 tests passed).
  - Production build passing cleanly (109 static and dynamic routes compiled).
  - Storefront bundle size invariance: `/` route remains exactly 28.1 kB / 216 kB first load JS.

---

## Part 6 Files Created & Modified

### Storefront CMS Core:
- `purple-friday/src/server/cms/schema.ts`
- `purple-friday/src/server/cms/cms-service.ts`
- `purple-friday/src/app/admin/cms/page.tsx`
- `purple-friday/src/app/api/admin/cms/route.ts`
- `purple-friday/src/app/api/cms/published/route.ts`
- `purple-friday/src/app/api/cms/preview/route.ts`
- `purple-friday/src/components/home/HeroSection.tsx`
- `purple-friday/src/components/layout/AnnouncementBar.tsx`
- `purple-friday/src/components/home/FaqSection.tsx`
- `purple-friday/src/app/page.tsx`

### Security, Environment & Config:
- `purple-friday/next.config.ts`
- `purple-friday/scripts/check-headers.sh`
- `purple-friday/src/lib/env.ts`
- `purple-friday/.env.example`
- `purple-friday/.github/dependabot.yml`
- `purple-friday/docs/ADMIN-SECURITY.md`
- `purple-friday/docs/ADMIN-LAUNCH-CHECKLIST.md`
- `purple-friday/README.md`
- `purple-friday/src/lib/admin/navigation.ts`
- `purple-friday/src/app/admin/quotes/page.tsx`

### Verification & Test Suites:
- `purple-friday/src/__tests__/storefront-cms.test.ts` (7 tests)
- `purple-friday/src/__tests__/permission-matrix.test.ts` (6 tests)
- `purple-friday/src/__tests__/a11y.test.ts` (updated)
- `purple-friday/e2e/admin-launch-lifecycle.spec.ts` (8 scenarios across desktop & tablet)
