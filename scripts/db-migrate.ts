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
  } catch (error) {
    console.warn("[db:migrate] Could not connect to remote database. Fallback active:", error);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

