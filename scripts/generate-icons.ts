import sharp from "sharp";
import fs from "fs";
import path from "path";

async function generatePwaIcons() {
  const iconsDir = path.join(process.cwd(), "public", "icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svg512 = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="96" fill="#15101F"/>
    <rect x="24" y="24" width="464" height="464" rx="72" fill="#6A2CFF"/>
    
    <!-- Registration Marks -->
    <circle cx="256" cy="256" r="180" stroke="#D8FF3F" stroke-width="4" stroke-opacity="0.3" fill="none"/>
    <line x1="256" y1="40" x2="256" y2="472" stroke="#D8FF3F" stroke-width="2" stroke-opacity="0.2"/>
    <line x1="40" y1="256" x2="472" y2="256" stroke="#D8FF3F" stroke-width="2" stroke-opacity="0.2"/>
    
    <!-- PF Monogram -->
    <text x="256" y="320" font-family="system-ui, sans-serif" font-size="200" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-8">PF</text>
    
    <!-- Accent Dot -->
    <circle cx="390" cy="180" r="18" fill="#D8FF3F"/>
  </svg>
  `;

  const svgMaskable = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#15101F"/>
    <circle cx="256" cy="256" r="190" fill="#6A2CFF"/>
    <text x="256" y="315" font-family="system-ui, sans-serif" font-size="180" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-6">PF</text>
    <circle cx="370" cy="190" r="16" fill="#D8FF3F"/>
  </svg>
  `;

  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));

  await sharp(Buffer.from(svg512))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));

  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "maskable-512.png"));

  console.log("PWA Icons generated successfully in public/icons/");
}

generatePwaIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});

