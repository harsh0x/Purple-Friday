# Purple Friday Admin Launch & Operations Checklist

> Production hand-off and operation manual for the sole administrator of **Purple Friday Atelier**.

---

## 1. Single Admin Account & First Login

Purple Friday strictly enforces a **single active administrator** invariant. There are no sub-roles, no staff tiers, and no factory manager logins.

1. **Access URL**: `https://yourdomain.com/admin/login`
2. **Initial Administrator Identity**:
   - **Email**: Defined in `ADMIN_EMAIL` (default: `admin@purplefriday.in`)
   - **Role**: `ADMIN` (Sole administrator)
3. **Password Reset Script**:
   If you ever lose access to your password, run the idempotent admin password reset CLI script from the server console:
   ```bash
   npm run tsx scripts/reset-admin-password.ts "admin@purplefriday.in" "NewSecurePassword2026!"
   ```
4. **Login Lockout Protection**:
   - Failed attempts are rate-limited to 10 tries per 15-minute window.
   - Repeated invalid credentials trigger a temporary account lockout.

---

## 2. Environment Variables Checklist

Ensure the following variables are configured in your production deployment environment:

| Key | Description | Status / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pool URL | Required |
| `NEXTAUTH_SECRET` | 32+ char cryptographic secret for session HMAC | Required (`openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Sole administrator email address | `admin@purplefriday.in` |
| `OTP_SECRET` | Secret key for customer email OTP hashing | Required |
| `DEV_OTP_LOG` | Terminal OTP logger (MUST be false or absent in prod) | False in production |
| `RESEND_API_KEY` | Resend API key for transactional emails | Required for live customer emails |
| `EMAIL_FROM` | Verified sender address | `Purple Friday <orders@purplefriday.in>` |
| `NEXT_PUBLIC_SITE_URL` | Canonical website domain | `https://purplefriday.in` |
| `CRON_SECRET` | Bearer token for automated 10-minute cron | Required for `/api/cron/tick` |
| `RAZORPAY_KEY_ID` | Razorpay Merchant Key ID | Required for online payments |
| `RAZORPAY_KEY_SECRET` | Razorpay Merchant Key Secret | Required for signature verification |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret | Required for capture callbacks |
| `SHIPROCKET_API_USER` | Shiprocket account email | Required for automated courier tracking |
| `SHIPROCKET_PASSWORD` | Shiprocket account password | Required |

---

## 3. Database Migrations & Single Source of Truth

The admin dashboard is the **exclusive source of truth** for all products, categories, colors, pricing tiers, and storefront content.

- Apply database migrations:
  ```bash
  npm run db:migrate
  ```
- Generate route and credential documentation:
  ```bash
  npm run routes:txt
  ```

---

## 4. No-Code Storefront CMS & Version Control

All storefront modifications occur through `/admin/cms`, `/admin/pages`, `/admin/blog`, and `/admin/media`:

1. **Hero & Home Sections**:
   - Reorder sections using **Move Up** and **Move Down** buttons.
   - Toggle visibility on/off for any section without code changes.
2. **Announcements**:
   - Schedule banner messages with optional start and end dates.
3. **Drafts & Previews**:
   - Click **Save Draft** to preview changes securely using HMAC preview links without affecting public visitors.
   - Click **Publish Live** to instantly revalidate cached storefront tags (`revalidateTag("cms")`).
4. **1-Click Rollback**:
   - The CMS retains the last 10 published versions.
   - Click **History** in the Publish Bar to inspect previous releases and restore with one click.
5. **Zero-Crash Fallback**:
   - If CMS database records are empty, the storefront renders built-in defaults automatically.

---

## 5. Security & Hardening Verification

- **Access Guard**: Every admin route and server action enforces `requireAdmin()`.
- **CSRF & Zod**: Every mutation requires matching Origin headers and passes Zod schema validation.
- **Production Headers**: Strict CSP, HSTS, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, and `frame-ancestors 'none'`.
- **Cache & Indexing**: Admin responses enforce `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.
- **Media Uploads**: Checked against magic bytes, 5MB limit, and verified unused before deletion.

---

## 6. Background Automation (`/api/cron/tick`)

Configure an external cron scheduler (e.g., Vercel Cron, GitHub Actions, or cron-job.org) to trigger `/api/cron/tick` every 10 minutes:
```bash
curl -X POST https://yourdomain.com/api/cron/tick \
  -H "Authorization: Bearer <CRON_SECRET>"
```
Tasks handled automatically:
- Sends proof approval reminders.
- Tracks dispatch SLA timers.
- Mines frequently-bought-together suggestions.
- Processes transactional notification retries.
