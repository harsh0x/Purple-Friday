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
