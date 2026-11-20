import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requirePermission, AdminRole } from "@/lib/admin/permissions";
import {
  getStaffMembers,
  createUser,
  updateStaffRole,
  toggleStaffActive,
  forceStaffPasswordReset,
  findUserById,
} from "@/lib/auth-service";
import { writeAudit } from "@/lib/admin/audit";

const CreateStaffSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(2),
    role: z.enum(["SUPER_ADMIN", "GRAPHIC_DESIGNER", "FACTORY_MANAGER", "SUPPORT_AGENT"]),
    phone: z.string().optional(),
    password: z.string().min(10),
  })
  .strict();

const UpdateStaffSchema = z
  .object({
    action: z.enum(["UPDATE_ROLE", "TOGGLE_ACTIVE", "FORCE_PASSWORD_RESET"]),
    userId: z.string().min(1),
    expectedVersion: z.number().int().positive(),
    role: z
      .enum(["SUPER_ADMIN", "GRAPHIC_DESIGNER", "FACTORY_MANAGER", "SUPPORT_AGENT"])
      .optional(),
    active: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const session = await getAdminSession();
  try {
    requirePermission(session, "admin:manage_team");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const staff = await getStaffMembers();
  return NextResponse.json({ staff });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  try {
    requirePermission(session, "admin:manage_team");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = CreateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { email, name, role, phone, password } = parsed.data;

  try {
    const user = await createUser({
      email,
      name,
      role: role as AdminRole,
      phone,
      password,
      mustChangePassword: true, // Force password change on first login
    });

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await writeAudit({
      actor: session!.email,
      actorRole: session!.role,
      action: "team.create_staff",
      entityType: "STAFF_USER",
      entityId: user.id,
      ipAddress: clientIp,
      after: {
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create staff member.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  try {
    requirePermission(session, "admin:manage_team");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = UpdateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { action, userId, expectedVersion, role, active } = parsed.data;
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  const existing = await findUserById(userId);
  if (!existing) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  try {
    if (action === "UPDATE_ROLE") {
      if (!role) {
        return NextResponse.json({ error: "Target role is required." }, { status: 400 });
      }
      const updated = await updateStaffRole(userId, role as AdminRole, expectedVersion);
      await writeAudit({
        actor: session!.email,
        actorRole: session!.role,
        action: "team.update_role",
        entityType: "STAFF_USER",
        entityId: userId,
        ipAddress: clientIp,
        before: { role: existing.role, version: existing.version },
        after: { role: updated.role, version: updated.version },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    if (action === "TOGGLE_ACTIVE") {
      if (active === undefined) {
        return NextResponse.json({ error: "Active status is required." }, { status: 400 });
      }
      const updated = await toggleStaffActive(userId, active, expectedVersion);
      await writeAudit({
        actor: session!.email,
        actorRole: session!.role,
        action: active ? "team.activate_staff" : "team.deactivate_staff",
        entityType: "STAFF_USER",
        entityId: userId,
        ipAddress: clientIp,
        before: { active: existing.active, version: existing.version },
        after: { active: updated.active, version: updated.version },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    if (action === "FORCE_PASSWORD_RESET") {
      const updated = await forceStaffPasswordReset(userId, expectedVersion);
      await writeAudit({
        actor: session!.email,
        actorRole: session!.role,
        action: "team.force_password_reset",
        entityType: "STAFF_USER",
        entityId: userId,
        ipAddress: clientIp,
        before: { mustChangePassword: existing.mustChangePassword, version: existing.version },
        after: { mustChangePassword: true, version: updated.version },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: "Unsupported team operation." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update staff record.";
    const isConflict = message.includes("Someone else changed");
    return NextResponse.json({ error: message }, { status: isConflict ? 409 : 400 });
  }
}
