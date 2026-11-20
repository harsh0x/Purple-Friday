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
