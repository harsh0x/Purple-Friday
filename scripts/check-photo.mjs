import fs from "fs";
import path from "path";
import sharp from "sharp";

const sourceDir = path.resolve(process.cwd(), "source-photos");

if (!fs.existsSync(sourceDir)) {
  console.error("source-photos directory not found at:", sourceDir);
  process.exit(1);
}

const files = fs.readdirSync(sourceDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

if (files.length === 0) {
  console.log("No images found in:", sourceDir);
  process.exit(0);
}

console.log(`Found ${files.length} images in ${sourceDir}:`);

for (const file of files) {
  const filePath = path.join(sourceDir, file);
  try {
    const meta = await sharp(filePath).metadata();
    console.log(`- ${file}: ${meta.width}x${meta.height} (${meta.format}, ${meta.channels}ch, ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`- Error reading ${file}:`, err.message);
  }
}

console.log("Photo check completed.");
process.exit(0);

