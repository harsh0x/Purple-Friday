import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

// Read .env.local if present in non-production
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
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

parseEnvFile(path.resolve(process.cwd(), ".env.local"));

const prisma = new PrismaClient();

async function seedProductionAdmin() {
  console.log("--------------------------------------------------");
  console.log("Purple Friday — Production Admin Seeding Protocol");
  console.log("--------------------------------------------------");

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || "";

  if (!adminEmail || !adminEmail.includes("@")) {
    console.error("❌ FATAL: ADMIN_EMAIL is missing or invalid in environment.");
    process.exit(1);
  }

  if (!rawPassword || rawPassword.length < 8) {
    console.error("❌ FATAL: ADMIN_INITIAL_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && rawPassword === "ChangeThisPasswordInProduction123!") {
    console.warn("⚠️ WARNING: ADMIN_INITIAL_PASSWORD is using the default placeholder. Please update it immediately.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("sample-project") || databaseUrl.includes("user:password")) {
    console.error("❌ FATAL: DATABASE_URL is not configured with live PostgreSQL connection.");
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        active: true,
        mustChangePassword: true,
      },
      create: {
        email: adminEmail,
        name: "Purple Friday Super Admin",
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        active: true,
        mustChangePassword: true,
      },
    });

    // Enforce single admin invariant: deactivate any other existing admin users
    const otherAdmins = await prisma.user.updateMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        email: { not: adminEmail },
      },
      data: {
        active: false,
      },
    });

    console.log(`✅ Production Admin verified: ${admin.email}`);
    if (otherAdmins.count > 0) {
      console.log(`ℹ️ Enforced single admin invariant: deactivated ${otherAdmins.count} obsolete admin accounts.`);
    }
  } catch (err) {
    console.error("❌ Failed to seed production admin:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedProductionAdmin();
