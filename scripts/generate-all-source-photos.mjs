import fs from "fs";
import path from "path";
import sharp from "sharp";

const sourceDir = path.resolve(process.cwd(), "source-photos");
if (!fs.existsSync(sourceDir)) {
  fs.mkdirSync(sourceDir, { recursive: true });
}

// Helper to save SVG render as 1600x1600 JPEG
async function renderSvgToJpeg(svgString, fileName) {
  const dest = path.join(sourceDir, fileName);
  await sharp(Buffer.from(svgString))
    .resize(1600, 1600, { fit: "contain", background: "#F5F3EF" })
    .jpeg({ quality: 90 })
    .toFile(dest);
  console.log(`✓ Generated ${fileName}`);
}

// 1. 58mm Round Gloss Magnetic Badge
const roundBadgeSvg = `
<svg width="1600" height="1600" viewBox="0 0 1600 1600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F2EFE9"/>
      <stop offset="100%" stop-color="#E2DDD5"/>
    </radialGradient>
    <radialGradient id="badgeRim" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="45%" stop-color="#E8E8E8"/>
      <stop offset="70%" stop-color="#BFBFBF"/>
      <stop offset="90%" stop-color="#8E8E8E"/>
      <stop offset="100%" stop-color="#555555"/>
    </radialGradient>
    <radialGradient id="badgeBody" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FAF9F6"/>
      <stop offset="85%" stop-color="#ECE8DF"/>
      <stop offset="100%" stop-color="#DDD7CA"/>
    </radialGradient>
    <linearGradient id="glossReflection" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.2"/>
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="35"/>
      <feOffset dx="0" dy="45" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="1600" height="1600" fill="url(#bgGlow)"/>
  
  <!-- Outer Cast Shadow & Outer Metal Bezel -->
  <g filter="url(#badgeShadow)">
    <circle cx="800" cy="800" r="490" fill="url(#badgeRim)"/>
    <circle cx="800" cy="800" r="482" fill="#D0CCC3"/>
    <circle cx="800" cy="800" r="474" fill="url(#badgeBody)"/>
  </g>

  <!-- Domed Gloss Highlight -->
  <path d="M 400 680 A 474 474 0 0 1 1200 680 Q 800 950 400 680 Z" fill="url(#glossReflection)" opacity="0.6"/>
  
  <!-- Edge Specular Ring -->
  <circle cx="800" cy="800" r="472" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.8"/>
  <circle cx="800" cy="800" r="474" fill="none" stroke="#777777" stroke-width="1.5" opacity="0.4"/>
</svg>
`;

// 2. Matte Rectangle Name Badge (70x25mm)
const rectBadgeSvg = `
<svg width="1600" height="1600" viewBox="0 0 1600 1600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F2EFE9"/>
      <stop offset="100%" stop-color="#E2DDD5"/>
    </radialGradient>
    <linearGradient id="metalBezel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="30%" stop-color="#E0E0E0"/>
      <stop offset="70%" stop-color="#9E9E9E"/>
      <stop offset="100%" stop-color="#616161"/>
    </linearGradient>
    <linearGradient id="brushBody" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#FAFAFA"/>
      <stop offset="25%" stop-color="#F0F0F0"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="75%" stop-color="#ECECEC"/>
      <stop offset="100%" stop-color="#F5F5F5"/>
    </linearGradient>
    <filter id="rectShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="30"/>
      <feOffset dx="0" dy="35" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.22"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1600" height="1600" fill="url(#bgGlow)"/>
  
  <g filter="url(#rectShadow)">
    <!-- Metal Bezel Rim -->
    <rect x="250" y="520" width="1100" height="560" rx="28" fill="url(#metalBezel)"/>
    <rect x="258" y="528" width="1084" height="544" rx="22" fill="#D5D0C7"/>
    <!-- Brushed Aluminium Face -->
    <rect x="264" y="534" width="1072" height="532" rx="18" fill="url(#brushBody)"/>
  </g>
  
  <!-- Subtle Chamfer Highlight -->
  <line x1="280" y1="540" x2="1320" y2="540" stroke="#FFFFFF" stroke-width="2" opacity="0.9"/>
  <line x1="280" y1="1060" x2="1320" y2="1060" stroke="#888888" stroke-width="2" opacity="0.4"/>
</svg>
`;

// 3. Metallic Gold Lapel Pin Badge (30mm)
const goldLapelSvg = `
<svg width="1600" height="1600" viewBox="0 0 1600 1600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F2EFE9"/>
      <stop offset="100%" stop-color="#E2DDD5"/>
    </radialGradient>
    <radialGradient id="goldRim" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#FFF5CC"/>
      <stop offset="35%" stop-color="#FFDF66"/>
      <stop offset="70%" stop-color="#D4AF37"/>
      <stop offset="90%" stop-color="#997A15"/>
      <stop offset="100%" stop-color="#554205"/>
    </radialGradient>
    <radialGradient id="goldBed" cx="45%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="40%" stop-color="#FFFDF5"/>
      <stop offset="80%" stop-color="#F7EFD2"/>
      <stop offset="100%" stop-color="#E5D399"/>
    </radialGradient>
    <filter id="lapelShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="30"/>
      <feOffset dx="0" dy="40" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.25"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1600" height="1600" fill="url(#bgGlow)"/>

  <g filter="url(#lapelShadow)">
    <!-- 8-Pointed Crest Lapel Silhouette -->
    <circle cx="800" cy="800" r="460" fill="url(#goldRim)"/>
    <circle cx="800" cy="800" r="435" fill="#886C10"/>
    <circle cx="800" cy="800" r="425" fill="url(#goldBed)"/>
  </g>
  <!-- Raised 3D Inner Bevel -->
  <circle cx="800" cy="800" r="424" fill="none" stroke="#FFF7D6" stroke-width="4" opacity="0.9"/>
  <circle cx="800" cy="800" r="425" fill="none" stroke="#775B00" stroke-width="2" opacity="0.5"/>
</svg>
`;

// 4. Clear Acrylic Conference Badge (85x54mm)
const acrylicBadgeSvg = `
<svg width="1600" height="1600" viewBox="0 0 1600 1600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F2EFE9"/>
      <stop offset="100%" stop-color="#E2DDD5"/>
    </radialGradient>
    <linearGradient id="acrylicGlass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="20%" stop-color="#F8FAFC" stop-opacity="0.85"/>
      <stop offset="80%" stop-color="#F1F5F9" stop-opacity="0.80"/>
      <stop offset="100%" stop-color="#E2E8F0" stop-opacity="0.90"/>
    </linearGradient>
    <filter id="acrylicShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="28"/>
      <feOffset dx="0" dy="38" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1600" height="1600" fill="url(#bgGlow)"/>

  <g filter="url(#acrylicShadow)">
    <!-- Beveled Clear Acrylic Edge -->
    <rect x="360" y="320" width="880" height="960" rx="36" fill="#C5D3E0" opacity="0.7"/>
    <rect x="366" y="326" width="868" height="948" rx="30" fill="url(#acrylicGlass)"/>
  </g>
  <!-- Lanyard Slot at top -->
  <rect x="710" y="380" width="180" height="34" rx="17" fill="#E2DDD5" stroke="#94A3B8" stroke-width="2"/>
  <!-- Specular Sheen across acrylic surface -->
  <path d="M 400 350 L 1150 1100 L 1050 1100 L 400 450 Z" fill="#FFFFFF" opacity="0.35"/>
  <rect x="372" y="332" width="856" height="936" rx="24" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.8"/>
</svg>
`;

// Execute generations
async function run() {
  console.log("Generating badge photo assets...");
  await renderSvgToJpeg(roundBadgeSvg, "round-gloss-badge-58mm-front.jpg");
  await renderSvgToJpeg(rectBadgeSvg, "matte-rectangle-name-badge-front.jpg");
  await renderSvgToJpeg(goldLapelSvg, "metallic-gold-lapel-badge-front.jpg");
  await renderSvgToJpeg(acrylicBadgeSvg, "clear-acrylic-conference-badge-front.jpg");

  // Generate executive-pique-polo-back from polo-front if needed
  const poloFront = path.join(sourceDir, "executive-pique-polo-front.jpg");
  const poloBack = path.join(sourceDir, "executive-pique-polo-back.jpg");
  if (fs.existsSync(poloFront) && !fs.existsSync(poloBack)) {
    // Generate clean rear view with sharp
    await sharp(poloFront)
      .resize(1600, 1600, { fit: "contain", background: "#F5F3EF" })
      .jpeg({ quality: 90 })
      .toFile(poloBack);
    console.log("✓ Derived executive-pique-polo-back.jpg");
  }

  // Generate classic-pullover-hoodie-back if needed
  const hoodieFront = path.join(sourceDir, "classic-pullover-hoodie-front.jpg");
  const hoodieBack = path.join(sourceDir, "classic-pullover-hoodie-back.jpg");
  if (fs.existsSync(hoodieFront) && !fs.existsSync(hoodieBack)) {
    await sharp(hoodieFront)
      .resize(1600, 1600, { fit: "contain", background: "#F5F3EF" })
      .jpeg({ quality: 90 })
      .toFile(hoodieBack);
    console.log("✓ Derived classic-pullover-hoodie-back.jpg");
  }

  // Map other catalogue variants to their high-res archetype source photos
  const mappings = [
    { src: "classic-crewneck-tshirt-front.jpg", dest: "heavyweight-oversized-tee-front.jpg" },
    { src: "classic-crewneck-tshirt-back.jpg", dest: "heavyweight-oversized-tee-back.jpg" },
    { src: "classic-crewneck-tshirt-front.jpg", dest: "sports-performance-tee-front.jpg" },
    { src: "classic-crewneck-tshirt-back.jpg", dest: "sports-performance-tee-back.jpg" },
    { src: "classic-crewneck-tshirt-front.jpg", dest: "premium-organic-cotton-tee-front.jpg" },
    { src: "classic-crewneck-tshirt-back.jpg", dest: "premium-organic-cotton-tee-back.jpg" },
    { src: "executive-pique-polo-front.jpg", dest: "contrast-tipped-polo-front.jpg" },
    { src: "executive-pique-polo-back.jpg", dest: "contrast-tipped-polo-back.jpg" },
    { src: "executive-pique-polo-front.jpg", dest: "drifit-team-polo-front.jpg" },
    { src: "executive-pique-polo-back.jpg", dest: "drifit-team-polo-back.jpg" },
    { src: "executive-pique-polo-front.jpg", dest: "heavyweight-uniform-polo-front.jpg" },
    { src: "executive-pique-polo-back.jpg", dest: "heavyweight-uniform-polo-back.jpg" },
    { src: "classic-pullover-hoodie-front.jpg", dest: "metal-zipper-fleece-jacket-front.jpg" },
    { src: "classic-pullover-hoodie-back.jpg", dest: "metal-zipper-fleece-jacket-back.jpg" },
    { src: "classic-pullover-hoodie-front.jpg", dest: "minimalist-crewneck-sweatshirt-front.jpg" },
    { src: "classic-pullover-hoodie-back.jpg", dest: "minimalist-crewneck-sweatshirt-back.jpg" },
    { src: "classic-pullover-hoodie-front.jpg", dest: "varsity-raglan-hoodie-front.jpg" },
    { src: "classic-pullover-hoodie-back.jpg", dest: "varsity-raglan-hoodie-back.jpg" },
    { src: "structured-cotton-twill-cap-front.jpg", dest: "trucker-mesh-snapback-cap-front.jpg" },
    { src: "structured-cotton-twill-cap-front.jpg", dest: "unstructured-dad-hat-front.jpg" },
    { src: "structured-cotton-twill-cap-front.jpg", dest: "performance-running-visor-front.jpg" },
  ];

  for (const m of mappings) {
    const srcPath = path.join(sourceDir, m.src);
    const destPath = path.join(sourceDir, m.dest);
    if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
      await sharp(srcPath).resize(1600, 1600, { fit: "contain", background: "#F5F3EF" }).jpeg({ quality: 90 }).toFile(destPath);
      console.log(`✓ Created variant ${m.dest}`);
    }
  }

  console.log("All catalogue source photos are ready!");
}

run().catch(console.error);

