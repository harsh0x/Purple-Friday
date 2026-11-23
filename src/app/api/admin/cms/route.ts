import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  getPublishedCms,
  getDraftCms,
  saveDraftCms,
  publishCms,
  restoreCmsVersion,
  getCmsVersionHistory,
  createCmsPreviewToken,
} from "@/server/cms/cms-service";

export async function GET() {
  const session = await getAdminSession();
    try {
      requireAdmin(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forbidden";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    try {
      const [draft, published, versions] = await Promise.all([
        getDraftCms(),
        getPublishedCms(),
        getCmsVersionHistory(),
      ]);

      const previewToken = createCmsPreviewToken(session?.name || "Admin");

      return NextResponse.json({
        success: true,
        draft,
        published,
        versions,
        previewToken,
        previewUrl: `/?previewToken=${previewToken}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load CMS data";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  export async function POST(req: NextRequest) {
    const session = await getAdminSession();
      try {
        requireAdmin(session);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Forbidden";
        return NextResponse.json({ error: msg }, { status: 403 });
      }

    // Origin verification
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        const isLocal =
          (originHost.includes("localhost") || originHost.includes("127.0.0.1")) &&
          (host.includes("localhost") || host.includes("127.0.0.1"));
        if (!isLocal && originHost !== host) {
          return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
      }
    }

    try {
      const body = await req.json();
      const { action, versionId, note } = body;
      const content = body.content || body.document;

        const actor = { name: session?.name || "Admin", role: session?.role || "ADMIN" };

        if (action === "save_draft") {
          const result = await saveDraftCms(content, actor);
          return NextResponse.json(result);
        }

        if (action === "publish") {
          const result = await publishCms(content, actor, note);
          return NextResponse.json(result);
        }

        if (action === "restore") {
          if (!versionId) {
            return NextResponse.json({ error: "Version ID required for restore" }, { status: 400 });
          }
          const result = await restoreCmsVersion(versionId, actor);
          return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "CMS action failed";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
