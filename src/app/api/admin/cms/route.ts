import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
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
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const [draft, published, versions] = await Promise.all([
      getDraftCms(),
      getPublishedCms(),
      getCmsVersionHistory(),
    ]);

    const previewToken = createCmsPreviewToken(session.name);

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
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, content, versionId, note } = body;

    const actor = { name: session.name, role: session.role };

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
