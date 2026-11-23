import fs from "fs";
import path from "path";

const rootDir = path.resolve(process.cwd(), "src");
let hasMismatch = false;

function getExactCaseName(dir: string, base: string): string | null {
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry.toLowerCase() === base.toLowerCase()) {
        return entry;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function verifyPathCasing(fullPath: string, importString: string, sourceFile: string) {
  // Split into segments and verify from src/ down
  const relativeFromRoot = path.relative(process.cwd(), fullPath);
  const segments = relativeFromRoot.split(path.sep);

  let currentDir = process.cwd();
  for (const seg of segments) {
    const exact = getExactCaseName(currentDir, seg);
    if (!exact) {
      // Could be an extension mismatch or virtual
      return;
    }
    if (exact !== seg) {
      console.error(
        `❌ Case mismatch in ${path.relative(process.cwd(), sourceFile)}:\n` +
        `   Import: "${importString}"\n` +
        `   Path segment expected "${exact}" but got "${seg}"`
      );
      hasMismatch = true;
      return;
    }
    currentDir = path.join(currentDir, exact);
  }
}

function resolveImportPath(importStr: string, sourceFile: string): string | null {
  let candidateBase: string;

  if (importStr.startsWith("@/")) {
    candidateBase = path.join(rootDir, importStr.slice(2));
  } else if (importStr.startsWith("./") || importStr.startsWith("../")) {
    candidateBase = path.resolve(path.dirname(sourceFile), importStr);
  } else {
    // External package
    return null;
  }

  // Check possible extensions
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
  for (const ext of extensions) {
    const testPath = candidateBase + ext;
    if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
      return testPath;
    }
  }

  return null;
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  // Match import ... from '...' or import '...' or export ... from '...'
  const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    const importStr = match[1];
    const resolved = resolveImportPath(importStr, filePath);
    if (resolved) {
      verifyPathCasing(resolved, importStr, filePath);
    }
  }
}

function scanDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      checkFile(full);
    }
  }
}

console.log("Checking import path casing against filesystem (Linux compatibility)...");
scanDir(rootDir);

if (hasMismatch) {
  console.error("❌ Found import casing mismatches that will fail on Linux/Vercel.");
  process.exit(1);
} else {
  console.log("✅ All import casings match filesystem exactly.");
}
