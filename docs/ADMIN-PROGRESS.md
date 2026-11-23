# Admin Dashboard Implementation Progress

> Project: Purple Friday Admin Dashboard
> Parts: 6 Parts Planned
> Current Active Part: **PART 2** (Status: **COMPLETE**)

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

## Part 2 Files Created & Modified

### State Machine & Order Core:
- `purple-friday/prisma/schema.prisma`
- `purple-friday/src/server/orders/state-machine.ts`
- `purple-friday/src/server/orders/orders-service.ts`
- `purple-friday/src/server/orders/proof-service.ts`
- `purple-friday/src/server/artwork/artwork-ingestion.ts`
- `purple-friday/src/server/production/jobsheet-generator.ts`
- `purple-friday/src/lib/admin/navigation.ts`
- `purple-friday/src/lib/customizer/print-areas.ts`
- `purple-friday/src/lib/security/csv.ts`

### Admin & Public API Endpoints:
- `purple-friday/src/app/api/admin/orders/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/transition/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/rework/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/notes/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/send-mockup/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/jobsheet/route.ts`
- `purple-friday/src/app/api/admin/orders/[orderNumber]/items/[itemId]/mockup/route.ts`
- `purple-friday/src/app/api/admin/artwork/ingest/route.ts`
- `purple-friday/src/app/api/admin/artwork/[artworkId]/download/route.ts`
- `purple-friday/src/app/api/proof/[token]/route.ts`
- `purple-friday/src/app/api/proof/[token]/approve/route.ts`
- `purple-friday/src/app/api/proof/[token]/reject/route.ts`
- `purple-friday/src/app/api/cron/tick/route.ts`

### UI Pages & Components:
- `purple-friday/src/app/admin/orders/page.tsx`
- `purple-friday/src/app/admin/orders/[orderNumber]/page.tsx`
- `purple-friday/src/app/admin/designs/page.tsx`
- `purple-friday/src/app/admin/production/page.tsx`
- `purple-friday/src/app/proof/[token]/page.tsx`
- `purple-friday/src/components/admin/OrderStatusBadge.tsx`
- `purple-friday/src/components/admin/OrderSlaBadge.tsx`
- `purple-friday/src/components/admin/ArtworkIngestionCard.tsx`
- `purple-friday/src/components/admin/MockupPlacementEditor.tsx`

### Verification & Test Suites:
- `purple-friday/src/__tests__/order-state-machine.test.ts` (18 tests)
- `purple-friday/src/__tests__/order-service.test.ts` (10 tests)
- `purple-friday/src/__tests__/artwork-ingestion.test.ts` (8 tests)
- `purple-friday/src/__tests__/mockup-placement.test.ts` (2 tests)
- `purple-friday/src/__tests__/proof-workflow.test.ts` (5 tests)
- `purple-friday/src/__tests__/jobsheet-and-queues.test.ts` (2 tests)
- `purple-friday/src/__tests__/order-pipeline-lifecycle.test.ts` (1 comprehensive lifecycle test)
- `purple-friday/e2e/admin-order-pipeline.spec.ts`

## Single Admin Refactor (COMPLETE)
- Streamlined to single client admin (no staff/factory features, no roles except CUSTOMER & ADMIN).
- Fixed money display bug (integer paise accurately formatted without 100x magnification).
- Audited typography: Bricolage Grotesque headings, Instrument Sans body, DM Mono numbers/chips.
- Built separate `/admin/login` screen with 15m lockout, no storefront chrome, 100dvh sidebar.
- Added scripts: `admin:reset-password`, `routes:txt` (ROUTES-AND-LOGINS.txt), and `font-audit`.

## Part 4: Customer Auth, OTP & Account Console (COMPLETE)
- Unified `notify()` with 13 transactional email/in-app templates, retry queue in cron, and `MessageLog`.
- 6-digit Email OTP engine with HMAC-SHA256 storage, 5m expiry, 5-strike lockout, and rate limiting.
- Customer auth lifecycle: inactive on registration until OTP verified, tokenVersion revocation on changes.
- Account console (`/account`): Overview metrics, order search/filters, addresses CRUD, notifications, security.
- Order detail (`/account/orders/[id]`): Timeline, tracking, 2h cancellation gate, address update, problem report.
- Verification: `tsc --noEmit` (0 errors), `font-audit` passed, 37 test files / 317 tests passing, `build` clean.

## Part 5: Real-Time Notifications, Push Alerts & Operations (COMPLETE)
- Admin TopBar Bell: 8s visibility-aware polling (`?after=lastId`), toasts, audio chimes, dynamic title badge.
- Notifications Page (`/admin/notifications`): category & read filters, links to orders, reviews, and customers.
- Operational Event Dispatcher: `notifyAdmin()` routes 10 events across In-App Bell, Email, and Web Push.
- Web Push & VAPID: `/admin-sw.js` and `/sw.js` service workers, subscription cleanup on 404/410, iPhone PWA note.
- Settings Event Matrix: Table toggling Email/Phone channels per event with audit; customer push opt-in in `/account`.
- Order Actions & Problem Reports: Dispatched, delivered, cancelled trigger customer emails; issue reply/resolve/refund.
- Customer Directory: Verified email badges and recent self-serve activity stream from `CustomerEvent`.
- Verification: `typecheck` (0 errors), `font-audit` passed, 38 Vitest suites / 326 tests passed, `build` clean.

## Part 6: Storefront CMS, Hardening & Launch (COMPLETE)
- Storefront CMS: Site settings, announcements scheduling, dynamic navigation/footer, home sections ordering/toggles.
- Pages & Blog: `/pages/[slug]` custom pages, core legal pages, and blog management with safe markdown & SEO SERP.
- Media Library: Grid with search, magic-byte upload validation, alt-text, in-use safe deletion, and reusable `ImagePicker`.
- Draft & Isolation: Preview tokens (`?previewToken=...`), atomic publishing with `revalidateTag("cms")`, 10-snapshot rollback.
- Hardening: Zero storefront chrome, single admin invariant, CSRF Origin + Zod checks, rate-limited login lockout.
- Fallback & Security: Built-in defaults on empty tables, strict CSP/HSTS/noindex headers, 0 secrets in client bundle.
- Verification: 38 Vitest suites / 328 tests passed, 107 routes built clean, font-audit passed, Playwright 6/6 passed.

## Edge Crypto & Razorpay Test Integration (COMPLETE)
- Replaced Node `crypto.createHmac` in `admin-session.ts` with Web Crypto `crypto.subtle` for Edge runtime.
- Integrated Razorpay Test Key ID (`rzp_test_U3EDLD1Ynzmonq`) and Secret in `.env.local`.
- Connected `razorpay.orders.create` in `/api/orders` with live order ID sync and mock fallbacks.
- Integrated standard Razorpay checkout modal and script loader in `/checkout` with timing-safe signature verification.
- Verification: `typecheck` (0 errors), `lint` (0 errors), 38/38 Vitest suites (328 tests) passed, `build` clean (106/106 routes).

## Razorpay Signature Verification & Reconciliation (COMPLETE)
- Fixed verification payload parameter mapping to accept canonical `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
- Added strict order ID matching, secret/input trimming, lowercase hex normalization, and timingSafeEqual byte length checks.
- Implemented safer checkout confirmation behavior with 20s order status polling on verification delay.
- Added reconciliation `verifyError` display on admin order detail page without exposing secrets.
- Verification: `npm run test:razorpay` passed, 38/38 Vitest suites (332 tests) passed, `typecheck`, `lint`, and `build` clean.

## Removal of Razorpay & Simple COD Checkout (COMPLETE)
- Uninstalled Razorpay package, removed keys, webhook/verify routes, CSP entries, and scripts.
- Implemented Cash on Delivery / Pay Later checkout with server price recomputation and signed cookies.
- Added `/order/[orderNumber]/confirmation` order summary page with guest auth invitations.
- Updated Admin Orders list and detail with "Mark as Paid" action, audited notes, and manual refund guards.
- Verification: typecheck (0 errors), lint (0 errors), build (104 routes clean), 38/38 Vitest suites passed.

## Bugfix: Duplicate React Key in Admin Recent Activity & Timeline
- Deduplicated `ORDER_STORE.values()` across analytics, cron, customers, and reviews to prevent double-entry iteration.
- Prefixed `recentActivity` items with order number and added index composite keys to `OverviewCommandCentre` & order timeline.
- Verification: `typecheck`, `lint`, and 38/38 Vitest suites passed cleanly.

## Vercel Production Deployment Preparation (COMPLETE)
- Audited repo sizes (0 files >25MB; public/products converted strictly to WebP; source-photos relocated).
- Updated .gitignore and created .vercelignore to exclude sensitive files, logs, tests, and raw assets.
- Configured package.json engines, postinstall, vercel-build, and Prisma pooled DATABASE_URL + DIRECT_URL.
- Enforced zero local-disk runtime writes in production (refusing local storage fallback without Cloudinary).
- Added Upstash production rate limit warning, Vercel cron Bearer auth check, vercel.json (bom1 region), and /api/health DB ping.
- Added scripts/seed-prod-admin.ts (single admin invariant), check-import-case.ts, and docs/DEPLOY.md.
- Verification: `typecheck`, `lint`, `check:case`, 38/38 Vitest test suites, and Next.js production build clean.
