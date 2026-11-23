import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { findUserById, changeUserPassword } from "@/lib/auth-service";
import { validatePasswordStrength } from "@/lib/security/auth-policy";
import { notify } from "@/server/notifications/notify";
import { recordCustomerEvent } from "@/server/customers/customer-events";
import { isSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid password data." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Verify current password
    const user = await findUserById(userId);
    if (!user) throw new Error("User not found.");

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    // Validate new password strength
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { error: strength.errors[0] || "New password does not meet security requirements." },
        { status: 400 }
      );
    }

    // Change password & bump tokenVersion (terminates all other active sessions)
    await changeUserPassword(userId, newPassword);

    // Send security alert email
    await notify("security_alert_password_changed", user.email);

    // Record customer event & admin alert
    await recordCustomerEvent({
      userId,
      customerEmail: user.email,
      type: "password_changed",
      summary: "Customer updated account password.",
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. All other active sessions have been signed out.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to change password.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
