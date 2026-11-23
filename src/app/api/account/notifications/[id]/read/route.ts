import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/admin/notifications";
import { isSameOrigin } from "@/lib/security/origin";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  await markNotificationAsRead(id);

  return NextResponse.json({
    success: true,
    message: "Notification marked as read.",
  });
}
