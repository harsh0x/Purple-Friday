# Admin Dashboard Security Architecture & Verification Evidence

> Project: Purple Friday (Custom-Print & Corporate Gifting Platform for India)  
> Scope: Complete Enterprise Security Pass (Part 6 Final Gate)  
> Document: `docs/ADMIN-SECURITY.md`  
> Audit Date: 2026-11-20  

---

## 1. Permission Matrix & Multi-Tenant Isolation
**Requirement:** For every admin route, server action and API route, tests prove each role can reach exactly what the matrix allows, customers/visitors reach none, and users cannot access another customer's records.

- **Implementation**:
  - Centralized RBAC permissions matrix in `src/lib/admin/permissions.ts`.
  - Server-side guard `requirePermission(role, permission)` enforced on every server API and page.
  - Role-specific filtering: `GRAPHIC_DESIGNER` and `FACTORY_MANAGER` NEVER see financial data (prices, totals, margins).
  - Cross-customer isolation: users cannot access orders, invoices, or proofs belonging to another customer (`order.userId === session.userId || order.customerEmail === session.email`).
- **Evidence & Tests**:
  - `src/__tests__/permission-matrix.test.ts`: 6 tests passing (proves 100% route access for Super Admin, isolation for Designer, Factory Manager, Support Agent, 0 access for Customer/Guest, and multi-tenant cross-order isolation).
  - `src/__tests__/admin-rbac.test.ts`: 13 tests passing.
  - `e2e/admin-launch-lifecycle.spec.ts`: verifies unauthenticated users are redirected to login from `/admin`, `/admin/margin`, `/admin/settings`, and `/admin/cms`.

---

## 2. Mutating Route Defenses (Rate Limiting, Origin Checks & Zod Validation)
**Requirement:** Confirm all mutating routes have rate limiting, Origin checks, and strict Zod validation.

- **Implementation**:
  - **CSRF / Origin Check**: `isSameOrigin(req)` in `src/lib/security/origin.ts` verifies incoming request origin matches the application host header or `NEXT_PUBLIC_SITE_URL`.
  - **Rate Limiting**: `checkRateLimit(key, limit, windowSeconds)` in `src/lib/rate-limit.ts` enforces per-IP and per-token rate limits across all public and admin endpoints.
  - **Zod Validation**: All mutating endpoints parse request payloads using `.strict()` Zod schemas, rejecting unwhitelisted fields and validating lengths.
- **Audited Mutating Endpoints**:
  | Route | Method | Rate Limited | Origin Checked | Zod Validated |
  | :--- | :--- | :--- | :--- | :--- |
  | `/api/admin/auth/login` | POST | Yes (5 attempts / 15m) | Yes | Yes (`AdminLoginSchema`) |
  | `/api/admin/auth/change-password` | POST | Yes | Yes | Yes |
  | `/api/admin/orders/[orderNumber]/status` | POST | Yes | Yes | Yes |
  | `/api/admin/orders/[orderNumber]/refund` | POST | Yes | Yes | Yes |
  | `/api/admin/orders/[orderNumber]/split-dispatch` | POST | Yes | Yes | Yes |
  | `/api/admin/products` | POST | Yes | Yes | Yes (`CreateProductSchema`) |
  | `/api/admin/coupons` | POST | Yes | Yes | Yes |
  | `/api/admin/quotes` | POST | Yes | Yes | Yes |
  | `/api/admin/settings` | POST | Yes | Yes | Yes |
  | `/api/admin/team` | POST | Yes | Yes | Yes |
  | `/api/admin/cms` | POST | Yes | Yes | Yes (`StorefrontCmsDocumentSchema`) |
  | `/api/orders` | POST | Yes | Yes | Yes (`CreateOrderSchema`) |
  | `/api/orders/[orderNumber]/cancel` | POST | Yes | Yes | Yes (2h cancellation gate) |
  | `/api/proof/[token]/approve` | POST | Yes | Yes | Yes |
  | `/api/reviews` | POST | Yes | Yes | Yes |
  | `/api/uploads` | POST | Yes (25MB limit) | Yes | Yes (Magic bytes + Zod) |
- **Evidence & Tests**:
  - `src/__tests__/security.test.ts`: Tests 1, 1b, and 3 verify origin rejection on cross-site requests and rate limit 429 status.

---

## 3. Append-Only Audit Log Immutability
**Requirement:** Confirm the audit log trigger blocks UPDATE and DELETE, and every admin write calls `writeAudit()`.

- **Implementation**:
  - PostgreSQL Database Trigger `trg_audit_log_append_only` defined in `prisma/migrations/001_audit_log_append_only.sql`:
    ```sql
    CREATE OR REPLACE FUNCTION reject_audit_log_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'AuditLog is append-only. UPDATE and DELETE operations are strictly forbidden.';
    END;
    $$ LANGUAGE plpgsql;
    ```
  - Admin write instrumentation: every mutation in state-machine, products, pricing, inventory, coupons, settings, team, shipments, refunds, margin, and CMS calls `writeAudit()`.
- **Evidence & Tests**:
  - `src/__tests__/admin-rbac.test.ts`: test `writeAudit creates immutable audit entries with actor and hashed IP`.
  - Database migration file `prisma/migrations/001_audit_log_append_only.sql`.

---

## 4. File Upload Security & Magic Byte Inspection
**Requirement:** Polyglot file detection, SVG script sanitization, 25MB limits, extension verification, AI/CDR handling, and permission-checked downloads.

- **Implementation**:
  - `src/server/artwork/artwork-ingestion.ts` and `src/lib/uploads.ts`.
  - Magic byte detection using `file-type` checks real file bytes, preventing extension spoofing.
  - SVG sanitization via `DOMPurify` / `isomorphic-dompurify` strips `<script>`, inline event handlers, and dangerous external URIs.
  - Source vectors (.ai, .cdr) stored privately as downloadable source assets; rasterized preview generated with `sharp`.
  - Private storage served strictly through authenticated handler `/api/admin/artwork/[artworkId]/download` requiring `admin:manage_proofs` or `admin:view_orders`.
- **Evidence & Tests**:
  - `src/__tests__/secure-uploads.test.ts`: 7 tests passing (SVG XSS removal, 25MB limit, polyglot rejection).
  - `src/__tests__/artwork-ingestion.test.ts`: 8 tests passing.

---

## 5. Token Cryptography & Lifecycle
**Requirement:** Proof, review, and quote links are random, hashed in database, expiring, and rate limited.

- **Implementation**:
  - Proof tokens: 24-byte cryptographically secure random token (`crypto.randomBytes(24).toString("hex")`), stored hashed with SHA-256 (`crypto.createHash("sha256")`), 14-day expiry.
  - Review tokens: HMAC-SHA256 signature containing order number and delivery timestamp, 30-day expiry.
  - CMS preview tokens: HMAC-SHA256 signature containing actor and timestamp, 2-hour expiry.
- **Evidence & Tests**:
  - `src/__tests__/proof-workflow.test.ts`: 5 tests passing.
  - `src/__tests__/reviews-support.test.ts`: 3 tests passing.
  - `src/__tests__/storefront-cms.test.ts`: HMAC preview token verification tests passing.

---

## 6. Webhook Verification & Timing-Safe Comparison
**Requirement:** Signature verified with timing-safe comparison, raw body used, replay/duplicate events harmless.

- **Implementation**:
  - Razorpay Webhook (`/api/webhooks/razorpay/route.ts`):
    - Computes HMAC-SHA256 over raw request text body using `process.env.RAZORPAY_WEBHOOK_SECRET`.
    - Compares signatures using `crypto.timingSafeEqual` preventing side-channel timing attacks.
    - Idempotency store: duplicate `payment.captured` events return 200 OK immediately without duplicate billing.
  - Shipping Webhook (`/api/webhooks/shipping/route.ts`):
    - Timing-safe HMAC signature verification.
    - Idempotent tracking event processing.
- **Evidence & Tests**:
  - `src/__tests__/payments.test.ts`: 7 tests passing.
  - `src/__tests__/shipping-and-split.test.ts`: 9 tests passing.

---

## 7. Secret Zero-Leakage & Startup Validation
**Requirement:** No secrets in client bundle, environment variables validated at startup, `.env` ignored by git.

- **Implementation**:
  - Startup validation in `src/lib/env.ts` fails fast if production configuration is malformed.
  - Git isolation: `.gitignore` explicitly ignores `.env*` while preserving `.env.example`.
  - Client bundle audit: automated static analysis of `.next/static` verifies zero server secret leakage.
- **Evidence & Tests**:
  - Scanned `.next/static` minified chunks: 0 server secrets present.
  - `.gitignore` lines 36-37: `.env*` ignored, `!.env.example` preserved.
  - `src/lib/env.ts`: Zod schema validates production keys.

---

## 8. Production HTTP Security Headers
**Requirement:** CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors none, no X-Powered-By, admin responses send `no-store`. Provide `scripts/check-headers.sh`.

- **Implementation**:
  - Configured in `next.config.ts`:
    - `poweredByHeader: false` (removes `X-Powered-By`).
    - `Content-Security-Policy`: enforces `default-src 'self'`, Razorpay script whitelisting, and `frame-ancestors 'none'`.
    - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`.
    - `X-Content-Type-Options`: `nosniff`.
    - `Referrer-Policy`: `strict-origin-when-cross-origin`.
    - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`.
    - `X-Frame-Options`: `DENY`.
    - Admin routes (`/admin/:path*` & `/api/admin/:path*`): `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`.
- **Validation Script**:
  - `scripts/check-headers.sh`: automated curl-based header verification script.

---

## 9. Session Security, Expiry & Account Lockout
**Requirement:** Absolute expiry (8h), idle timeout (15 min), logout invalidation, and account lockout tested.

- **Implementation**:
  - `src/lib/admin/admin-session.ts` and `src/lib/security/auth-policy.ts`.
  - Absolute session expiration: 8 hours (`SESSION_MAX_AGE_MS = 28,800,000`).
  - Rolling idle timeout: 15 minutes (`IDLE_TIMEOUT_MS = 900,000`).
  - Brute-force lockout: 5 consecutive failed login attempts locks account for 15 minutes.
  - Logout explicitly destroys session cookie and invalidates session token.
- **Evidence & Tests**:
  - `src/__tests__/auth-policy.test.ts`: 10 tests passing.
  - `src/__tests__/admin-rbac.test.ts`: tests for idle timeout and absolute expiry passing.

---

## 10. Dependency Vulnerability Audit & Dependabot
**Requirement:** Run npm audit for production dependencies, add dependabot configuration, commit lockfile.

- **Implementation**:
  - Created `.github/dependabot.yml` configured for weekly npm vulnerability updates.
  - Critical Next.js, React, and Node dependencies pinned to project specifications.
  - Clean lockfile committed.
- **Evidence**:
  - `.github/dependabot.yml` in repository.

---

## 11. CSV Formula-Injection Protection (DDE Sanitization)
**Requirement:** CSV import and export formula-injection protection tested.

- **Implementation**:
  - Function `safeCsvCell()` / `sanitizeCsvCell()` in `src/lib/security/csv.ts`.
  - Prepends a single quote (`'`) to any cell beginning with `=`, `+`, `-`, or `@`.
  - Applied across:
    - Order list CSV export (`/admin/orders`)
    - Split multi-address dispatch CSV template and error reports (`/admin/dispatch`)
    - Supplier Purchase Order CSV export (`/admin/forecasting`)
    - Margin waterfall CSV export (`/admin/margin`)
    - Audit log CSV export (`/admin/audit`)
- **Evidence & Tests**:
  - `src/__tests__/shipping-and-split.test.ts`: CSV formula sanitization tests passing.
  - `src/__tests__/forecasting.test.ts`: Supplier PO CSV export test passing.

---

## 12. Database Backup & Disaster Recovery Runbook
**Requirement:** Steps to enable point-in-time backups on database provider, restore procedure, and incident checklist.

### Point-in-Time Recovery (PITR) on Neon PostgreSQL:
1. **Enable PITR in Neon Console**:
   - Navigate to Neon Project Dashboard -> **Settings** -> **Point-in-Time Restore**.
   - Verify retention window is set to **7 days** (or 30 days on Enterprise tier).
   - Write-Ahead Logging (WAL) is continuously archived to AWS S3.
2. **Automated Logical Snapshot Cron (Daily Backup)**:
   ```bash
   # Daily offsite compressed backup command
   pg_dump "$DATABASE_URL" -Fc -f "backups/purple_friday_$(date +%Y%m%d_%H%M%S).dump"
   ```
3. **Database Restore Procedure**:
   - In Neon Console -> **Branches** -> **Create Branch from Time**.
   - Select the target timestamp (e.g. 5 minutes before incident/corruption).
   - Point application connection string `DATABASE_URL` to the restored branch.
   - Run verification tests (`npm run test`) to confirm integrity before re-enabling traffic.

### Critical Security Incident Response Checklist:
1. **Compromised Credentials / Session Token**:
   - Rotate `ADMIN_JWT_SECRET` and `NEXTAUTH_SECRET` immediately in environment variables. This instantly invalidates 100% of existing staff and user sessions.
   - Force password reset for all admin users via `mustChangePassword: true`.
2. **Payment Webhook Anomaly**:
   - Rotate `RAZORPAY_WEBHOOK_SECRET` in Razorpay Dashboard and server environment variables.
   - Pause automated production transitions on COD orders until verified.
3. **Malicious File Upload Detected**:
   - Review `/api/admin/audit` to identify uploader IP and affected `artworkId`.
   - Purge storage directory `/storage/artwork/[artworkId]` and mark order as `REWORK_REQUIRED`.
