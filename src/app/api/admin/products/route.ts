import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  listProductsPaginated,
  saveProduct,
  duplicateProduct,
  bulkUpdateProductStatus,
  archiveOrDeleteProduct,
} from "@/server/products/product-service";

  export async function GET(req: NextRequest) {
    const session = await getAdminSession();
    try {
      requireAdmin(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const audience = searchParams.get("audience") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "true";

    const result = await listProductsPaginated({
      page,
      limit,
      search,
      category,
      audience,
      status,
      sort,
      includeArchived,
    });

    return NextResponse.json({ success: true, ...result });
  }

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

    const actor = {
      name: session?.name || "Admin",
      role: session?.role || "ADMIN",
    };

    try {
      const body = await req.json();

        // Action: Duplicate Product
        if (body.action === "duplicate" && body.id) {
          const result = await duplicateProduct(body.id, actor);
          if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
          }
          return NextResponse.json({ success: true, product: result.product });
        }

        // Action: Bulk Update Status
        if (body.action === "bulk_status" && Array.isArray(body.ids) && body.status) {
          const result = await bulkUpdateProductStatus(body.ids, body.status, actor);
          return NextResponse.json({ success: true, updatedCount: result.updatedCount });
        }

    // Default: Save Product
    const result = await saveProduct(body, actor);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, product: result.product });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

    export async function DELETE(req: NextRequest) {
      const session = await getAdminSession();
      try {
        requireAdmin(session);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Forbidden";
        return NextResponse.json({ error: msg }, { status: 403 });
      }

      try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
          return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

    const result = await archiveOrDeleteProduct(id, {
      name: session?.name || "Admin",
      role: session?.role || "ADMIN",
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
