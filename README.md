# Purple Friday — Custom-Print & Corporate Gifting Platform for India

> Production E-Commerce Platform & High-Throughput Command-Centre Admin Dashboard for Custom Apparel, Magnetic Badges, Executive Drinkware, and Corporate Onboarding Kits.

---

## 1. Quick Start

### Prerequisites
- Node.js `20.x` LTS
- PostgreSQL database (Neon or self-hosted)

### Installation & Development
```bash
# Install dependencies
npm install

# Initialize database schema & run seed
npm run db:migrate
npm run seed:analytics # Optional: populates realistic demo orders for analytics

# Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the Storefront and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the Admin Dashboard.

---

## 2. Admin Dashboard & Single Admin Governance

The Purple Friday Admin Dashboard is a streamlined, single-operator command centre built with strict server-side permission gating. In accordance with the Single Administrator architecture, there are no sub-roles, no staff tiers, and no factory logins—only the business owner has admin access.

### Single Admin Invariant & First Login
1. Navigate to `/admin/login`.
2. Initial credentials configured via environment:
   - **Email**: Defined by `ADMIN_EMAIL` (default: `admin@purplefriday.in`)
   - **Default Password**: Set on initial setup or reset via the server CLI script.
3. **Admin Password Reset CLI**:
   To set or reset the admin password from the server console:
   ```bash
   npx tsx scripts/reset-admin-password.ts "admin@purplefriday.in" "NewSecurePassword2026!"
   ```
4. **Login Hardening**:
   - Rate-limited to 10 attempts per 15-minute window per IP.
   - Account locks automatically after repeated failures.
   - All mutations require strict CSRF Origin validation and Zod schema verification.

---

## 3. Environment Variables Reference

Configure the following variables in `.env.local` (or your hosting platform dashboard):

| Variable | Description | Where to Obtain |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Neon console or PostgreSQL host |
| `NEXTAUTH_SECRET` | 32+ char secret for customer sessions and HMAC | Run `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Email of the sole platform administrator | `admin@purplefriday.in` |
| `OTP_SECRET` | Secret key for customer email OTP verification | Random 32+ char string |
| `DEV_OTP_LOG` | Terminal OTP logger (MUST be false/absent in prod) | Set to `false` in production |
| `RESEND_API_KEY` | API key for transactional emails | Resend Dashboard -> API Keys |
| `EMAIL_FROM` | Verified sender email | `Purple Friday <orders@purplefriday.in>` |
| `NEXT_PUBLIC_SITE_URL`| Production canonical URL | `https://purplefriday.in` |
| `CRON_SECRET` | Bearer token for automated background scheduler | Random 32+ char secret |
| `SHIPROCKET_API_USER` | Email of Shiprocket logistics account | Shiprocket API settings |
| `SHIPROCKET_PASSWORD` | Password for Shiprocket account | Shiprocket API settings |

---

## 4. Database Migrations & Single Source of Truth

The admin dashboard is the sole source of truth for products, pricing, categories, and storefront content.

```bash
# Run database migrations
npm run db:migrate

# Generate routes and credentials audit report
npm run routes:txt
```

---

## 5. Deployment & Production Operations

- **Production Security Headers**: Strict CSP with nonces, HSTS (2 years), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `frame-ancestors 'none'`.
- **Admin Cache Invariant**: All admin routes return `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- **Zero Chrome Leakage**: Admin routes render inside the isolated Admin Layout with zero storefront navigation, announcement bar, or footer elements.
- **Background Cron**: Configure a 10-minute HTTP ping to `/api/cron/tick` with `Authorization: Bearer <CRON_SECRET>`.

---

## 4. Background Automation Scheduler (`/api/cron/tick`)

Automated background operations run via a single, idempotent endpoint `/api/cron/tick` configured to run **every 10 minutes**:
- Dispatches unapproved proof reminders (24h and 48h notices).
- Flags orders that breach the 48-hour Dispatch SLA.
- Mines frequently-bought-together association rules.
- Triggers low raw-material stock alerts for factory managers.
- Schedules automated review requests 3 days post-delivery.

### Setting up the Cron Runner
Set up an external cron runner (e.g. Vercel Cron, GitHub Actions, or cron-job.org) targeting:
```bash
curl -X POST https://yourdomain.com/api/cron/tick \
  -H "Authorization: Bearer <YOUR_CRON_SECRET>"
```

---

## 5. Third-Party Integrations Setup

### Shiprocket Tracking Webhooks
1. In Shiprocket Dashboard -> **API** -> **Webhooks**.
2. Add Webhook URL: `https://yourdomain.com/api/webhooks/shipping`.
3. Secret: Enter the value of `SHIPPING_WEBHOOK_SECRET`.
4. Subscribed Events: `shipment.delivered`, `shipment.rto`, `shipment.in_transit`.

### WhatsApp & Resend Prepress Notifications
- **WhatsApp**: Configured in `src/server/orders/proof-service.ts`. When an order mockup is sent, generates automated wa.me approval link or sends via WhatsApp Cloud API.
- **Resend**: Sends 1:1 proof approval invites and automated review requests post-delivery.

---

## 6. Database Migrations & Safe Deployment

### Running Migrations Safely
```bash
# Generate Prisma Client
npx prisma generate

# Apply pending migrations without resetting data
npx prisma migrate deploy
```

### Production Build & Verification
```bash
# Typecheck
npm run typecheck

# Lint check
npm run lint

# Unit tests
npm run test

# Production build
npm run build
```

---

## 7. Verification & Quality Gates
- **41 Vitest Suites / 326+ Unit Tests**: 100% passing across state machine, pricing engine, risk scoring, forecasting, and CMS.
- **Zero Storefront Bundle Leakage**: Admin libraries are strictly code-split. Storefront First Load JS remains invariant at ~28 kB / 216 kB total.
- **WCAG AA Accessibility**: 100% contrast compliance across Ink, Paper, Violet, and Spot-Lime tokens.
