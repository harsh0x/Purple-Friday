import fs from "fs";
import path from "path";

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

function run() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to generate routes and logins in production.");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@purplefriday.in";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "ChangeThisPasswordInProduction123!";
  const devTestEmail = process.env.DEV_TEST_EMAIL || "seo.harsh9351@gmail.com";
  const devTestPhone = process.env.DEV_TEST_PHONE || "7014980906";

  // Check if dev customer seed cached password exists
  let devCustomerPassword = "DevCustPass2026!";
  const cachedDevCustFile = path.resolve(process.cwd(), ".dev-cache/dev-customer.json");
  if (fs.existsSync(cachedDevCustFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cachedDevCustFile, "utf-8"));
      if (data.password) devCustomerPassword = data.password;
    } catch { }
  }

  // Scan API routes
  const apiDir = path.resolve(process.cwd(), "src/app/api");
  const apiRoutes: string[] = [];

  function scanApi(dir: string, base: string = "/api") {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        scanApi(path.join(dir, ent.name), `${base}/${ent.name}`);
      } else if (ent.isFile() && (ent.name === "route.ts" || ent.name === "route.js")) {
        apiRoutes.push(base);
      }
    }
  }
  scanApi(apiDir);
  apiRoutes.sort();

  const content = `================================================================================
DEVELOPMENT FILE: never share, never commit, delete before handover
================================================================================
How to run: http://localhost:3000

PUBLIC ROUTES
--------------------------------------------------------------------------------
/                                            - Home storefront with dynamic hero, announcements & collections
/products                                    - Catalogue collection listing
/products/classic-crewneck-tee               - Product detail, size matrix & customizer (Example: classic-crewneck-tee)
/cart                                        - Interactive cart drawer & bag overview
/checkout                                    - Checkout with address validation & Cash on Delivery / Pay Later
/account                                     - Customer portal, order history & saved addresses
/account/orders/PF-2611-40891                - Customer order tracking & proof status (Example: PF-2611-40891)
/proof/24b_token_hash_preview                - Public digital merchandise proof approval (Example token)
/review/rev_token_hash_preview               - Public customer review submission screen (Example token)
/auth/login                                  - Customer account login & OTP sign-in

ADMIN ROUTES (Grouped like Sidebar)
--------------------------------------------------------------------------------
[STORE]
/admin                                       - Overview Command Centre (Greeting, 5 KPI Tiles, Net Revenue Chart, Category Donut, Needs Attention)
/admin/orders                                - Orders table, status filters, Awaiting Approval queue, CSV export
/admin/orders/[orderNumber]                  - Order detail (Example: /admin/orders/PF-2611-40891), proof link, balance settlement
/admin/products                              - Catalogue management, tier volume pricing matrix, MOQ
/admin/products/[slug]                       - Product edit/create suite (Example: /admin/products/classic-crewneck-tee)
/admin/reviews                               - Customer reviews moderation queue & approvals
/admin/customers                             - Registered customer accounts list & lifetime purchase metrics
/admin/coupons                               - Coupon campaign manager & discount redemption quotas
/admin/quotes                                - RFQ Quotes manager, PDF quote generation & payment links

[SYSTEM]
/admin/settings                              - Store entity settings, admin profile update, liquid glass sidebar mode
/admin/audit                                 - Immutable append-only audit trail
/admin/cms                                   - No-code storefront CMS (Hero, announcements, FAQs, footer, SEO)
/admin/login                                 - Dedicated full-screen admin login with lockout protection

API ROUTES
--------------------------------------------------------------------------------
${apiRoutes.map((r) => r).join("\n")}

LOGINS
--------------------------------------------------------------------------------
ADMIN LOGIN:
  URL:      http://localhost:3000/admin/login
  Email:    ${adminEmail}
  Password: ${adminPassword}
  Role:     ADMIN (Single Administrator)

DEMO TEST CUSTOMER:
  Command:  npm run seed:dev-customer
  Email:    ${devTestEmail}
  Phone:    ${devTestPhone}
  Password: ${devCustomerPassword}
  Role:     CUSTOMER
================================================================================
`;

  const outputPath = path.resolve(process.cwd(), "ROUTES-AND-LOGINS.txt");
  fs.writeFileSync(outputPath, content, "utf-8");
  console.log(`✅ ROUTES-AND-LOGINS.txt generated successfully at: ${outputPath}`);
}

run();
