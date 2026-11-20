import { NextRequest, NextResponse } from "next/server";
import { getProductRecommendations, computeFrequentlyBoughtTogether, FBT_RECOMMENDATIONS_STORE } from "@/server/recommendations/fbt";
import { ORDER_STORE } from "@/server/orders/state-machine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ recommendations: [] });
  }

  // Ensure recommendations store is populated from orders if empty
  if (FBT_RECOMMENDATIONS_STORE.size === 0) {
    const orders = Array.from(ORDER_STORE.values());
    const computed = computeFrequentlyBoughtTogether(orders);
    for (const [k, v] of computed.entries()) {
      FBT_RECOMMENDATIONS_STORE.set(k, v);
    }
  }

  const recommendations = getProductRecommendations(productId);

  return NextResponse.json({
    productId,
    recommendations,
  });
}