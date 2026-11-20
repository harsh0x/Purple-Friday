import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import {
  getAdminProducts,
  saveProduct,
  archiveOrDeleteProduct,
} from "@/server/products/product-service";

  export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
      const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

      if (!user || !hasPermission(user.role as never, "admin:manage_products")) {
        return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || undefined;
      const category = searchParams.get("category") || undefined;
      const audience = searchParams.get("audience") || undefined;
      const includeArchived = searchParams.get("includeArchived") === "true";

      const products = await getAdminProducts({
        search,
        category,
        audience,
        includeArchived,
      });

      return NextResponse.json({ success: true, products });
    }

      export async function POST(req: NextRequest) {
        const session = await getServerSession(authOptions);
          const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

          if (!user || !hasPermission(user.role as never, "admin:manage_products")) {
            return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
          }

          try {
            const body = await req.json();
            const result = await saveProduct(body, {
              name: user.name || user.email || "Super Admin",
              role: user.role || "SUPER_ADMIN",
            });

              if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 400 });
              }

              return NextResponse.json({ success: true, product: result.product });
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Failed to save product";
              return NextResponse.json({ error: message }, { status: 500 });
            }
          }

          export async function DELETE(req: NextRequest) {
            const session = await getServerSession(authOptions);
            const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

              if (!user || !hasPermission(user.role as never, "admin:manage_products")) {
                return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
              }

              try {
                const { searchParams } = new URL(req.url);
                const id = searchParams.get("id");
                if (!id) {
                  return NextResponse.json({ error: "Product id required" }, { status: 400 });
                }

                  const result = await archiveOrDeleteProduct(id, {
                    name: user.name || user.email || "Super Admin",
                    role: user.role || "SUPER_ADMIN",
                  });

                  return NextResponse.json(result);
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : "Failed to remove product";
                  return NextResponse.json({ error: message }, { status: 500 });
                }
              }
