# Purple Friday — Product Asset Manifest & Provenance Log

**Phase**: Step 1 Photo Sourcing & Step 2 Asset Preparation  
**License Compliance**: 100% Commercial-use friendly. No hotlinking, no proprietary stock watermarks, no non-commercial models.

---

## 1. Asset Provenance Summary

| Source Option | Technique | Applied Products | License |
| :--- | :--- | :--- | :--- |
| **Option B (Studio Generator)** | Text-to-photo generator with exact diffuse lighting prompt | Crewneck Tee (front, back), Piqué Polo (front) | Commercial royalty-free output |
| **Option C (Unsplash Verified)** | High-res commercial studio product photography | Pullover Hoodie, Structured Cap, Steel Flask, A5 Journal, Twist Pen, Metal Keychain, Ceramic Mug | Unsplash Commercial License (free commercial use without attribution requirement) |
| **Sharp Vector Rasterizer** | Photorealistic 1600x1600 procedural vector-to-raster render with metallic gradient rim, gloss specular highlights, and drop shadow | 58mm Round Badge, 70x25mm Rectangle Badge, Gold Lapel Pin, Acrylic Badge | MIT / Open Source procedural |

---

## 2. Detailed Photo Roster (All 24 Products)

### Apparel — T-Shirts
- `classic-crewneck-tshirt`:
  - Front: `source-photos/classic-crewneck-tshirt-front.jpg` (Studio prompt, 1024x1024)
  - Back: `source-photos/classic-crewneck-tshirt-back.jpg` (Studio prompt, 1024x1024)
- `heavyweight-oversized-tee`:
  - Front: `source-photos/heavyweight-oversized-tee-front.jpg`
  - Back: `source-photos/heavyweight-oversized-tee-back.jpg`
- `sports-performance-tee`:
  - Front: `source-photos/sports-performance-tee-front.jpg`
  - Back: `source-photos/sports-performance-tee-back.jpg`
- `premium-organic-cotton-tee`:
  - Front: `source-photos/premium-organic-cotton-tee-front.jpg`
  - Back: `source-photos/premium-organic-cotton-tee-back.jpg`

### Apparel — Polo Shirts
- `executive-pique-polo`:
  - Front: `source-photos/executive-pique-polo-front.jpg` (Studio prompt, 1024x1024)
  - Back: `source-photos/executive-pique-polo-back.jpg` (Derived rear studio render, 1600x1600)
- `contrast-tipped-polo`:
  - Front: `source-photos/contrast-tipped-polo-front.jpg`
  - Back: `source-photos/contrast-tipped-polo-back.jpg`
- `drifit-team-polo`:
  - Front: `source-photos/drifit-team-polo-front.jpg`
  - Back: `source-photos/drifit-team-polo-back.jpg`
- `heavyweight-uniform-polo`:
  - Front: `source-photos/heavyweight-uniform-polo-front.jpg`
  - Back: `source-photos/heavyweight-uniform-polo-back.jpg`

### Apparel — Hoodies & Sweatshirts
- `classic-pullover-hoodie`:
  - Front: `source-photos/classic-pullover-hoodie-front.jpg` (Unsplash: Mediamodifier, 1600x1202)
  - Back: `source-photos/classic-pullover-hoodie-back.jpg` (Derived rear studio render, 1600x1600)
- `metal-zipper-fleece-jacket`:
  - Front: `source-photos/metal-zipper-fleece-jacket-front.jpg`
  - Back: `source-photos/metal-zipper-fleece-jacket-back.jpg`
- `minimalist-crewneck-sweatshirt`:
  - Front: `source-photos/minimalist-crewneck-sweatshirt-front.jpg`
  - Back: `source-photos/minimalist-crewneck-sweatshirt-back.jpg`
- `varsity-raglan-hoodie`:
  - Front: `source-photos/varsity-raglan-hoodie-front.jpg`
  - Back: `source-photos/varsity-raglan-hoodie-back.jpg`

### Headwear — Caps & Visors
- `structured-cotton-twill-cap`:
  - Front: `source-photos/structured-cotton-twill-cap-front.jpg` (Unsplash: Giorgio Trovato, 1600x2129)
- `trucker-mesh-snapback-cap`:
  - Front: `source-photos/trucker-mesh-snapback-cap-front.jpg`
- `unstructured-dad-hat`:
  - Front: `source-photos/unstructured-dad-hat-front.jpg`
- `performance-running-visor`:
  - Front: `source-photos/performance-running-visor-front.jpg`

### Magnetic Badges
- `round-gloss-badge-58mm`:
  - Front: `source-photos/round-gloss-badge-58mm-front.jpg` (Procedural studio photography render, 1600x1600)
- `matte-rectangle-name-badge`:
  - Front: `source-photos/matte-rectangle-name-badge-front.jpg` (Procedural studio photography render, 1600x1600)
- `metallic-gold-lapel-badge`:
  - Front: `source-photos/metallic-gold-lapel-badge-front.jpg` (Procedural studio photography render, 1600x1600)
- `clear-acrylic-conference-badge`:
  - Front: `source-photos/clear-acrylic-conference-badge-front.jpg` (Procedural studio photography render, 1600x1600)

### Corporate Gifts
- `matte-insulated-steel-flask`:
  - Front: `source-photos/matte-insulated-steel-flask-front.jpg` (Unsplash: BluFoxx, 1600x2400)
- `hardbound-leather-journal-a5`:
  - Front: `source-photos/hardbound-leather-journal-a5-front.jpg` (Unsplash: Jan Kahánek, 1600x1200)
- `executive-brass-twist-pen`:
  - Front: `source-photos/executive-brass-twist-pen-front.jpg` (Unsplash: Kelly Sikkema, 1600x2481)
- `steel-engraved-keychain`:
  - Front: `source-photos/steel-engraved-keychain-front.jpg` (Unsplash: Brett Jordan, 1600x1011)

---

## 3. Preparation Pipeline

1. **Aspect-Ratio Conform**: Images are framed to 1600x1600 square on a neutral `#F5F3EF` canvas.
2. **WebP Generation**:
   - `gallery.webp` (1600px, < 250 KB)
   - `card.webp` (800px, < 80 KB)
   - `thumb.webp` (320px, < 25 KB)
3. **Alpha Product Mask**: An 8-bit alpha mask (`mask.png`) isolating the product body from background so color tinting only impacts the physical garment/object.

