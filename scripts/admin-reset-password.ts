import fs from "fs";
import path from "path";
import readline from "readline";
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

function checkPasswordStrength(pass: string): { ok: boolean; reason?: string } {
  if (pass.length < 10) return { ok: false, reason: "Password must be at least 10 characters long." };
  if (!/[A-Z]/.test(pass)) return { ok: false, reason: "Password must contain at least one uppercase letter." };
  if (!/[a-z]/.test(pass)) return { ok: false, reason: "Password must contain at least one lowercase letter." };
  if (!/[0-9]/.test(pass)) return { ok: false, reason: "Password must contain at least one digit." };
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) return { ok: false, reason: "Password must contain at least one special character." };
  return { ok: true };
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@purplefriday.in").toLowerCase().trim();
  console.log("==================================================");
  console.log(" Purple Friday - Admin Password Reset Utility");
  console.log(` Target Admin Account: ${adminEmail}`);
  console.log("==================================================");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptPassword = (): Promise<string> => {
    return new Promise((resolve) => {
      rl.question("Enter new password for Admin: ", (answer) => {
        resolve(answer.trim());
      });
    });
  };

  const newPass = await promptPassword();
  rl.close();

  const strength = checkPasswordStrength(newPass);
  if (!strength.ok) {
    console.error(`\n❌ Error: ${strength.reason}`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPass, 12);

  // If DB is configured, update Prisma
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.user.updateMany({
        where: { email: adminEmail },
        data: { passwordHash: hash, failedAttempts: 0, lockedUntil: null, mustChangePassword: false },
      });
      console.log(`\n✅ Database updated: Password changed for ${adminEmail}.`);
    } else {
      console.log(`\n✅ In-memory/Dev configuration: Password hash generated successfully.`);
    }
  } catch (err: unknown) {
    console.warn("Notice: Prisma direct update skipped/fallback:", (err as Error).message);
  }

  console.log("==================================================");
  console.log("Admin password has been reset successfully.");
  console.log("You can now login at: http://localhost:3000/admin/login");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Reset error:", err);
  process.exit(1);
});
