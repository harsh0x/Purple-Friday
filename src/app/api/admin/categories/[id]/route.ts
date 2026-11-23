import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  getCategoryByIdOrSlug,
  saveCategory,
  deleteCategory,
} from "@/server/categories/category-service";
import { IN_MEMORY_PRODUCTS } from "@/server/products/product-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { id } = await params;
  const { category, redirectedFrom } = await getCategoryByIdOrSlug(id);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, category, redirectedFrom });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const result = await saveCategory(
      { ...body, id },
      { name: session?.name || "Admin", role: session?.role || "ADMIN" }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, category: result.category });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { id } = await params;
  try {
    const result = await deleteCategory(
      id,
      { name: session?.name || "Admin", role: session?.role || "ADMIN" },
      (catSlug: string) => {
        let count = 0;
        for (const p of IN_MEMORY_PRODUCTS.values()) {
          if (p.categorySlug === catSlug && !p.archived) {
            count += 1;
          }
        }
        return Math.round(count / 2);
      }
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete category";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
