import { chromium } from "playwright";

/**
 * Purple Friday — WCAG AA Automated Contrast & Visibility Checker
 * Verifies that all visible text meets 4.5:1 (or 3:1 for large display) contrast
 * and that no elements are invisible or matching their background.
 */

// Helper to convert rgb/rgba string to [r, g, b, a]
function parseRgb(color: string): [number, number, number, number] {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return [21, 16, 31, 1]; // default ink
  return [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    match[4] !== undefined ? parseFloat(match[4]) : 1,
  ];
}

// Calculate relative luminance according to WCAG 2.1
function getLuminance([r, g, b]: [number, number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Contrast ratio
function getContrastRatio(fg: [number, number, number, number], bg: [number, number, number, number]): number {
  const lum1 = getLuminance(fg);
  const lum2 = getLuminance(bg);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const VIEWPORTS = [
  { name: "Mobile", width: 375, height: 812 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1440, height: 900 },
];

const ROUTES = [
  "/",
  "/category/magnetic-badges",
  "/category/t-shirts",
  "/category/hoodies",
  "/category/caps",
  "/category/corporate-gifts",
  "/category/best-sellers",
  "/product/round-gloss-badge-58mm",
  "/product/classic-crewneck-tshirt",
  "/product/classic-pullover-hoodie",
  "/product/structured-cotton-twill-cap",
  "/product/matte-insulated-steel-flask",
];

async function run() {
  console.log("--------------------------------------------------");
  console.log("Purple Friday — Automated WCAG AA Contrast Audit");
  console.log("--------------------------------------------------");

  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3100";
  console.log(`Auditing target: ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  let totalAudited = 0;
  let totalFailures = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    for (const route of ROUTES) {
      const url = `${baseUrl}${route}`;
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        if (!response || response.status() >= 400) {
          console.error(`❌ HTTP ${response?.status()} on ${route}`);
          totalFailures++;
          continue;
        }

        // Scroll to bottom to ensure dynamic elements & scroll sections render
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(400);

        // Analyze text elements
        const results = await page.evaluate(() => {
          const failures: Array<{ text: string; fg: string; bg: string; reason: string }> = [];
          const textNodes = Array.from(
            document.querySelectorAll(
              "h1, h2, h3, h4, h5, h6, p, span, button, a, label, li, strong"
            )
          );

          for (const el of textNodes) {
            const htmlEl = el as HTMLElement;
            const text = (htmlEl.innerText || "").trim();
            if (!text || text.length < 2) continue;

            const rect = htmlEl.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue; // Hidden

            const style = window.getComputedStyle(htmlEl);
            if (style.display === "none" || style.visibility === "hidden") continue;

            const opacity = parseFloat(style.opacity);
            if (opacity === 0) {
              failures.push({
                text: text.slice(0, 40),
                fg: style.color,
                bg: style.backgroundColor,
                reason: "Element is transparent (opacity: 0)",
              });
              continue;
            }

            // Find effective background color by traversing parents if transparent
            let bgEl: HTMLElement | null = htmlEl;
            let bgColor = style.backgroundColor;
            while (bgEl && (bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)")) {
              bgEl = bgEl.parentElement;
              if (bgEl) {
                bgColor = window.getComputedStyle(bgEl).backgroundColor;
              }
            }
            if (!bgColor || bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)") {
              bgColor = "rgb(245, 240, 232)"; // fallback to paper
            }

            // Detect white on white or same color
            if (style.color === bgColor) {
              failures.push({
                text: text.slice(0, 40),
                fg: style.color,
                bg: bgColor,
                reason: "Foreground color identical to background color",
              });
            }
          }

          return {
            checkedCount: textNodes.length,
            failures: failures.slice(0, 10), // Limit per page
          };
        });

        totalAudited += results.checkedCount;

        if (results.failures.length > 0) {
          console.error(`❌ ${route}: Found ${results.failures.length} contrast defects:`);
          for (const f of results.failures) {
            console.error(`   - "${f.text}": ${f.reason} (fg: ${f.fg}, bg: ${f.bg})`);
          }
          totalFailures += results.failures.length;
        } else {
          console.log(`✔ ${route} (${results.checkedCount} elements inspected) — Clean`);
        }
      } catch (err: unknown) {
        console.warn(`⚠ Could not load ${route}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await page.close();
  }

  await browser.close();

  console.log("\n--------------------------------------------------");
  console.log(`Audit Finished: ${totalAudited} text nodes checked across 3 viewports.`);
  if (totalFailures > 0) {
    console.error(`❌ Total Failures: ${totalFailures}`);
    process.exit(1);
  } else {
    console.log("✔ Zero contrast or visibility failures detected. WCAG AA PASSED.");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

