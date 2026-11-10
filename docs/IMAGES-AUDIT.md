# Purple Friday — Product Images & Mockup Architecture Audit

**Date**: 2026-11-10  
**Phase**: Step 0 Preflight & Baseline Audit  
**Objective**: Transition from flat SVG vector illustrations to studio-grade real product photography with live 2D canvas tinting, logo projection, and texture blending.

---

## 1. Framework & Stack Versions

| Package / Technology | Version | Role in Architecture |
| :--- | :--- | :--- |
| **Node.js** | `v24.19.0` | Runtime environment |
| **Next.js** | `15.1.7` (App Router) | React Server Components, Route Handlers, Turbopack/Webpack compiler |
| **React** | `19.0.0` | Client hydration, Hooks, Transitions |
| **TypeScript** | `5.x` (strict) | Static type safety across catalogue, pricing, and canvas math |
| **Tailwind CSS** | `3.4.1` | Print-shop design tokens (`ink`, `paper`, `violet`, `spot-lime`, `lilac`) |
| **Sharp** | `0.35.5` | Server-side image transformation, EXIF stripping, WebP/AVIF generation |
| **Prisma** | `6.4.1` | PostgreSQL database ORM & catalogue models |
| **Vitest** | `5.1.0` | Unit test suite for print-area bounds and pricing tiers |
| **Playwright** | `1.65.0` | E2E browser crawling, responsive verification, visual inspection |

---

## 2. Current Mockup & Illustration Components

The current rendering layer is pure client-side SVG vector illustrations:

- **Root Component**: `src/components/mockup/ProductMockup.tsx`
  - Accepts props: `template: MockupTemplateType | string`, `color?: string`, `logoUrl?: string | null`, `className?: string`, `view?: "front" | "back"`.
  - Normalizes template strings (`tee`, `polo`, `hoodie`, `cap`, `badge`, `pen`, `keychain`, `notebook`, `bottle`).
  - Fetches the active logo from `useCustomerLogo()` if `logoUrl` is not explicitly provided.
  - Renders category-specific vector template components.

- **Vector Template Subcomponents** (`src/components/mockup/templates/`):
  1. `TeeTemplate.tsx`: SVG vector outline with dynamic fill color, breast pocket print zone, and dashed `<rect>` guide. Supports `view="front"` and `view="back"`.
  2. `PoloTemplate.tsx`: Vector polo collar, placket, and ribbed cuffs with chest `<clipPath>`.
  3. `HoodieTemplate.tsx`: Drawstring hoodie vector with kangaroo pocket and chest print area.
  4. `CapTemplate.tsx`: 6-panel structured cap silhouette with front arch print zone.
  5. `RoundBadgeTemplate.tsx`: Radial gradient badge with metallic rim and 58mm circular print zone.
  6. `PenTemplate.tsx`: Stylized twist pen barrel with laser engraving zone.
  7. `NotebookTemplate.tsx`: Hardbound A5 journal cover with blind debossing frame.
  8. `BottleTemplate.tsx`: Insulated vacuum flask with curved wrap guide.
  9. `KeychainTemplate.tsx`: Rectangular steel fob on split key ring.

---

## 3. Comprehensive Invocation Map (Every Usage in Codebase)

`ProductMockup` is invoked across 13 core storefront touchpoints:

| Component / Route | File Location | Purpose & Props |
| :--- | :--- | :--- |
| **Home Hero 10-Second Preview** | `src/components/home/HeroSection.tsx` (L230) | 6 product preview tiles showing instant before/after logo projection |
| **Explore Department Tiles** | `src/components/home/CategoryBentoGrid.tsx` (L43, 77, 109, 139, 169) | 5 asymmetric bento tiles for Badges, Tees, Polos, Hoodies, Gifts |
| **Best Sellers Carousel** | `src/components/product/PosterCard.tsx` (L66) | Curated editorial product posters with 3D tilt hover effect |
| **Catalogue & Grid Cards** | `src/components/product/ProductCard.tsx` (L76) | Grid cards on category pages (`/category/[slug]`), related items, and search |
| **Product Detail Gallery** | `src/components/product/ProductGallery.tsx` (L86, 131, 187, 223) | Main display image, front/back switcher, thumbnail strip, lightbox zoom |
| **Quick View Sheet** | `src/components/product/QuickViewSheet.tsx` (L87) | Drawer preview when clicking quick-add from product grids |
| **Cart Slide-Over Drawer** | `src/components/drawers/CartDrawer.tsx` (L121) | Thumbnail of each configured item with chosen color and logo |
| **Wishlist Drawer** | `src/components/drawers/WishlistDrawer.tsx` (L75) | Saved merchandise specimen thumbnails |
| **Search Drawer** | `src/components/drawers/SearchDrawer.tsx` (L249, 358) | Live search result cards and curated search recommendations |
| **Cart Review Page** | `src/app/cart/page.tsx` (L187) | Item line rows displaying customized product thumbnails before checkout |
| **Wishlist Page** | `src/app/wishlist/page.tsx` (L104) | Full-page grid of favorited merchandise cards |
| **Header Navigation Mega Menu** | `src/components/layout/MegaMenu.tsx` (L129) | Category highlight card in dropdown menu |
| **Smart Image Fallback** | `src/components/ui/smart-image.tsx` (L43) | Fallback placeholder when external CDN image fails |

---

## 4. Logo Storage & Cross-Component Synchronization

- **Storage Location**: `sessionStorage` in the browser under key:
  ```ts
  const STORAGE_KEY = "pf-customer-logo";
  ```
- **Sync Mechanism**: Managed by `src/hooks/useCustomerLogo.ts`.
  - When a visitor uploads a logo (via Hero dropzone, Product Page upload, or Customizer Studio), `saveLogo(dataUrl)` writes to `sessionStorage`.
  - Immediately dispatches a window event:
    ```ts
    window.dispatchEvent(new CustomEvent<string | null>("pf-logo-updated", { detail: url }));
    ```
  - All mounted components (`HeroSection`, `ProductCard`, `ProductGallery`, `QuickViewSheet`, `Header`) re-render with the uploaded logo without page reloads or context overhead.
- **Persistence Across Routes**:
  - The logo follows the customer from `/` -> `/category/[slug]` -> `/product/[slug]` -> `/design/[slug]` -> `/cart` -> `/checkout`.
  - If no logo is uploaded, components render a crisp editorial demo placeholder `"YOUR LOGO HERE"`.

---

## 5. Product Data Shape & Taxonomy

Catalogue products are typed by `CatalogueProduct` in `src/lib/catalogue.ts` and backed by the Prisma `Product` schema:

```ts
export interface CatalogueProduct {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  categorySlug: string;
  description: string;
  badges: string[];
  specChips: string[];
  audience: "TEAM" | "GIFTING" | "BOTH";
  minQty: number;
  qtyStep: number;
  isBestSeller: boolean;
  mrp: number;
  basePrice: number;
  printMethod: string;
  template: string;
  rating: number;
  reviewCount: number;
  colors: Array<{ name: string; hex: string }>;
  priceTiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
  createdAt?: string;
}
```

### 24 Canonical Products Across 5 Departments:
1. **Magnetic Badges (4)**:
   - `round-gloss-badge-58mm` (58mm Round Gloss Magnetic Badge)
   - `matte-rectangle-name-badge` (70x25mm Brushed Aluminium Executive Badge)
   - `metallic-gold-lapel-badge` (30mm Die-Struck Metallic Lapel Pin)
   - `clear-acrylic-conference-badge` (85x54mm Clear Cast Acrylic Event Badge)
2. **T-Shirts (4)**:
   - `classic-crewneck-tshirt` (180 GSM Classic Crewneck Bio-Washed Tee)
   - `heavyweight-oversized-tee` (240 GSM Heavyweight Streetwear Oversized Tee)
   - `sports-performance-tee` (160 GSM Drifit Breathable Athletic Tee)
   - `premium-organic-cotton-tee` (200 GSM Certified GOTS Organic Cotton Tee)
3. **Polo Shirts (4)**:
   - `executive-pique-polo` (230 GSM Heavy Piqué Cotton Corporate Polo)
   - `contrast-tipped-polo` (220 GSM Contrast Rib Tipped Collar Polo)
   - `drifit-team-polo` (170 GSM Moisture-Wicking Team Polo)
   - `heavyweight-uniform-polo` (260 GSM Industrial Durability Piqué Polo)
4. **Hoodies & Sweatshirts (4)**:
   - `classic-pullover-hoodie` (320 GSM Brushed Fleece Pullover Hoodie)
   - `metal-zipper-fleece-jacket` (350 GSM Full-Zip High-Neck Fleece Jacket)
   - `minimalist-crewneck-sweatshirt` (300 GSM Heavy French Terry Sweatshirt)
   - `varsity-raglan-hoodie` (340 GSM Two-Tone Contrast Raglan Sleeve Hoodie)
5. **Caps & Headwear (4)**:
   - `structured-cotton-twill-cap` (6-Panel Heavy Twill Structured Cap)
   - `trucker-mesh-snapback-cap` (5-Panel Breathable Mesh Snapback Cap)
   - `unstructured-dad-hat` (Unstructured Washed Cotton Low-Profile Dad Hat)
   - `performance-running-visor` (Featherweight Laser-Perforated Sport Visor)
6. **Corporate Gifts (4)**:
   - `executive-brass-twist-pen` (Heavyweight Lacquered Brass Twist Ballpoint)
   - `hardbound-leather-journal-a5` (A5 Hardbound Vegan Leather Corporate Journal)
   - `matte-insulated-steel-flask` (750ml Vacuum Insulated Double-Wall Steel Bottle)
   - `steel-engraved-keychain` (Heavyweight Solid Stainless Steel Monogram Keychain)

---

## 6. Baseline Quality Gates Verification

- `npm run typecheck`: **0 errors** (Clean)
- `npm run lint`: **0 errors, 0 warnings** (Clean)
- `npm run build`: **62/62 static & dynamic routes compiled** (Clean)
- Vitest suite: **94/94 tests passing across 13 test files** (Clean)

---

## 7. Migration Plan to Real Photography

1. **Step 1: Photo Sourcing & Generation**
   - High-resolution (1600px+) neutral studio product photography for all 24 catalogue products.
   - Front view for all items; matching back view for apparel (T-shirts, polos, hoodies).
   - Uniform lighting, neutral grey/white seamless background, pure product silhouette without models or watermarks.
2. **Step 2: Asset Pipeline & Print Area Metadata**
   - Transparent alpha cut-out masks for accurate color tinting without background spill.
   - Optimized WebP outputs in 3 responsive widths (1600px gallery, 800px cards, 320px thumbnails).
   - Extension of catalogue data with `printArea` coordinates `(x, y, width, height, rotation)` and `surface` characteristics (`flat` vs `curved`).
   - Dev-only interactive tool at `/dev/print-areas` to calibrate print boundaries.
3. **Step 3: Canvas 2D Logo-on-Product Compositor**
   - High-performance 2D Canvas rendering engine with double-buffered offscreen cache.
   - Multiply & soft-light shading passes keeping authentic fabric weave, folds, and highlights.
   - Cosine strip warping for curved cylindrical surfaces (bottles, flasks, mugs, curved cap crowns).
   - Surface textures: Embroidery stitched edge, laser engrave inner shadow, blind emboss bevel.
   - Dynamic size-wise quantity picker and interactive zoom lens.
4. **Step 4: Full Storefront Integration**
   - Drop-in upgrade of `ProductMockup` so all 13 invocation locations automatically render studio photography.
