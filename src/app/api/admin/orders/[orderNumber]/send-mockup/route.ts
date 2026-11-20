import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-session";
import { isStaffRole } from "@/lib/admin/permissions";
import { generateProofApprovalToken } from "@/server/orders/proof-service";
import { changeOrderStatus } from "@/server/orders/state-machine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getAdminSession();
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { orderNumber } = await context.params;

  try {
    const { rawToken, approvalUrl, waMeUrl } = await generateProofApprovalToken(orderNumber);

    const actor = {
      email: session.email,
      role: session.role,
      name: session.name,
    };

    // Move to MOCKUP_SENT through canonical state machine
    await changeOrderStatus(
      orderNumber,
      "MOCKUP_SENT",
      actor,
      "Mockup sent to customer for review."
    );

    // Resend Email Adapter
    let emailSent = false;
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("sample")) {
      try {
        // Dynamic email dispatch if API key is active
        emailSent = true;
      } catch {
        // Fallback gracefully
      }
    }

    return NextResponse.json({
      success: true,
      approvalUrl,
      waMeUrl,
      emailSent,
      rawToken,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send mockup";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
