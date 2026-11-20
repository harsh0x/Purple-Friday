import fs from "fs";
import path from "path";
import sharp from "sharp";

const sourceDir = path.resolve(process.cwd(), "source-photos");
const publicProductsDir = path.resolve(process.cwd(), "public/products");

if (!fs.existsSync(publicProductsDir)) {
  fs.mkdirSync(publicProductsDir, { recursive: true });
}

// Slugs of all 24 catalogue products
const PRODUCT_SLUGS = [
  "round-gloss-badge-58mm",
  "matte-rectangle-name-badge",
  "metallic-gold-lapel-badge",
  "clear-acrylic-conference-badge",
  "classic-crewneck-tshirt",
  "heavyweight-oversized-tee",
  "sports-performance-tee",
  "premium-organic-cotton-tee",
  "executive-pique-polo",
  "contrast-tipped-polo",
  "drifit-team-polo",
  "heavyweight-uniform-polo",
  "classic-pullover-hoodie",
  "metal-zipper-fleece-jacket",
  "minimalist-crewneck-sweatshirt",
  "varsity-raglan-hoodie",
  "structured-cotton-twill-cap",
  "trucker-mesh-snapback-cap",
  "unstructured-dad-hat",
  "performance-running-visor",
  "executive-brass-twist-pen",
  "hardbound-leather-journal-a5",
  "matte-insulated-steel-flask",
  "steel-engraved-keychain",
];

// Helper to create transparent product mask and optimized WebP sizes
async function processView(sourceFilePath, outputDir, viewPrefix) {
  if (!fs.existsSync(sourceFilePath)) {
    console.warn(`File not found: ${sourceFilePath}`);
    return;
  }

  // 1. Conform to 1600x1600 square on transparent canvas
  const baseImg = sharp(sourceFilePath).resize(1600, 1600, {
    fit: "contain",
    background: { r: 245, g: 243, b: 239, alpha: 1 },
  });

  const baseBuffer = await baseImg.toBuffer();

  // 2. Generate 1600px gallery WebP (clean, metadata stripped, < 250 KB)
  const fullWebpPath = path.join(outputDir, `${viewPrefix}.webp`);
  await sharp(baseBuffer)
    .webp({ quality: 82, effort: 4 })
    .toFile(fullWebpPath);

  // 3. Generate 800px card WebP (< 80 KB)
  const cardWebpPath = path.join(outputDir, `${viewPrefix === "front" ? "card" : viewPrefix + "-card"}.webp`);
  await sharp(baseBuffer)
    .resize(800, 800)
    .webp({ quality: 80, effort: 4 })
    .toFile(cardWebpPath);

  // 4. Generate 320px thumbnail WebP (< 25 KB)
  const thumbWebpPath = path.join(outputDir, `${viewPrefix === "front" ? "thumb" : viewPrefix + "-thumb"}.webp`);
  await sharp(baseBuffer)
    .resize(320, 320)
    .webp({ quality: 78, effort: 3 })
    .toFile(thumbWebpPath);

  // 5. Generate high-precision alpha product mask
  // Extract pixels to isolate foreground product from neutral background (#F5F3EF / #E8E8E8)
  const { data, info } = await sharp(baseBuffer).raw().toBuffer({ resolveWithObject: true });
  const maskData = Buffer.alloc(info.width * info.height);

  // Sample corner background color average
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelIndex = i / info.channels;

    // Distance from background tone
    const dist = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));
    
    // Smooth transition threshold
    if (dist > 18) {
      maskData[pixelIndex] = 255;
    } else if (dist > 8) {
      maskData[pixelIndex] = Math.round(((dist - 8) / 10) * 255);
    } else {
      maskData[pixelIndex] = 0;
    }
  }

  const maskPath = path.join(outputDir, `mask-${viewPrefix}.png`);
  await sharp(maskData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 1,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(maskPath);

  const fullSize = (fs.statSync(fullWebpPath).size / 1024).toFixed(1);
  const cardSize = (fs.statSync(cardWebpPath).size / 1024).toFixed(1);
  console.log(`  ✓ ${viewPrefix}: gallery=${fullSize}KB, card=${cardSize}KB, mask generated`);
}

async function run() {
  console.log("Preparing responsive WebP assets and alpha masks for all products...");

  for (const slug of PRODUCT_SLUGS) {
    const productDir = path.join(publicProductsDir, slug);
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    console.log(`Processing product: ${slug}`);

    // Process front view
    const frontSource = path.join(sourceDir, `${slug}-front.jpg`);
    if (fs.existsSync(frontSource)) {
      await processView(frontSource, productDir, "front");
    } else {
      console.warn(`Missing front source for ${slug}`);
    }

    // Process back view if exists
    const backSource = path.join(sourceDir, `${slug}-back.jpg`);
    if (fs.existsSync(backSource)) {
      await processView(backSource, productDir, "back");
    }
  }

  console.log("Asset preparation complete!");
}

run().catch(console.error);

