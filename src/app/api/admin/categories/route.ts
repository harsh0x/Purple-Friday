import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  listCategories,
  saveCategory,
  reorderCategory,
} from "@/server/categories/category-service";
import { IN_MEMORY_PRODUCTS } from "@/server/products/product-service";

export async function GET() {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const categories = await listCategories({ includeInactive: true });

  // Compute product counts for each category
  const categoriesWithCounts = categories.map((cat) => {
    let count = 0;
    for (const p of IN_MEMORY_PRODUCTS.values()) {
      if (p.categorySlug === cat.slug && !p.archived) {
        count += 1;
      }
    }
    // Divide by 2 because IN_MEMORY_PRODUCTS stores both id and slug
    return {
      ...cat,
      productCount: Math.round(count / 2),
    };
  });

  return NextResponse.json({ success: true, categories: categoriesWithCounts });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await saveCategory(body, {
      name: session?.name || "Admin",
      role: session?.role || "ADMIN",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, category: result.category });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { slug, direction } = body;
    if (!slug || (direction !== "up" && direction !== "down")) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: slug, direction ('up' | 'down')" },
        { status: 400 }
      );
    }

    const result = await reorderCategory(slug, direction, {
      name: session?.name || "Admin",
      role: session?.role || "ADMIN",
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reorder category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
