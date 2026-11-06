# Purple Friday — Engineering Rules, Design Bible & Security Protocols

This document is the single source of truth for the development, architecture, aesthetic guidelines, and security requirements of **Purple Friday**, a production-grade e-commerce platform for custom-printed merchandise in India.

---

## 1. HOW TO WORK (Engineering Protocols)

1. **Autonomous Execution**:
   - Work completely autonomously without stopping for arbitrary questions.
   - If an environment secret is missing (e.g. Neon PostgreSQL, Cloudinary, Razorpay, Resend, Turnstile, Upstash), implement a resilient, graceful server/client fallback, log clear warnings without crashing the application, and document the missing key.
2. **Strict Verification After Every Step**:
   - After *every* numbered step, execute:
     - `npm run typecheck` (`tsc --noEmit`)
     - `npm run lint` (`next lint`)
     - `npm run build` (`next build`)
     - `npm test` (`vitest run`)
   - Fix all errors and warnings before proceeding to the subsequent step.
   - Zero tolerance for `TODO`, `FIXME`, temporary placeholders, `lorem ipsum`, or commented-out dead code.
3. **Fixed Stack Integrity**:
   - Use only the established stack:
     - **Framework**: Next.js 15.x App Router, React 19, TypeScript strict mode (`@/*` alias).
     - **Styling**: Tailwind CSS 3.4 with custom print-shop color palette and design tokens.
     - **Primitives**: Radix UI (Dialog, Accordion, Tabs, Tooltip, Popover, Slider, Checkbox, Select).
     - **Carousel**: Embla Carousel React with Autoplay plugin.
     - **Animation**: Motion (Framer Motion successor) for component states; GSAP + ScrollTrigger for scroll sequences; Lenis for smooth scrolling.
     - **State Management**: Zustand with persistent storage (`persist` middleware) for cart, wishlist, and drawer states.
     - **Validation & Forms**: Zod v4, React Hook Form with `@hookform/resolvers/zod`.
     - **Feedback**: Sonner toasts.
     - **Icons**: Lucide React.
     - **Database**: Prisma ORM with PostgreSQL (Neon serverless).
     - **Observability**: Pino structured logger with sensitive data redaction.
     - **Image Processing**: Sharp for server-side rasterization and image optimization.
     - **Testing**: Vitest for unit and pricing mathematics verification.
     - **Typography**: Self-hosted `next/font/local` font families:
       - *Display / Headings*: Bricolage Grotesque
       - *Body*: Instrument Sans
       - *Monospace / Pricing / Specs*: DM Mono
4. **Git Discipline**:
   - Commit cleanly to git after completing each step with an informative, conventional commit message.
5. **Documentation Discipline**:
   - Maintain `docs/PROGRESS.md` with active logs of completed tasks, created files, and open integration items.

---

## 2. DESIGN BIBLE

### Brand Aesthetic: The Editorial Print-Shop
Purple Friday feels like an authentic artisan offset-print atelier. Visual cues reference physical print processes: offset-press proofs, halftone dot screens, CMYK/spot-color registration marks, paper tooth, and risograph spot inks. It deliberately rejects generic "AI SaaS" templates (no purple-to-blue gradients, no frosted glassmorphism, no glowing blurred blobs, and no emoji icons).

### Color Palette & Tokens
- **Ink** (`#15101F`): Deep, pigment-dense carbon ink with a subtle violet undertone. Used for typography, high-contrast borders, dark section backgrounds, and tactile drop shadows.
- **Paper** (`#F5F0E8`): Warm, unbleached cotton-rag paper off-white. The universal background token.
- **Violet** (`#6A2CFF`): Saturated electric violet spot color. Primary brand accent and interactive stamp fill.
- **Lilac** (`#CDB8FF`): Soft lavender tint used for badges, subtle borders, and selection states.
- **Spot-Lime** (`#D8FF3F`): High-vis fluorescent risograph lime. **Strictly limited to a maximum of one prominent appearance per viewport** (e.g. quantity discount nudges or urgent badges).
- **Ink Greys**:
  - `ink-50`: `#F8F6FA`
  - `ink-100`: `#ECE7F2`
  - `ink-200`: `#DDD4E6`
  - `ink-300`: `#BEB0CF`
  - `ink-500`: `#816F98`
  - `ink-700`: `#483A5A`
  - `ink-900`: `#221A31`

### Typography Hierarchy & Scale
- **Display Headings**: Bricolage Grotesque with tight negative tracking (`-0.03em`), optical sizing, and fluid scale via `clamp()`.
- **Body & Editorial Copy**: Instrument Sans, high legibility, neutral grotesque balance.
- **Price, Specs, Codes & Labels**: DM Mono for all tabular figures, INR currency amounts, tier quantity ranges, and production specs.

### Textures & Motifs
- **Halftone Screens**: CSS/SVG procedural dot grids (`4px` spacing) used as subtle card backdrops or section dividers.
- **Registration Marks**: Circular target and crosshair crop-mark SVG icons (`⊕`) placed at hero corners, cards, and modal frames as a recurring brand motif.
- **Paper Grain**: Lightweight SVG noise filter applied to dark footers and editorial banners.

### Shape Language
- Deliberate juxtaposition of crisp, industrial right-angle corners (`rounded-none` or `rounded-sm`) paired with dramatic architectural radii (`rounded-2xl` or pill `rounded-full` for chips).
- Cards must never all look like identical rounded-2xl white boxes.

### Button Taxonomy (6 Distinct Interactive Roles)
1. **Primary "Stamp" Button**:
   - Solid electric violet (`#6A2CFF`), crisp white text, bold mono/sans font.
   - Hard `4px` offset ink shadow (`box-shadow: 4px 4px 0px #15101F`).
   - Active click state translates `+2px, +2px` with shadow collapsing to `2px 2px 0px`.
2. **Secondary Link Button**:
   - Crisp ink text with an interactive horizontal sweep underline that flows from left to right on hover.
3. **Magnetic Icon Button**:
   - Circular container (`rounded-full`), border in ink, subtle magnetic pull toward mouse cursor on desktop viewport.
4. **Design CTA ("Customize in Studio")**:
   - Solid carbon ink background with a high-energy violet fill wipe animating from left-to-right across the button on hover.
5. **Quantity Nudge Chip ("Make it 10 for ₹185/pc")**:
   - Spot-lime pill (`bg-spot-lime text-ink`) with an odometer-style rolling digit animation highlighting price savings.
6. **Ghost Filter Button**:
   - Clean 1px border in `ink-200`, transparent background, dark ink hover fill.
- *Accessibility Standard*: All buttons require minimum 44×44px touch targets and high-contrast `:focus-visible` double-ring outlines.

### Tone of Voice & Copywriting
- Written in authentic, articulate Indian English for corporate procurement officers, startup founders, college committees, and gifting managers.
- Rupee formatting adheres strictly to Indian numbering system (`₹1,500`, `₹45,200`, `₹2,50,000`).
- Banned cliches: "Unlock the power", "Elevate your brand", "Seamless experience", "Revolutionize merchandise".
- Preferred phrases: "Press-ready proofs", "Free sample visual approval before print", "Direct-to-garment & spot screen printing", "Delivering across all India PIN codes".

### Motion Guidelines
- Animate **strictly `transform` and `opacity`** properties to safeguard 60fps GPU acceleration.
- Standard duration: `200ms` to `450ms` using editorial deceleration curve `cubic-bezier(0.22, 1, 0.36, 1)`.
- Full respect for `@media (prefers-reduced-motion: reduce)`: smooth scrolling (Lenis) and parallax GSAP triggers are disabled, falling back to immediate discrete state changes.
- Zero cumulative layout shift (CLS); images and mockups reserve explicit aspect-ratios.

---

## 3. SECURITY RULES

1. **Server-Side Pricing Authority**:
   - The client browser is fundamentally untrusted. Price, tier discounts, GST calculations, bulk rate adjustments, coupon values, and shipping surcharges are computed exclusively in `src/lib/pricing.ts` on the server.
2. **Exhaustive Zod Schema Validation**:
   - Every incoming HTTP payload (JSON body, URL parameters, query strings, headers) is validated through strict Zod schemas with `strip` or `strict` settings to discard unknown fields.
3. **Route Hardening & Origin Verification**:
   - All mutating API routes (`POST`, `PUT`, `PATCH`, `DELETE`) enforce:
     - Origin header validation matching `NEXT_PUBLIC_SITE_URL`.
     - `Content-Type: application/json` enforcement (except multipart uploads).
     - Sliding-window rate limiting.
4. **Safe Error Handling & Pino Auditing**:
   - Never leak database stack traces, file paths, or internal exceptions in HTTP responses.
   - Central API wrapper generates a UUID `requestId`, logs sanitized technical details via Pino, and returns structured client errors (`{ error: string, requestId: string }`).
5. **Strict Environment Variable Guard**:
   - `src/env.ts` parses and validates all runtime environment variables at application startup using Zod. Sensitive keys never leak into client-side bundles.
6. **Hardened Cookie Policy**:
   - Auth and session cookies enforce `httpOnly: true`, `secure: true` (in production), and `sameSite: "lax"`.
7. **Cross-Site Scripting (XSS) Prevention**:
   - Forbid `dangerouslySetInnerHTML`. The singular exception is schema.org JSON-LD scripts, where stringified JSON has all `<` characters escaped to `\u003c`.
8. **Safe User Content Handling**:
   - Customer logos and text are rendered as clean SVG or text nodes. Blog and FAQ markdown is rendered via standard safe markdown parsers with raw HTML disabled.
9. **Invariable Server Authorization & IDOR Protection**:
   - Every read and update operation verifies entity ownership and session roles on the server. Hidden UI elements are never treated as a security boundary.
10. **SQL Injection Immunization**:
    - All relational queries must execute through parameterized Prisma ORM queries. Raw string interpolation in queries is strictly prohibited.

