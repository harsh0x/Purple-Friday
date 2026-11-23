# Admin Status & Feature Audit (docs/ADMIN-STATUS.md)

Audit Date: 2026-11-21
Platform: Purple Friday Atelier (Single Client Admin Audit)

| Feature | Status | Details |
|---|---|---|
| Product Create | WORKS | Supported via `/api/admin/products` and `/admin/products/new`. Form creates title, slug, price tiers, and specs. |
| Product Edit | WORKS | `/admin/products/[slug]` loads and updates title, slug redirect, description, category, audience, MOQ, and quantity slabs. |
| Product Delete | WORKS | `/api/admin/products` DELETE endpoint handles soft archive and database deletion safely. |
| Product Image Upload | WORKS | Multi-upload via `/api/admin/products/images/upload`, magic byte validation (PNG/JPG/WebP), 25MB limit, WebP responsive variants (1600/800/320px). |
| Colour Editing | WORKS | Master colours registry with HEX swatches; per-product colour galleries; invariant enforced that colour cannot be active without an image. |
| Category Management | WORKS | Full category CRUD (`/admin/categories`), reorder up/down, active/hidden toggle, deletion refusal when products exist, 301 slug redirects. |
| Reviews Moderation | WORKS | `/admin/reviews` displays verified reviews queue; staff approve and reject actions update review visibility on storefront. |
| Orders List | WORKS | `/admin/orders` renders full order table with status filtering, search by order number/customer/phone, and pagination. |
| Orders Detail | WORKS | `/admin/orders/[orderNumber]` displays line items, financial breakdown, customer details, and audit history. |
| Order Status Change | WORKS | Order transitions enforce state machine validation, version checks, and audit logging. |
| Customers List | WORKS | `/admin/customers` lists registered customer accounts, lifetime order counts, and aggregate spend. |
| Public-Site Content Editing | WORKS | `/admin/cms` allows super admin to update hero copy, announcements, FAQ questions, and section ordering with versioning. |
| Notification Bell | WORKS | Top bar notification bell dynamically tracks unread alerts with click-to-view and dismiss actions. |
| Customer /account Pages | WORKS | `/account` and `/account/orders/[id]` provide authenticated customer order tracking, addresses, and proof review. |
| Email Sending | BROKEN / FALLBACK | Optional Resend adapter checks `RESEND_API_KEY`; unconfigured keys degrade safely to console mock logs and WhatsApp links. |
