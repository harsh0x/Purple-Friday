import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { isStaffRole } from "@/lib/admin/permissions";
import { ARTWORK_STORE } from "@/server/artwork/artwork-ingestion";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ artworkId: string }> }
) {
  const { artworkId } = await context.params;
  const { searchParams } = new URL(req.url);
  const isPreview = searchParams.get("preview") === "true";

  // Permission check: Staff session required
  const session = await getAdminSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Access denied to private artwork store." }, { status: 403 });
  }

  const record = ARTWORK_STORE.get(artworkId);
  if (!record) {
    return NextResponse.json({ error: "Artwork file not found or expired." }, { status: 404 });
  }

  const targetPath = isPreview && record.previewFilePath ? record.previewFilePath : record.filePath;

  if (!fs.existsSync(targetPath)) {
    return NextResponse.json({ error: "Storage file missing from disk." }, { status: 404 });
  }

  const fileBytes = fs.readFileSync(targetPath);
  const contentType = isPreview ? "image/png" : record.mimeType;

  return new NextResponse(fileBytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": isPreview ? "inline" : `attachment; filename="${record.originalFilename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
