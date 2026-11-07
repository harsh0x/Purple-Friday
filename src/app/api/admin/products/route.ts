import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserAdmin, validatePriceTiers } from "@/lib/admin/tier-validator";
import { getAdminProducts, updateAdminProduct } from "@/lib/admin/admin-store";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = getAdminProducts();
  return NextResponse.json({ success: true, products });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isUserAdmin(session?.user as { role?: string } | undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { slug, mrp, basePrice, minQty, qtyStep, active, priceTiers } = body;

    if (!slug) {
      return NextResponse.json({ error: "Product slug required" }, { status: 400 });
    }

    // Validate Price Tiers if provided
    if (priceTiers && Array.isArray(priceTiers)) {
      const validation = validatePriceTiers(priceTiers);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid price tiers", details: validation.errors },
          { status: 400 }
        );
      }
    }

    const updated = updateAdminProduct(slug, {
      ...(mrp !== undefined && { mrp: Number(mrp) }),
      ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
      ...(minQty !== undefined && { minQty: Number(minQty) }),
      ...(qtyStep !== undefined && { qtyStep: Number(qtyStep) }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(priceTiers && { priceTiers }),
    });

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await logAdminAction({
      adminId: (session?.user as { id?: string })?.id || "admin",
      adminEmail: session?.user?.email || "admin@purplefriday.com",
      action: "UPDATE_PRODUCT_TIERS",
      targetId: slug,
      details: { mrp, basePrice, minQty, active, tierCount: priceTiers?.length },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

