import { seedAnalyticsDemoData } from "../src/server/analytics/demo-seed";

async function main() {
  console.log("🌱 [Analytics Demo] Generating realistic 400-order 12-month analytics dataset...");
  const result = await seedAnalyticsDemoData();
  console.log(`✅ [Analytics Demo] Successfully generated ${result.totalOrdersCreated} orders:`);
  console.log(`   - Sample orders (1-2 pcs): ${result.sampleOrdersCount}`);
  console.log(`   - Bulk orders (20-500 pcs): ${result.bulkOrdersCount}`);
  console.log(`   - Delivered orders: ${result.deliveredCount}`);
  console.log(`   - Intentional RTO orders: ${result.rtoCount}`);
  console.log(`   - Date range: ${result.dateRange.start} -> ${result.dateRange.end}`);
}

main().catch((err) => {
  console.error("❌ [Analytics Demo] Seed error:", err);
  process.exit(1);
});
