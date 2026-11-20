import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getProductByIdOrSlug } from "@/server/products/product-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (!user || !hasPermission(user.role as never, "admin:manage_products")) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { slug } = await params;
  const result = await getProductByIdOrSlug(slug);

  if (!result.product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    product: result.product,
    redirectedFrom: result.redirectedFrom,
  });
}
