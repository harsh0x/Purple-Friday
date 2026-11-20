# Admin Architecture Baseline & System Audit (Step 0)

> Generated: 2026-11-20
> Project: Purple Friday (Custom-Print & Corporate Gifting E-Commerce Platform for India)
> Scope: Admin Dashboard (Part 1 Architecture Audit)

---

## 1. Framework and Versions

From `purple-friday/package.json`:
- **Core Framework**: Next.js `15.1.7` (App Router)
- **UI Library**: React `^19.0.0`, React DOM `^19.0.0`
- **Language & Runtime**: TypeScript `^5.0.0`, Node.js `^20.x`
- **Styling**: Tailwind CSS `^3.4.1`, PostCSS `^8`
- **ORM / Database**: Prisma `6.4.1`, `@prisma/client` `6.4.1` (PostgreSQL provider via Neon)
- **Authentication**: NextAuth.js `^4.24.15`, `bcryptjs` `^3.0.3`
- **Validation**: Zod `^4.6.7`
- **Animation & Motion**: Motion (Framer Motion) `^14.10.0`, GSAP `^3.15.1` (storefront only), Lenis `^1.3.27` (storefront smooth scroll)
- **UI & Accessibility Primitives**:
  - `@radix-ui/react-accordion` `^1.3.1`
  - `@radix-ui/react-checkbox` `^1.4.1`
  - `@radix-ui/react-dialog` `^1.3.1`
  - `@radix-ui/react-popover` `^1.3.1`
  - `@radix-ui/react-select` `^2.4.1`
  - `@radix-ui/react-slider` `^1.6.1`
  - `@radix-ui/react-tabs` `^1.2.1`
  - `@radix-ui/react-tooltip` `^1.4.1`
  - `lucide-react` `^1.70.0`
  - `sonner` `^2.0.8` (toast notifications)
- **State Management**: Zustand `^5.0.16`
- **Security & Utilities**:
  - `file-type` `^22.3.0` (magic byte file validation)
  - `isomorphic-dompurify` `^4.7.0` (SVG/HTML sanitization)
  - `pino` `^10.4.0`, `pino-pretty` `^13.2.0` (structured logging)
- **Media, PDFs & Payments**:
  - `sharp` `^0.35.5`
  - `pdf-lib` `^1.17.1`
  - `razorpay` `^2.9.8`
  - `cloudinary` `^2.11.0`
  - `resend` `^6.37.0`
- **Testing & Tooling**:
  - `vitest` `^5.1.0`
  - `@playwright/test` `^1.65.0`
  - `eslint` `^9.0.0`, `eslint-config-next` `15.1.7`
  - `tsx` `^4.23.15`

---

## 2. Workspace & Folder Structure

```
Purple firday customization/
├── package.json                         # Workspace root runner (proxies commands to purple-friday/)
├── docs/                                # Workspace root documentation
│   ├── ADMIN-ARCHITECTURE.md            # This document
│   ├── ADMIN-RULES.md                   # Operational, security & design rules
│   └── ADMIN-PROGRESS.md                # Task tracker across all 6 parts
└── purple-friday/                       # Next.js Application & Git Repository
    ├── prisma/
    │   ├── schema.prisma                # PostgreSQL Prisma schema
    │   └── seed.ts                      # Idempotent DB seeder
    ├── scripts/
    │   ├── db-migrate.ts                # Prisma generation & schema push runner
    │   └── contrast-check.ts            # Automated WCAG AA contrast tester
    ├── src/
    │   ├── app/
    │   │   ├── admin/                   # Admin portal root and pages (isolated bundle)
    │   │   ├── api/
    │   │   │   ├── admin/               # Admin protected server API endpoints
    │   │   │   ├── auth/                # NextAuth and auth API endpoints
    │   │   │   ├── cart/                # Cart recalculation endpoint
    │   │   │   └── orders/              # Orders and invoices
    │   │   ├── auth/                    # Customer storefront login / registration
    │   │   ├── cart/                    # Storefront cart page
    │   │   ├── checkout/                # Checkout and payments
    │   │   ├── layout.tsx               # Storefront root layout (Lenis, fonts)
    │   │   └── page.tsx                 # Storefront homepage
    │   ├── components/
    │   │   ├── admin/                   # Admin UI components
    │   │   ├── mockup/                  # Canvas & preview compositors
    │   │   ├── product/                 # Product cards, gallery, size pickers
    │   │   └── ui/                      # Base buttons, dialogs, inputs
    │   ├── fonts/                       # Local font configurations
    │   ├── hooks/
    │   │   └── useCart.ts               # Zustand persistent customer cart hook
    │   ├── lib/
    │   │   ├── admin/                   # Admin audit, store, validation
    │   │   ├── security/                # Auth policy, CSV sanitizer, SVG cleaner, session
    │   │   ├── auth.ts                  # NextAuth configuration
    │   │   ├── auth-service.ts          # User verification, lockout enforcement, mock store
    │   │   ├── catalogue.ts             # 24 core products, pricing, and category helpers
    │   │   ├── orders.ts                # Order creation, number generator, registry
    │   │   ├── pricing.ts               # Bulk tier calculation and GST logic
    │   │   └── prisma.ts                # Singleton Prisma client
    │   └── __tests__/                   # 15 Vitest test suites
    └── tailwind.config.ts               # Tailwind tokens, colours, fonts, and shadows
```

---

## 3. Storage Mechanisms

### Products
- **Storage**: In-code source of truth in `src/lib/catalogue.ts` (`ALL_PRODUCTS` array of 24 products across 6 categories: magnetic badges, t-shirts, polo shirts, hoodies, caps, corporate gifts).
- **Database Model**: `Product`, `Category`, `ProductOption`, `PriceTier`, `ProductImage` in Prisma PostgreSQL schema.
- **Runtime Flow**: `getCachedProducts()` in `src/lib/catalogue.ts` uses Next.js `unstable_cache` (1 hour revalidation). It attempts to query Prisma first; if database is offline or unconfigured, it seamlessly falls back to `ALL_PRODUCTS`.
- **Admin Store**: `src/lib/admin/admin-store.ts` manages product modifications in memory with DB synchronization hooks.

### Orders
- **Storage**: `Order` and `OrderItem` models in Prisma PostgreSQL schema.
- **Runtime Flow**: `createOrder()` in `src/lib/orders.ts` recalculates pricing on the server via `calculateCartPricing()`, assigns order numbers formatted `PF-YYMM-XXXXX`, records in PostgreSQL if connected, and mirrors in `ORDER_REGISTRY` in-memory map.
- **Money Representation**: Stored in integer paise (e.g. ₹85.00 stored as integer `85` in catalogue, or ₹1400.00 stored as `140000` paise in Razorpay/accounting).

### Users & Staff
- **Storage**: `User` model in Prisma PostgreSQL schema.
- **Runtime Flow**: `findUserByEmail()` and `verifyUserCredentials()` in `src/lib/auth-service.ts`.
- **Fallback**: In-memory `MOCK_USERS` map containing seeded superadmin user.
- **Security**: Passwords hashed with `bcryptjs` (salt rounds / cost: 12). Account locks for 15 minutes after 5 consecutive failed attempts.

### Cart
- **Storage**: Client-side Zustand store `useCart` in `src/hooks/useCart.ts`, persisted in browser `localStorage` under key `purple-friday-cart`.
- **Integrity**: Cart totals, discounts, taxes (18% GST), and bulk price tier calculations are recomputed on the server via `/api/cart/price` and `calculateCartPricing()` in `src/lib/pricing.ts`.

---

## 4. Existing Authentication

- **Provider**: NextAuth.js v4 (`authOptions` in `src/lib/auth.ts`).
- **Strategy**: JWT session tokens.
- **Customer Auth**: Routes `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`.
- **Middleware**: `middleware.ts` inspects `getToken()` and protects `/account` and `/admin`.
- **Brute Force Defense**: `src/lib/security/auth-policy.ts` implements `validatePasswordStrength()` (score 0-4, minimum 10 chars, complexity rules, dictionary blacklist) and `checkAccountLockout()` / `recordFailedAttempt()`.

---

## 5. Existing Statuses

- **UserRole**: `CUSTOMER`, `ADMIN` (Prisma enum)
- **Audience**: `TEAM`, `GIFTING`, `BOTH`
- **ReviewStatus**: `PENDING`, `APPROVED`, `REJECTED`
- **OrderStatus**: `PENDING_PAYMENT`, `PAID`, `PROOF_PENDING`, `PROOF_READY`, `CHANGES_REQUESTED`, `APPROVED`, `IN_PRODUCTION`, `PACKED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`, `REFUNDED`
- **ProofStatus**: `PENDING`, `READY`, `CHANGES_REQUESTED`, `APPROVED`
- **CouponType**: `PERCENTAGE`, `FLAT`
- **QuoteRequest.status**: `PENDING`, `IN_TOUCH`, `QUOTED`, `WON`, `LOST`
- **ContactMessage.status**: `UNREAD`, `READ`, `ARCHIVED`

---

## 6. Existing Design Tokens

Configured in `purple-friday/tailwind.config.ts`:
- **Colours**:
  - `ink`: `#15101F` (50: `#F8F6FA`, 100: `#ECE7F2`, 200: `#DDD4E6`, 300: `#BEB0CF`, 400: `#9F8CB8`, 500: `#816F98`, 600: `#64537A`, 700: `#483A5A`, 800: `#312540`, 900: `#221A31`)
  - `paper`: `#F5F0E8` (warm: `#EDE6DA`, pure: `#FAF7F2`, dark: `#E3DACB`)
  - `violet`: `#6A2CFF` (hover: `#5820DC`, light: `#7F47FF`, dark: `#4B1AB8`)
  - `lilac`: `#CDB8FF` (light: `#E3D7FF`, dark: `#B496FF`)
  - `spot-lime`: `#D8FF3F` (hover: `#C4ED2B`, dark: `#B0D820`)
  - Semantic Aliases: `pf-ink`, `pf-paper`, `pf-violet`, `pf-lime`, `pf-lilac`
- **Typography**:
  - Sans / Body: `var(--font-instrument)` (Instrument Sans)
  - Display / Headings: `var(--font-bricolage)` (Bricolage Grotesque)
  - Monospace / Numbers / Badges: `var(--font-dm-mono)` (DM Mono)
- **Shadows**:
  - `stamp`: `4px 4px 0px #15101F`
  - `stamp-hover`: `6px 6px 0px #15101F`
  - `stamp-active`: `2px 2px 0px #15101F`
  - `stamp-sm`: `2px 2px 0px #15101F`
  - `stamp-lg`: `8px 8px 0px #15101F`
  - `card`: `3px 3px 0px rgba(21, 16, 31, 0.15)`
  - `card-hover`: `5px 5px 0px rgba(21, 16, 31, 0.2)`
- **Motion / Transitions**:
  - `editorial`: `cubic-bezier(0.22, 1, 0.36, 1)`
  - Keyframes: `counterRoll`, `shimmer`

---

## 7. Baseline Verification Status (Before Admin Part 1 Changes)

1. **Typecheck (`npm run typecheck`)**:
   - Status: **PASSED (0 errors)**
   - Tool: `tsc --noEmit`
2. **Linting (`npm run lint`)**:
   - Status: **PASSED (0 errors, 0 warnings)**
   - Tool: Next.js ESLint 9
3. **Unit & Integration Tests (`npm test`)**:
   - Status: **PASSED (15 test suites, 104 tests passed)**
   - Tool: Vitest 5.1.0
4. **Production Build (`npm run build`)**:
   - Status: **PASSED (63 routes compiled and statically optimized)**
   - Shared first load JS: **106 kB**
   - Storefront homepage (`/`): **28 kB (216 kB first load JS)**


---

## 8. Complete Admin Routes & API Reference (Parts 1 to 6)

### 8.1 Admin User Interface Routes (`/admin/*`)

All admin interface routes are rendered on a dark canvas (`#15101F` Ink, `#1C1628` Surface), isolated from the storefront bundle, guarded by Edge Middleware (`src/middleware.ts`), and enforce granular role-based permissions (`src/lib/admin/permissions.ts`).

| Route Path | Page Title / Station | Required RBAC Permission | Primary Roles | Key Capabilities & Features |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | Executive Overview & Control Room | `admin:view_overview` | Super Admin, Store Manager, Finance, Production | Dynamic India greeting, attention counters, live operational funnel strip, 7/30/90-day Net Revenue & Net Margin charts, category distribution donut, animated count-up KPI tiles, recent activity feed. Financial tiles masked for non-financial roles. |
| `/admin/login` | Staff Authentication Portal | Public / Unauthenticated | All Staff | Dedicated dark branded staff login with email, password visibility toggle, brute-force exponential backoff (15-min lockout after 5 failures), and forced first-time password reset. |
| `/admin/analytics` | Deep Operational Analytics | `admin:view_overview` | Super Admin, Store Manager | Operational funnel throughput, AOV trends, repeat corporate buyer retention rate, sample-to-bulk conversion rate, on-time dispatch rate, and India seasonal spikes. |
| `/admin/margin` | True Net Margin Intelligence | `admin:manage_pricing` | Super Admin, Finance Officer | Real-time profit-per-order engine deducting blanks COGS, print consumables, custom packaging, payment gateway fee (2.36%), shipping freight, and RTO provisions. |
| `/admin/customers` | Corporate CRM & RFM Segments | `admin:view_orders` | Super Admin, Store Manager | RFM customer segmentation (`Champions`, `Loyal`, `At-Risk`, `Needs Attention`, `Lost`), B2B corporate purchase frequency, GSTIN & company details, lifetime value (LTV). |
| `/admin/orders` | Orders Master Control | `admin:view_orders` | All Staff Roles | Full search, multi-status tab filters (`All`, `Pending Approval`, `In Production`, `Dispatched`, `Delivered`, `RTO`), high-risk flags, partial COD badges, CSV export. |
| `/admin/orders/[orderNumber]` | Order Detail & Pipeline Hub | `admin:view_orders` | All Staff Roles | 12-state transition hub with version locking, customer contact card, artwork download & inspection, mockup review, jobsheet generation, split dispatch trigger, balance collection, refund dispatch, and audit trail timeline. |
| `/admin/designs` | Designer Workstation | `admin:manage_proofs` | Graphic Designer, Super Admin | Pending mockups queue, vector artwork ingestion (300 DPI inspection, transparent background detection), proof composition, customer feedback inspection, and WhatsApp mockup dispatch. |
| `/admin/production` | Factory Floor Station | `admin:manage_production` | Production Manager, Super Admin | Active printing queues grouped by printing method (DTF, Screen, Embroidery, UV Sublimation), printable A4/A5 PDF jobsheets, QC pass/fail station, rework logging on `IN_PRINTING`. |
| `/admin/quotes` | B2B RFQ & Quote Studio | `admin:view_orders` | Store Manager, Super Admin | Multi-product corporate quote builder, custom slab pricing, printable GST-compliant PDF quotes/proforma invoices, Razorpay dynamic payment link generator with WhatsApp dispatch. |
| `/admin/dispatch` | Packaging & Dispatch Hub | `admin:manage_dispatch` | Store Manager, Production, Super Admin | Pending packaging batches, courier allocation, single and multi-address split dispatch generator, CSV recipient upload, label printing queue. |
| `/admin/shipments` | Logistics & Courier Tracking | `admin:manage_dispatch` | Store Manager, Super Admin | Live Shiprocket courier integration tracker, AWB milestone timeline, NDR (non-delivery report) exceptions, RTO risk monitoring. |
| `/admin/payments` | Payments & Reconciliations | `admin:manage_pricing` | Finance Officer, Super Admin | Partial COD advance tracking, balance-on-delivery collection logging, Razorpay transaction capture verification, refund audit log. |
| `/admin/products` | Product Catalogue Manager | `admin:manage_products` | Super Admin | Master product list with active/draft toggles, best-seller badges, inventory counts, category chips, and quantity slab summaries. |
| `/admin/products/[slug]` | Product Atelier Studio | `admin:manage_products` | Super Admin | Deep product editor: SEO metadata, category & audience (`TEAM`, `GIFTING`), MOQ & quantity steps, GST rate, COGS per blank & print, colour swatches, and quantity pricing slabs. |
| `/admin/inventory` | Raw Blanks Inventory | `admin:manage_products` | Super Admin, Production | SKU-level blank stock tracking across colour and size combinations, safety stock thresholds, low-stock warnings, and stock movement logs. |
| `/admin/forecasting` | Demand & Stockout Forecast | `admin:manage_products` | Super Admin, Production | 14-day stock-out prediction based on recent sales velocity, reorder point calculations, lead-time buffers, and supplier replenishment alerts. |
| `/admin/kits` | Corporate Bundles & Gift Kits | `admin:manage_products` | Super Admin | Multi-product corporate swag kit builder with dynamic bundle discount calculations, packaging selection, and stock availability checks. |
| `/admin/coupons` | Discounts & Promotions | `admin:manage_products` | Super Admin | Coupon code creator (`PERCENTAGE` or `FLAT`), first-order restrictions, cart minimums, maximum discount caps, usage limits, and active date ranges. |
| `/admin/reviews` | Verified Review Moderation | `admin:moderate_reviews` | Super Admin, Store Manager | Post-delivery verified review moderation queue with craftsmanship breakdown (print clarity, fabric feel, colour match), and approve/reject actions. |
| `/admin/support` | Customer Support Helpdesk | `admin:view_orders` | Support Agent, Super Admin | Ticketing queue for customer inquiries, cancellation requests, order status lookups, and dispute resolution. |
| `/admin/notifications` | Staff Alert Centre | `admin:view_overview` | All Staff Roles | Bell dropdown notification centre for urgent proof approvals, low-stock warnings, overdue production jobs (>48h), and cancellation requests. |
| `/admin/team` | Staff Management & RBAC | `admin:manage_team` | Super Admin Only | Staff user invitations, role assignment, active session revocation, password resets, and account unlock controls. |
| `/admin/audit` | Immutable Audit Trail | `admin:view_audit` | Super Admin, Finance Officer | Append-only database audit log viewer with actor, entity, date range filters, and CSV export secured against formula injection (`safeCsvCell`). |
| `/admin/settings` | Global System Configuration | `admin:manage_settings` | Super Admin Only | Business profile, GSTIN, default shipping rates, partial COD advance % (20–30%), max COD value, RTO risk score thresholds, and courier credentials. |
| `/admin/cms` | No-Code Storefront CMS | `admin:manage_settings` | Super Admin Only | Super Admin studio for homepage hero copy, scheduled announcement bars, section ordering & visibility, FAQs, footer links, SEO meta tags, live preview tokens, and 10-snapshot version rollback. |

---

### 8.2 Admin Server API Routes (`/api/admin/*`)

All API routes under `/api/admin/*` require an active staff session token (`pf_admin_session` cookie), perform server-side role and permission verification, validate request bodies via Zod schemas, enforce origin checks, apply rate limiting, and write immutable entries to `AuditLog`.

#### Authentication & Session Management
* `POST /api/admin/auth/login`
  - **Purpose**: Authenticates staff members using email and password.
  - **Security**: Verifies credentials via `bcryptjs`, enforces 5-attempt / 15-minute lockout, issues signed HMAC-SHA256 session token (`pf_admin_session`) with 8-hour lifetime and 30-minute idle timestamp.
* `POST /api/admin/auth/logout`
  - **Purpose**: Terminates staff session, clears the HTTP-only session cookie, and records audit logout event.
* `GET /api/admin/auth/session`
  - **Purpose**: Returns currently authenticated staff profile, assigned role, and permissions.
* `POST /api/admin/auth/change-password`
  - **Purpose**: Forces password update for new staff accounts or password reset workflows, ensuring complexity requirements.

#### Orders & Production Pipeline
* `GET /api/admin/orders`
  - **Purpose**: Paginated order querying with status filtering, date range, search query, and risk level filtering.
* `GET /api/admin/orders/export`
  - **Purpose**: Generates sanitised CSV export of orders matching active filters.
* `GET /api/admin/orders/[orderNumber]`
  - **Purpose**: Retrieves comprehensive order record including line items, proofs, artwork links, shipments, payment history, and audit log.
* `POST /api/admin/orders/[orderNumber]/status`
  - **Purpose**: Performs state machine transition with role permission checks and optimistic version check (`expectedVersion`).
* `POST /api/admin/orders/[orderNumber]/transition`
  - **Purpose**: Alias for state machine transition endpoint supporting granular audit notes.
* `POST /api/admin/orders/[orderNumber]/notes`
  - **Purpose**: Appends internal staff notes to the order without modifying operational status.
* `POST /api/admin/orders/[orderNumber]/override-risk`
  - **Purpose**: Super Admin override to enable COD on high-risk orders flagged by the RTO engine; fully audited.
* `POST /api/admin/orders/[orderNumber]/collect-balance`
  - **Purpose**: Marks COD balance as collected upon courier delivery confirmation.
* `POST /api/admin/orders/[orderNumber]/refund`
  - **Purpose**: Initiates full or partial refunds via Razorpay API and marks order `REFUNDED` or `PARTIALLY_REFUNDED`.
* `POST /api/admin/orders/[orderNumber]/jobsheet`
  - **Purpose**: Generates printable production PDF jobsheet with barcode, artwork specifications, and DTF print instructions.
* `POST /api/admin/orders/[orderNumber]/rework`
  - **Purpose**: Logs QC failure and re-queues order on `IN_PRINTING` station with defect notes.
* `POST /api/admin/orders/[orderNumber]/send-mockup`
  - **Purpose**: Notifies customer via email/WhatsApp that design mockup is ready for review with secure proof token.
* `POST /api/admin/orders/[orderNumber]/proof`
  - **Purpose**: Creates or updates customer proof token and mockup image associations.
* `POST /api/admin/orders/[orderNumber]/items/[itemId]/mockup`
  - **Purpose**: Attaches designer-rendered mockup image to a specific line item.

#### Artwork & Media Ingestion
* `POST /api/admin/artwork/ingest`
  - **Purpose**: Validates and ingests customer vector logos and print files. Enforces 25MB ceiling, checks magic bytes via `file-type`, sanitises SVGs via DOMPurify, and computes print DPI.
* `GET /api/admin/artwork/[artworkId]/download`
  - **Purpose**: Streams original print-ready vector/raster asset to authorised designer/operator with signed access token.

#### Shipping & Split Dispatch
* `GET /api/admin/dispatch/template`
  - **Purpose**: Downloads the standard CSV template for corporate split-address multi-destination shipping (`Recipient Name, Phone, Address, City, State, PIN, Quantity, Notes`).
* `POST /api/admin/orders/[orderNumber]/split-preview`
  - **Purpose**: Parses and validates an uploaded split dispatch CSV against order quantities and Indian PIN codes.
* `POST /api/admin/orders/[orderNumber]/split-dispatch`
  - **Purpose**: Executes split dispatch creation, allocating quantities into child shipments and booking courier AWBs.
* `GET /api/admin/shipments`
  - **Purpose**: Lists all active outbound and return shipments with live carrier tracking statuses.
* `GET /api/admin/shipments/[shipmentNumber]/label`
  - **Purpose**: Generates printable 4x6 courier thermal shipping label.

#### Catalogue, Inventory & Quotes
* `GET /api/admin/products` & `POST /api/admin/products`
  - **Purpose**: Queries and creates catalogue products with pricing slabs, specifications, and blanks COGS.
* `GET /api/admin/products/[slug]` & `PUT /api/admin/products/[slug]`
  - **Purpose**: Retrieves and updates single product definitions, SEO fields, and quantity discount tiers.
* `GET /api/admin/inventory` & `POST /api/admin/inventory`
  - **Purpose**: Manages blanks stock levels, restock alerts, and supplier intake.
* `GET /api/admin/inventory/[skuId]/movements`
  - **Purpose**: Audit log of all stock movements (incoming restock, production consumption, damage/spoilage, returns).
* `GET /api/admin/forecasting`
  - **Purpose**: Returns predictive inventory stock-out dates and recommended reorder volumes.
* `GET /api/admin/kits` & `POST /api/admin/kits`
  - **Purpose**: Queries and manages corporate bundles, packaging fees, and kit compositions.
* `GET /api/admin/coupons` & `POST /api/admin/coupons`
  - **Purpose**: Queries and manages discount coupons with atomic redemption limits.
* `GET /api/admin/coupons/[id]` & `PUT /api/admin/coupons/[id]`
  - **Purpose**: Retrieves and updates specific coupon configurations.
* `GET /api/admin/quotes` & `POST /api/admin/quotes`
  - **Purpose**: Queries RFQs and creates official corporate proforma quotes.
* `GET /api/admin/quotes/[id]/pdf`
  - **Purpose**: Generates GST-compliant PDF quote with atelier branding.
* `POST /api/admin/quotes/[id]/payment-link`
  - **Purpose**: Creates Razorpay payment link for corporate quote acceptance.

#### Intelligence, Reviews & Support
* `GET /api/admin/overview`
  - **Purpose**: Returns real-time metrics for `/admin` command centre (attention counts, operational funnel, revenue, category splits).
* `GET /api/admin/analytics`
  - **Purpose**: Aggregates operational funnel, AOV, corporate retention, and on-time dispatch rates.
* `POST /api/admin/analytics/seed-demo`
  - **Purpose**: Seeds ~400 realistic demo orders across 12 months for testing analytics dashboards (strictly blocked in production).
* `GET /api/admin/margin`
  - **Purpose**: Computes order-level and catalogue-level true net margins.
* `GET /api/admin/customers`
  - **Purpose**: Returns customer records with RFM segmentation and lifetime purchase data.
* `GET /api/admin/customers/[id]`
  - **Purpose**: Returns detailed profile, company GSTIN, and order history for an individual corporate client.
* `GET /api/admin/reviews` & `PUT /api/admin/reviews`
  - **Purpose**: Lists verified reviews and handles approval/rejection moderation.
* `GET /api/admin/support` & `POST /api/admin/support`
  - **Purpose**: Ingests and manages customer support tickets and status updates.
* `GET /api/admin/support/[ticketNumber]`
  - **Purpose**: Returns ticket conversation thread and linked order context.

#### System, CMS, Audit & Settings
* `GET /api/admin/cms` & `POST /api/admin/cms`
  - **Purpose**: Manages no-code storefront CMS document. Supports `save_draft`, `publish` (with cache tag revalidation), and `restore` of last 10 versions.
* `GET /api/admin/team` & `POST /api/admin/team`
  - **Purpose**: Super Admin user management (list, invite, update roles, toggle active status).
* `GET /api/admin/audit` & `GET /api/admin/audit/export`
  - **Purpose**: Queries immutable audit logs and exports sanitized CSV.
* `GET /api/admin/settings` & `PUT /api/admin/settings`
  - **Purpose**: Retrieves and updates global app settings (COD rules, RTO weights, GST details).
* `GET /api/admin/notifications`
  - **Purpose**: Returns unread staff alerts and operational reminders.
