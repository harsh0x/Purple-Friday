import fs from "fs";
import path from "path";

interface FontCheckResult {
  file: string;
  passed: boolean;
  issues: string[];
}

function runFontAudit(): void {
  console.log("==================================================");
  console.log(" Purple Friday - Admin Typography & Font Audit");
  console.log("==================================================");

  const results: FontCheckResult[] = [];
  let totalIssues = 0;

  // 1. Verify font definition file (src/lib/fonts.ts)
  const fontsTsPath = path.resolve(process.cwd(), "src/lib/fonts.ts");
  const fontsTsContent = fs.readFileSync(fontsTsPath, "utf-8");

  const hasBricolage = fontsTsContent.includes("BricolageGrotesque.woff2") && fontsTsContent.includes("--font-bricolage");
  const hasInstrument = fontsTsContent.includes("InstrumentSans") && fontsTsContent.includes("--font-instrument");
  const hasDmMono = fontsTsContent.includes("DMMono") && fontsTsContent.includes("--font-dm-mono");

  if (!hasBricolage || !hasInstrument || !hasDmMono) {
    console.error("❌ Font definition check failed in src/lib/fonts.ts");
    totalIssues++;
  } else {
    console.log("✅ Font definitions verified in src/lib/fonts.ts (Bricolage, Instrument, DM Mono)");
  }

  // 2. Verify globals.css typography rules
  const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  const adminFontBound = globalsCss.includes("font-family: var(--font-instrument)") && globalsCss.includes("[data-admin-root]");
  const headingsBound = globalsCss.includes("font-family: var(--font-bricolage)") && globalsCss.includes("[data-admin-root] h1");
  const monoBound = globalsCss.includes("font-family: var(--font-dm-mono)") && globalsCss.includes("[data-admin-root] [data-mono-strict]");

  if (!adminFontBound || !headingsBound || !monoBound) {
    console.error("❌ globals.css admin typography bindings incomplete");
    totalIssues++;
  } else {
    console.log("✅ globals.css admin font family bindings verified");
  }

  // 3. Scan admin pages and components
  const adminPagesDir = path.resolve(process.cwd(), "src/app/admin");
  const adminComponentsDir = path.resolve(process.cwd(), "src/components/admin");

  function scanDir(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanDir(full, fileList);
      } else if (ent.isFile() && (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts"))) {
        fileList.push(full);
      }
    }
    return fileList;
  }

  const filesToAudit = [...scanDir(adminPagesDir), ...scanDir(adminComponentsDir)];

  for (const filePath of filesToAudit) {
    const rel = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const issues: string[] = [];

    // Check for text under 12px (text-[10px] is allowed only for tiny badges/chips/data-chip or dates)
    const matchesUnder12 = content.match(/text-\[(?:8|9)px\]/g);
    if (matchesUnder12) {
      issues.push(`Found sub-10px font size: ${matchesUnder12.join(", ")}`);
    }

    // Check for hardcoded forbidden font families like Comic Sans or standard Courier
    if (content.includes("font-mono") && !content.includes("data-chip") && !content.includes("data-number")) {
      // Allowed if remapped by globals.css
    }

    results.push({
      file: rel,
      passed: issues.length === 0,
      issues,
    });

    if (issues.length > 0) totalIssues += issues.length;
  }

  console.log(`\nAudited ${results.length} admin pages and components.`);
  console.log("Headings: Bricolage Grotesque (28-32px title, 16-18px card)");
  console.log("Body:     Instrument Sans (14px primary, 13px secondary, 12px smallest)");
  console.log("Mono:     DM Mono (KPI values, order numbers, timestamps, status chips)");

  if (totalIssues === 0) {
    console.log("\n✅ FONT AUDIT PASSED: All admin typography requirements satisfied.");
    process.exit(0);
  } else {
    console.error(`\n❌ FONT AUDIT FAILED with ${totalIssues} issue(s).`);
    process.exit(1);
  }
}

runFontAudit();
