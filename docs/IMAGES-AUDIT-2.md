# Purple Friday — Studio Photography & Logo-Isolation Audit 2.0

**Audit Date**: 2026-11-11  
**Project**: Purple Friday (`c:\Users\seoha\Desktop\Purple firday customization\purple-friday`)  
**Scope**: Elimination of global logo leaking, complete replacement of rejected repeated stock photos with authentic Purple Friday editorial studio photography, and isolation of visitor logo projection strictly to HeroSection and CustomizerStudio.

---

## 1. Baseline Quality Gate Results

| Check | Command | Exit Code | Output Summary |
| :--- | :--- | :--- | :--- |
| **TypeScript Typecheck** | `npm run typecheck` | `0` | Clean, 0 errors (`tsc --noEmit`) |
| **ESLint** | `npm run lint` | `0` | Clean, 0 warnings or errors (`next lint`) |
| **Unit & Integration Tests** | `npm test` | `0` | 14 test files, 101 tests passed (`vitest run`) |
| **Next.js Production Build** | `npm run build` | `0` | 63 / 63 routes rendered and optimized cleanly |

---

## 2. Root Cause of "Logo-Everywhere" Bug

When a visitor drops a logo into `HeroSection.tsx`, it executes:
```ts
// src/components/home/HeroSection.tsx
setLogoUrl(dataUrl);
```
which persists the logo to browser `sessionStorage` under key `pf-customer-logo` and dispatches `CustomEvent("pf-logo-updated")`.

### Leak Locations:
1. **`src/components/mockup/ProductMockup.tsx` (Lines 231–233)**:
   ```ts
   // Sync with global customer logo store
   const { logoUrl: sessionLogo } = useCustomerLogo();
   const effectiveLogo =
     logoUrl !== undefined ? logoUrl || null : sessionLogo || null;
   ```
   **Defect**: Because `logoUrl` was omitted on all standard cards, `ProductMockup` automatically fell back to `sessionLogo`. Every component using `ProductMockup` (cards, bento tiles, drawers) immediately rendered the uploaded customer logo across the entire site.
2. **`src/components/product/ProductGallery.tsx` (Lines 24–26)**:
   ```ts
   const { logoUrl: sessionLogo } = useCustomerLogo();
   const effectiveLogo = logoUrl !== undefined ? logoUrl : sessionLogo;
   ```
   **Defect**: Product pages were also listening to `useCustomerLogo()`, pasting the visitor's logo over the catalogue product gallery.

### Required Architecture:
- `ProductMockup` must **NEVER** subscribe to `useCustomerLogo()` or read global `sessionLogo` by default.
- If `logoUrl` is not explicitly passed as a prop, `effectiveLogo` is strictly `null`.
- **Only** `HeroSection.tsx` (the 10-second live logo preview) and `CustomizerStudio.tsx` (the interactive design studio at `/design/[slug]`) may read `useCustomerLogo()`.
- Every other component (`ProductCard`, `PosterCard`, `ProductGallery`, `CategoryBentoGrid`, `QuickViewSheet`, `CartDrawer`, `WishlistDrawer`, `SearchDrawer`, `MegaMenu`) receives `logoUrl={null}` or uses static WebP images.

---

## 3. Inventory of Components Rendering Product Images

| Component / Page | Location | Current Renderer | Prop / Source | Fixed Target State |
| :--- | :--- | :--- | :--- | :--- |
| **Hero 10-Sec Live Preview** | `src/components/home/HeroSection.tsx` | `ProductMockup` (6 tiles) | Reads `useCustomerLogo()` | **KEEP**: Only place visitor logo appears |
| **Customizer Studio** | `src/components/customizer/CustomizerStudio.tsx` | Konva 2D Canvas | Reads `useCustomerLogo()` | **KEEP**: Dedicated interactive design tool |
| **Best Sellers Carousel** | `src/components/product/PosterCard.tsx` | `ProductMockup` | `slug={product.slug}` | **STATIC**: Dedicated studio shot with fixed "YOUR LOGO HERE" |
| **Category Bento Grid** | `src/components/home/CategoryBentoGrid.tsx` | `ProductMockup` (5 tiles) | Hardcoded slugs | **STATIC**: 5 dedicated editorial department tile shots |
| **Catalogue & Grid Cards** | `src/components/product/ProductCard.tsx` | `ProductMockup` | `slug={product.slug}` | **STATIC**: Dedicated product card image with hover rear view |
| **Product Detail Gallery** | `src/components/product/ProductGallery.tsx` | `ProductMockup` | `sessionLogo` | **STATIC**: Dedicated multi-angle shots + real colour swatches |
| **Quick View Bottom Sheet** | `src/components/product/QuickViewSheet.tsx` | `ProductMockup` | `slug={product.slug}` | **STATIC**: Shows product card static image |
| **Cart Drawer & Page** | `CartDrawer.tsx` & `/cart/page.tsx` | `ProductMockup` | `template={item.template}` | **STATIC**: WebP thumbnail (or custom proof PNG if designed) |
| **Wishlist Drawer & Page** | `WishlistDrawer.tsx` & `/wishlist/page.tsx` | `ProductMockup` | `slug={item.slug}` | **STATIC**: WebP thumbnail |
| **Search Drawer** | `src/components/drawers/SearchDrawer.tsx` | `ProductMockup` | `slug={hit.slug}` | **STATIC**: WebP thumbnail |
| **Header Mega Menu** | `src/components/layout/MegaMenu.tsx` | `ProductMockup` | `slug={featured.slug}` | **STATIC**: WebP card image |
| **Dev Calibrator** | `src/app/dev/print-areas/page.tsx` | `ProductMockup` | Sliders / dropdown | Dev tool (returns 404 in production) |

---

## 4. Audit of Current Images & Reasons for Rejection

| Product / Tile Slug | Current Image Asset | Visual Defects Observed in Screenshots | Action |
| :--- | :--- | :--- | :--- |
| `minimalist-crewneck-sweatshirt` | `source-photos/minimalist-crewneck-sweatshirt-front.jpg` | White sweater on wooden table with dried flowers; not Purple Friday aesthetic; repeated | **REPLACE** |
| `varsity-raglan-hoodie` | `source-photos/varsity-raglan-hoodie-front.jpg` | Reused the exact same white sweater image as above; lacks hood; not two-tone varsity | **REPLACE** |
| `structured-cotton-twill-cap` | `source-photos/structured-cotton-twill-cap-front.jpg` | Blurry, featureless white blob on light background; lack of stitching/profile definition | **REPLACE** |
| `trucker-mesh-snapback-cap` | `source-photos/trucker-mesh-snapback-cap-front.jpg` | Indistinct mesh; poor angle; looks identical to twill cap | **REPLACE** |
| `matte-insulated-steel-flask` | `source-photos/matte-insulated-steel-flask-front.jpg` | Green squat cosmetic jar; not an executive steel beverage flask | **REPLACE** |
| `Category: Caps & Headwear` | Reused `structured-cotton-twill-cap` | Blurry white cap tile | **REPLACE** with 5-cap rainbow arc shot |
| `Category: Hoodies & Sweats` | Reused `classic-pullover-hoodie` | Reused single product | **REPLACE** with hoodie group/lifestyle shot |
| `Category: Corporate Gifts` | Reused `matte-insulated-steel-flask` | Green cosmetic jar | **REPLACE** with curated merchandise gift box flatlay |
| `Category: T-Shirts` | Reused `classic-crewneck-tshirt` | Single t-shirt | **REPLACE** with 3 polos/tees on wooden rail |
| `Category: Magnetic Badges` | Reused `round-gloss-badge-58mm` | Single badge | **REPLACE** with badges on dark blazer lapel lifestyle |

---

## 5. Catalogue Data Architecture

- **Primary Source of Truth**: `src/lib/catalogue.ts` (`ALL_PRODUCTS` array containing 24 products across 6 categories).
- **Image Resolution Pattern**:
  - Main Front View: `/products/[slug]/front.webp` (1600px gallery), `card.webp` (800px card), `thumb.webp` (320px thumbnail)
  - Rear / Back View (Apparel): `/products/[slug]/back.webp`, `back-card.webp`, `back-thumb.webp`
  - Category Department Tiles: `/categories/[categorySlug]/tile.webp`
  - Hero Preview Blank Bases: `/hero-preview/[slug]-blank.webp`
  - Real Swatches: `/products/[slug]/colors/[colorSlug].webp`
- **Fixed Placeholder Artwork**:
  - As requested, all non-hero catalogue product photos will have a clean, authentic, crisp "YOUR LOGO HERE" typographic lockup embedded naturally into the garment or product weave/surface using Sharp compositing, so they look like sample catalogue products in an editorial print store.
