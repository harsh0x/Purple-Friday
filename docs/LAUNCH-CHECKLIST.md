# Purple Friday — Production Launch & Go-Live Checklist (20 Critical Operational Gates)

Before switching DNS to live commercial traffic on `https://purplefriday.in`, the operations, engineering, and prepress teams must verify and sign off on each of the following 20 critical operational readiness gates.

---

### Infrastructure & Database
- [ ] **1. Neon PostgreSQL Connection Pooling**: Configure PgBouncer / pooled connection string (`DATABASE_URL` with `?sslmode=require&pgbouncer=true`) to handle concurrent B2B traffic surges.
- [ ] **2. Database Schema Migration**: Execute `npm run db:migrate` against the production database and verify table indexes on `Order(orderNumber)`, `User(email)`, and `Product(slug)`.
- [ ] **3. Automated Database Backups & Point-in-Time Recovery**: Enable daily automated Neon snapshots with a 7-day minimum retention window and test a drill restoration to a staging branch.
- [ ] **4. Distributed Redis Cache (Upstash)**: Supply production `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to ensure sliding-window rate limiters persist across serverless instances.

---

### Cloud Assets & Upload Pipeline
- [ ] **5. Cloudinary Production Environment**: Supply live credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), enable auto-backup on Cloudinary bucket, and verify signed upload restrictions.
- [ ] **6. Media Access Control**: Confirm customer vector logos and high-res prepress proofs are isolated to signed access URLs or private delivery configurations.
- [ ] **7. Local Storage Fallback Purge**: Confirm development test files in `./storage/uploads/` are archived or cleaned up prior to production container deployment.

---

### Payments & Invoicing Compliance (India)
- [ ] **8. Razorpay Live Mode Activation**: Switch from Test API keys (`rzp_test_...`) to live commercial keys (`rzp_live_...`) in environment variables.
- [ ] **9. Razorpay Webhook Endpoint**: Register `https://purplefriday.in/api/webhooks/razorpay` in the Razorpay Dashboard for `payment.captured` and `payment.failed` events, and set `RAZORPAY_WEBHOOK_SECRET`.
- [ ] **10. GSTIN Verification & State Tax Splits**: Verify the company's active GSTIN (`29AAACP1234F1Z5`) with the GST portal and confirm invoice tax splitting (CGST 9% + SGST 9% for Karnataka buyer addresses; IGST 18% for inter-state shipments).
- [ ] **11. HSN Code Mapping Audit**: Confirm all catalogue categories carry verified Harmonized System Nomenclature (HSN) codes (7117 for metal badges, 6109 for cotton apparel, 6505 for caps, 9608 for pens, 3924 for bottles).

---

### Authentication, Security & Anti-Bot
- [ ] **12. Production JWT Secret (`NEXTAUTH_SECRET`)**: Generate and configure a 64-character high-entropy cryptographic string via `openssl rand -base64 48`.
- [ ] **13. Admin Password Rotation**: Log in to `/admin` as `admin@purplefriday.com` using the temporary seed password (`Admin@PF2026!`) and immediately update it to an enterprise-grade passphrase.
- [ ] **14. Cloudflare Turnstile Live Keys**: Configure production `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` on `POST /api/uploads` and `/api/auth/register` to block automated bot submissions.
- [ ] **15. Content Security Policy (CSP) Monitoring**: Verify `middleware.ts` enforces CSP and monitor incoming alerts posted to `/api/csp-report`.

---

### Logistics & Pre-Press Operations
- [ ] **16. Courier Partner Integration**: Connect live Delhivery Express, BlueDart Apex, or DTDC API accounts for automated waybill and AWB tracking generation.
- [ ] **17. Pre-Press Proof SLA Monitoring**: Establish workshop alerts ensuring customer orders receive an uploaded pre-press proof within 24 hours of payment.
- [ ] **18. Pre-Press Staff Training**: Train prepress operators on using the Admin Studio to inspect vector bleed, attach proofs, flip status to `PROOF_READY`, and resolve customer change requests.

---

### Communications, DNS & Legal
- [ ] **19. Resend Domain Authentication (SPF, DKIM, DMARC)**: Verify DNS records on `purplefriday.in` so transactional notification emails (proof ready, order dispatched) do not land in spam folders.
- [ ] **20. Legal & Compliance Sign-Off**: Review customer-facing Terms of Service (`/terms`), Privacy Policy (`/privacy`), Shipping Policy (`/shipping-policy`), and Cancellation & Refund Policy (`/cancellation-and-refund`).

---

**Signed off by:**
- Lead Full-Stack Architect: ___________________________ Date: ____________
- Prepress Workshop Director: ___________________________ Date: ____________
- Commercial Operations Lead: ___________________________ Date: ____________

