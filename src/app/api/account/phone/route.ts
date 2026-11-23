import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { findUserById, changeUserPhone } from "@/lib/auth-service";
import { notify } from "@/server/notifications/notify";
import { recordCustomerEvent } from "@/server/customers/customer-events";
import { isSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  phone: z.string().regex(/^[6-9][0-9]{9}$/, "Please enter a valid 10-digit Indian mobile number."),
  password: z.string().min(1, "Current password is required."),
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
        { error: parsed.error.issues[0]?.message || "Invalid phone data." },
        { status: 400 }
      );
    }

    const { phone, password } = parsed.data;

    // Verify current password
    const user = await findUserById(userId);
    if (!user) throw new Error("User not found.");

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    // Update phone
    await changeUserPhone(userId, phone);

    // Security alert email
    await notify("security_alert_phone_changed", user.email);

    // Record customer event & admin alert
    await recordCustomerEvent({
      userId,
      customerEmail: user.email,
      type: "phone_changed",
      summary: `Phone number updated to ${phone}.`,
      metadata: { phone },
    });

    return NextResponse.json({
      success: true,
      message: "Phone number updated successfully.",
      phone,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update phone number.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
