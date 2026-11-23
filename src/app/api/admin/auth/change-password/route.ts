import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAdminSession, applyAdminSessionCookie, createAdminSessionToken } from "@/lib/admin/admin-session";
import { findUserById, updateStaffPassword } from "@/lib/auth-service";
import { validatePasswordStrength } from "@/lib/security/auth-policy";
import { writeAudit } from "@/lib/admin/audit";

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(10),
  })
  .strict();

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid password format. Must be at least 10 characters long." },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  // 1. Password strength enforcement
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
  }

  // 2. Verify current password
  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User record not found." }, { status: 404 });
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return NextResponse.json({ error: "Current password does not match." }, { status: 400 });
  }

  // 3. Update password in database/store
  await updateStaffPassword(user.id, newPassword);

  // 4. Update session token with mustChangePassword = false
    const updatedToken = await createAdminSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      mustChangePassword: false,
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await writeAudit({
      actor: session.email,
      actorRole: session.role,
      action: "auth.password_changed",
      entityType: "STAFF_USER",
      entityId: session.userId,
      ipAddress: clientIp,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
    applyAdminSessionCookie(response, updatedToken);
  return response;
  }
