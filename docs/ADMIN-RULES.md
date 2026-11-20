# Admin Dashboard Rules & Technical Specification

> Project: Purple Friday (Custom-Print & Corporate Gifting E-Commerce Platform for India)
> Scope: Admin Dashboard (All 6 Parts)
> Authority: Mandatory engineering guidelines and constraints. All parts read and follow this file.

---

## 1. How to Work (Strict Operational Rules)

1. **Step 0 First**: Read the whole project. Maintain `docs/ADMIN-ARCHITECTURE.md` with framework, versions, folder structure, storage patterns for products, orders, users, cart, existing auth, statuses, libraries, and design tokens. Never guess; read the code. Fix only what blocks this work.
2. **Build ONLY What Each Part Lists**: No extra pages, no demo or marketing content, no "coming soon" pages, no unrequested features. A sidebar link appears **only** when its page is finished (use one navigation registry file that each part adds to).
3. **Continuous Verification**: After EVERY step run typecheck, lint, build and tests, and fix everything before continuing. Commit after each step with a clear message. Keep `docs/ADMIN-PROGRESS.md` updated (steps done, files created, open issues).
4. **Smallest Correct Code**: If something works in one line, keep it in one line. Reuse existing components, utilities, and tokens; extend them. No duplicate logic, no unused code, no long comment blocks, no TODO or placeholder text. Do not rename or delete working files.
5. **No Incompatible or Unneeded Dependencies**: Prefer what is already installed. Only add a new npm library if truly needed and compatible with Next.js 15 and React 19 (check peer dependencies first). Never invent APIs: read installed package types/docs before using one.
6. **Data Integrity & Conventions**: Database changes only through migrations that never delete existing data. Seed scripts are idempotent (safe to run twice). Money is stored as integer paise, never floats. Dates are stored in UTC and shown in India time (`Asia/Kolkata`).
7. **Real Integrations & Degradation**: Outside integrations (WhatsApp, couriers, payment links) require external keys. Build each behind a small adapter with an environment check. When keys are missing, the UI shows a clear "Not configured" state and the action is disabled. Never fake a success and never hard-code a secret.

---

## 2. Security Rules

- **Server-Side Enforcement**: Every admin page, server action, and API route checks the session and the exact permission on the **SERVER**. Hidden buttons or client-side guards are not security.
- **Strict Input Validation**: Validate all input with Zod and reject unknown fields (`.strict()`). Rate limit login, uploads, exports, and any public token link. Check Origin on mutating requests. Generic error messages to the browser; details go to the server log without personal data or secrets.
- **Secret Management**: Secrets exist only in server environment variables, validated at startup (fail fast). Nothing secret in the client bundle.
- **File Upload Security**: Detect the real type from the file's bytes (magic bytes via `file-type`), enforce size limits, generate random cryptographically secure filenames, and never serve a user file with a guessable path or an executable MIME type. SVG files are strictly sanitised with DOMPurify before rendering or storage.
- **Cookie & Session Hygiene**: Admin cookies are `httpOnly`, `secure` in production, `sameSite: "lax"`. Admin pages are marked `noindex, nofollow`, never cached, and excluded from sitemap and robots.txt.
- **Concurrent Edits (Optimistic Locking)**: Every editable record has an integer `version`; an update must include the version it read and fails with a friendly `"Someone else changed this, refresh"` message if the version changed in the database.
- **CSV Formula Injection Mitigation**: Prefix any cell that starts with `=`, `+`, `-`, or `@` with an apostrophe (`'`) to block spreadsheet formula injection attacks.

---

## 3. Design Specification (Purple Friday Admin Look)

Layout translated from the approved reference:
- **Layout Architecture**:
  - Floating rounded sidebar on the left.
  - Floating top bar with a wide search field and small round icon buttons.
  - Large rounded content panel.
  - Greeting line with formatted India date, `"N things need your attention"`, and quick action buttons on the right.
  - Big chart card with a segmented time control (7 days, 30 days, 90 days) next to a donut chart card with a legend.
  - Grid of rounded KPI tiles below charts.
  - Progress meter at the bottom of the sidebar (`"Dispatch SLA today"`).
- **Purple Friday Translation & Palette**:
  - **Ink**: `#15101F`
  - **Paper**: `#F5F0E8`
  - **Violet**: `#6A2CFF`
  - **Lilac**: `#CDB8FF`
  - **Spot Lime**: `#D8FF3F` (rare accent, status, or single primary highlight).
  - Neutral greys tinted toward violet. Success, warning, and danger colours are muted and always paired with an icon or text so colour is never the only signal.
- **Sidebar**:
  - Frosted ink glass (`backdrop-blur-md`, 1px border `rgba(255,255,255,0.1)`).
  - Grouped sections with small uppercase DM Mono labels.
  - Active item shown as a violet pill.
  - Small count badges (e.g. pending approvals) updating live.
  - Bottom meter: `"Dispatch SLA today"`.
  - Responsive: On tablets and mobile phones, sidebar slides out as an accessible modal drawer.
- **Top Bar**:
  - Global search field opening a command palette (`Ctrl+K` or `Cmd+K`) to jump to orders, customers, products, and pages.
  - Notifications bell with live unread count badge and dropdown.
  - Quick-action menu.
  - User menu displaying name, active role, and secure logout.
- **Content Panel**:
  - Soft paper surface over a subtle violet mesh background (`#F5F0E8`).
  - Cards: Solid or lightly translucent paper (backdrop blur reserved for sidebar and top bar for high render performance). 1px borders, soft shadow, border radius 16px to 24px (`rounded-2xl` to `rounded-3xl`).
  - Typography: DM Mono for numbers, codes, and badges; Bricolage Grotesque for headings; Instrument Sans for body text.
- **Accessibility & Contrast**:
  - Hard rule: All text meets WCAG AA (4.5:1 normal text, 3:1 for large text and interactive icons) against its actual rendered background.
  - Explicit foreground and background token pairs. Never pale text on pale glass.
- **Motion & Micro-interactions**:
  - Transform and opacity transitions only (200ms to 400ms).
  - Staggered card entrance (40ms steps).
  - Smooth page transitions and number count-up on KPI tiles.
  - Skeletons match each component's real dimensions to eliminate layout shift (CLS = 0).
  - Full respect for `prefers-reduced-motion`. Content must remain visible even if animation fails or is disabled.
- **Data Tables**:
  - Sticky header, column sorting, filters with URL query persistence.
  - Row selection with floating bulk-action bar.
  - Server-driven pagination, CSV export with injection prevention, empty states, and loading skeletons.
  - Responsive: Tables gracefully collapse into stacked card lists on mobile viewports.
- **Performance & Isolation**:
  - Code-split admin bundle with its own dedicated layout.
  - **Never** loads storefront smooth-scroll (Lenis), GSAP scroll triggers, or customer storefront providers.
- **Data Visualizations**:
  - Small clean SVG implementations for Area, Bar, and Donut charts designed specifically for high performance, zero layout shift, and exact theme matching.

---

## 4. Roles Matrix & Permissions

All permissions are code constants, strictly verified on the server:

| Role | Permitted Actions | Prohibited / Restricted Actions | Home Screen |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Everything: orders, catalogue, production, team & roles, prices & margins, financials, integrations, settings, audit log. | None. Full platform governance. | Overview (`/admin`) |
| **`GRAPHIC_DESIGNER`** | Artwork files, customer mockups & proofs, design approval queue, proof comments, asset inspection. | Cannot view or modify prices, profit margins, customer financial/payment data, team roles, or system settings. | Design Approval Queue (`/admin/designs` or `/admin/orders` proof tab) |
| **`FACTORY_MANAGER`** | Production queue, job sheets, quality control (QC), packing slips, dispatch management, tracking assignment. | Cannot view or modify product prices, profit margins, or customer payment details. | Production Queue (`/admin/orders` production view) |
| **`SUPPORT_AGENT`** | Order lookup (read-only), tracking inquiries, cancellations & partial refunds within defined limits, customer tickets, reviews moderation. | Cannot edit product base prices, create/change staff roles, or modify system settings. | Open Tickets & Orders Needing Action (`/admin/orders`) |

### Permission Constants:
- `admin:view_overview`
- `admin:manage_team`
- `admin:view_audit`
- `admin:manage_settings`
- `admin:manage_integrations`
- `admin:manage_products`
- `admin:manage_pricing`
- `admin:view_orders`
- `admin:manage_orders`
- `admin:manage_proofs`
- `admin:manage_production`
- `admin:manage_dispatch`
- `admin:moderate_reviews`
- `admin:manage_quotes`
- `admin:manage_coupons`
