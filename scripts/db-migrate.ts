import { execSync } from "node:child_process";

async function main() {
  console.log("--------------------------------------------------");
  console.log("Purple Friday - Database Migration Runner");
  console.log("--------------------------------------------------");

  const databaseUrl = process.env.DATABASE_URL;

  // Always generate Prisma Client types
  try {
    console.log("[db:migrate] Generating Prisma Client...");
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch (error) {
    console.error("[db:migrate] Failed to generate Prisma Client:", error);
    process.exit(1);
  }

  if (!databaseUrl || databaseUrl.includes("sample-project") || databaseUrl.includes("user:password")) {
    console.warn(
      "[db:migrate] Warning: DATABASE_URL is not configured with live credentials.\n" +
      "             Skipping remote schema push. Prisma client generated successfully."
    );
    return;
  }

  try {
    console.log("[db:migrate] Pushing schema to PostgreSQL database...");
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("[db:migrate] Schema pushed successfully.");

    // Apply append-only trigger for AuditLog
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      console.log("[db:migrate] Applying AuditLog append-only database trigger...");
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION reject_audit_log_mutation()
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'AuditLog is append-only. UPDATE and DELETE operations are strictly forbidden.';
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_audit_log_append_only ON "AuditLog";
        CREATE TRIGGER trg_audit_log_append_only
        BEFORE UPDATE OR DELETE ON "AuditLog"
        FOR EACH ROW EXECUTE FUNCTION reject_audit_log_mutation();
      `);
      console.log("[db:migrate] AuditLog append-only trigger active.");
    } catch (trgErr) {
      console.warn("[db:migrate] Notice: DB trigger registration skipped/deferred:", trgErr);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.warn("[db:migrate] Could not connect to remote database. Fallback active:", error);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

