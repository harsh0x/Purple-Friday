import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";
import { verifyEmailOtp } from "@/server/otp/email-otp";
import { activateUser, findUserByEmail } from "@/lib/auth-service";
import { notify } from "@/server/notifications/notify";
import { recordCustomerEvent } from "@/server/customers/customer-events";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-origin requests are forbidden." },
      { status: 403 }
    );
  }

  const clientKey = getClientKey(req, "auth_verify_email");
  const rateLimitResult = await checkRateLimit(clientKey, 10, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many verification attempts. Please wait." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Valid email and 6-digit verification code required." },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const normEmail = email.toLowerCase().trim();

    const result = await verifyEmailOtp({
      target: normEmail,
      purpose: "REGISTER_EMAIL",
      code: otp,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid verification code." },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(normEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    // Activate the user
    await activateUser(normEmail);

    // Welcome email (after verification)
    await notify("welcome", normEmail, { name: user.name });

    // Record customer event & admin notification
    await recordCustomerEvent({
      userId: user.id,
      customerEmail: normEmail,
      type: "registered",
      summary: `Customer ${user.name || normEmail} verified email and activated account.`,
    });

    return NextResponse.json({
      success: true,
      message: "Account verified successfully. You can now log in.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
