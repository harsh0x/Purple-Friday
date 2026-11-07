import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getUploadById } from "@/lib/uploads";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
  }

  // Look up metadata from in-memory registry or fallback to disk
  const upload = getUploadById(id);
  const storageDir = path.join(process.cwd(), "storage", "uploads");

  let filePath = upload?.storagePath;
  let mimeType = upload?.mimeType || "image/png";
  const isPrivate = upload?.isPrivate || false;

  if (!filePath || !fs.existsSync(filePath)) {
    // Attempt fallback to find {id}.png or {id}.pdf in storage directory
    const candidatePng = path.join(storageDir, `${id}.png`);
    const candidatePdf = path.join(storageDir, `${id}.pdf`);

    if (fs.existsSync(candidatePng)) {
      filePath = candidatePng;
      mimeType = "image/png";
    } else if (fs.existsSync(candidatePdf)) {
      filePath = candidatePdf;
      mimeType = "application/pdf";
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  // If private (e.g., PDF design briefs), ensure safety: never render inline
  if (isPrivate || mimeType === "application/pdf") {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${id}.pdf"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  }

  // Normal safe image delivery
  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

