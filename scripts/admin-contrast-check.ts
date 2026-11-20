/**
 * Purple Friday Admin Dashboard — WCAG AA Token & Surface Contrast Verifier
 * Validates that all admin UI token pairs satisfy WCAG AA requirements
 * (minimum 4.5:1 for body/normal text, 3:1 for large headings & icons).
 */

interface ColorToken {
  name: string;
  hex: string;
}

interface PairCheck {
  surface: string;
  background: ColorToken;
  foreground: ColorToken;
  context: string;
  isLargeTextOrIcon?: boolean;
}

// Convert 6-digit hex to [r, g, b] normalized to 0-1
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Relative luminance per WCAG 2.1
function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contrast ratio
function getContrast(bgHex: string, fgHex: string): number {
  const lum1 = getLuminance(bgHex);
  const lum2 = getLuminance(fgHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const INK: ColorToken = { name: "Ink (#15101F)", hex: "#15101F" };
const PAPER: ColorToken = { name: "Paper (#F5F0E8)", hex: "#F5F0E8" };
const WHITE: ColorToken = { name: "Card White (#FFFFFF)", hex: "#FFFFFF" };
const VIOLET: ColorToken = { name: "Violet (#6A2CFF)", hex: "#6A2CFF" };
const LILAC: ColorToken = { name: "Lilac (#CDB8FF)", hex: "#CDB8FF" };
const SPOT_LIME: ColorToken = { name: "Spot Lime (#D8FF3F)", hex: "#D8FF3F" };
const INK_MUTED: ColorToken = { name: "Muted Ink (#483A5A)", hex: "#483A5A" };
const INK_LIGHT: ColorToken = { name: "Light Lilac Text (#DDD4E6)", hex: "#DDD4E6" };
const EMERALD_DARK: ColorToken = { name: "Emerald 800 (#065F46)", hex: "#065F46" };
const EMERALD_BG: ColorToken = { name: "Emerald 50 (#ECFDF5)", hex: "#ECFDF5" };
const ROSE_DARK: ColorToken = { name: "Rose 800 (#9F1239)", hex: "#9F1239" };
const ROSE_BG: ColorToken = { name: "Rose 50 (#FFF1F2)", hex: "#FFF1F2" };

const ADMIN_TOKEN_PAIRS: PairCheck[] = [
  // Sidebar (Frosted Ink Glass #15101F)
  {
    surface: "Sidebar / Topbar",
    background: INK,
    foreground: { name: "White Text", hex: "#FFFFFF" },
    context: "Headings & Brand Title",
  },
  {
    surface: "Sidebar / Topbar",
    background: INK,
    foreground: INK_LIGHT,
    context: "Navigation item labels & Mono captions",
  },
  {
    surface: "Sidebar / Topbar",
    background: INK,
    foreground: LILAC,
    context: "Sidebar Section labels & active icons",
  },
  {
    surface: "Sidebar / Topbar",
    background: INK,
    foreground: SPOT_LIME,
    context: "SLA Percentage indicator & Pulse badge",
  },
  {
    surface: "Sidebar Active Pill",
    background: VIOLET,
    foreground: { name: "White Text", hex: "#FFFFFF" },
    context: "Active navigation item text",
  },

  // Main Workspace Paper Surface (#F5F0E8)
  {
    surface: "Main Content Paper",
    background: PAPER,
    foreground: INK,
    context: "Greeting Heading & Main text",
  },
  {
    surface: "Main Content Paper",
    background: PAPER,
    foreground: INK_MUTED,
    context: "Date string & Sub-captions",
  },
  {
    surface: "Main Content Paper",
    background: PAPER,
    foreground: VIOLET,
    context: "Link buttons & Active accents",
  },

  // White Card Surface (#FFFFFF)
  {
    surface: "White KPI / Table Cards",
    background: WHITE,
    foreground: INK,
    context: "Table rows, KPI numbers, Form labels",
  },
  {
    surface: "White KPI / Table Cards",
    background: WHITE,
    foreground: INK_MUTED,
    context: "Helper text & table header labels",
  },
  {
    surface: "White KPI / Table Cards",
    background: WHITE,
    foreground: VIOLET,
    context: "Action buttons & table links",
  },

  // Spot Lime Primary Button Accent
  {
    surface: "Spot Lime Button / Pill",
    background: SPOT_LIME,
    foreground: INK,
    context: "Primary button label & High-contrast badge",
  },

  // Status Badges
  {
    surface: "Success Status Pill",
    background: EMERALD_BG,
    foreground: EMERALD_DARK,
    context: "Active / Configured badge",
  },
  {
    surface: "Error / Warning Pill",
    background: ROSE_BG,
    foreground: ROSE_DARK,
    context: "Deactivated / Error notice",
  },
];

function runAdminContrastCheck() {
  console.log("--------------------------------------------------");
  console.log("Purple Friday — Admin Dashboard WCAG AA Contrast Audit");
  console.log("--------------------------------------------------");

  let passCount = 0;
  let failCount = 0;

  for (const pair of ADMIN_TOKEN_PAIRS) {
    const ratio = getContrast(pair.background.hex, pair.foreground.hex);
    const threshold = pair.isLargeTextOrIcon ? 3.0 : 4.5;
    const passes = ratio >= threshold;

    const formattedRatio = ratio.toFixed(2) + ":1";

    if (passes) {
      passCount++;
      console.log(
        `✔ [PASS] ${pair.surface.padEnd(24)} | ${formattedRatio.padEnd(8)} (min ${threshold}:1) | ${pair.context}`
      );
    } else {
      failCount++;
      console.error(
        `❌ [FAIL] ${pair.surface.padEnd(24)} | ${formattedRatio.padEnd(8)} (min ${threshold}:1) | ${pair.context}`
      );
      console.error(`       BG: ${pair.background.name} vs FG: ${pair.foreground.name}`);
    }
  }

  console.log("--------------------------------------------------");
  console.log(`Results: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) {
    console.error("❌ Contrast check FAILED. One or more pairs violate WCAG AA.");
    process.exit(1);
  } else {
    console.log("✔ ALL admin surfaces and token pairs pass WCAG AA contrast.");
    process.exit(0);
  }
}

runAdminContrastCheck();
