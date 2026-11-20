import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getAllQuotes, buildQuote, QuoteStatus } from "@/server/quotes/quotes-service";

  export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
      const user = session?.user as { role?: string } | undefined;

      if (
        !user ||
        (!hasPermission(user.role as never, "admin:view_orders") &&
          !hasPermission(user.role as never, "admin:manage_products"))
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const status = (searchParams.get("status") as QuoteStatus) || undefined;

      const quotes = await getAllQuotes(status);
      return NextResponse.json({ success: true, quotes });
    }

      export async function POST(req: NextRequest) {
        const session = await getServerSession(authOptions);
          const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

          if (
            !user ||
            (!hasPermission(user.role as never, "admin:view_orders") &&
              !hasPermission(user.role as never, "admin:manage_products"))
          ) {
            return NextResponse.json({ error: "Forbidden: Super Admin & Support only" }, { status: 403 });
          }

          try {
            const body = await req.json();
            const result = await buildQuote(body, {
              name: user.name || user.email || "Staff Operator",
              role: user.role || "SUPER_ADMIN",
            });

              if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 400 });
              }

              return NextResponse.json({ success: true, quote: result.quote });
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : "Failed to build quote";
              return NextResponse.json({ error: message }, { status: 500 });
            }
          }
