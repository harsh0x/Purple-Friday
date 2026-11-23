import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

function parseEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

parseEnvFile(path.resolve(process.cwd(), ".env.local"));

async function runDevCustomerSeed() {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: Dev customer seed is strictly forbidden in production!");
    process.exit(1);
  }

  const email = (process.env.DEV_TEST_EMAIL || "seo.harsh9351@gmail.com").toLowerCase().trim();
  const phone = process.env.DEV_TEST_PHONE || "7014980906";
  const password = process.env.DEV_TEST_PASSWORD || "DevCustPass2026!"; // 16-character password

  const passwordHash = await bcrypt.hash(password, 12);

  // Record credentials in local dev storage for ROUTES-AND-LOGINS.txt generator
  const credsDir = path.resolve(process.cwd(), ".dev-cache");
  if (!fs.existsSync(credsDir)) {
    fs.mkdirSync(credsDir, { recursive: true });
  }

  const credsFile = path.join(credsDir, "dev-customer.json");
  fs.writeFileSync(
    credsFile,
    JSON.stringify({
      email,
      phone,
      password,
      passwordHash,
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
    }, null, 2)
  );

  console.log("--------------------------------------------------");
  console.log("Dev Customer Seeded Successfully!");
  console.log(`Email:    ${email}`);
  console.log(`Phone:    ${phone}`);
  console.log(`Password: ${password}`);
  console.log("--------------------------------------------------");
}

runDevCustomerSeed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
