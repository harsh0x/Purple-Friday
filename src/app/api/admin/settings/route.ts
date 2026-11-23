import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/admin-session";
import { requireAdmin } from "@/lib/admin/permissions";
import {
  getStoreSettings,
  updateStoreSettings,
  getIntegrationStatuses,
} from "@/lib/admin/app-settings";

const UpdateSettingsSchema = z
  .object({
    businessName: z.string().min(2),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid Indian GSTIN format"),
    address: z.string().min(5),
    supportPhone: z.string().min(5),
    whatsappNumber: z.string().min(5),
  })
  .strict();

export async function GET() {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const store = await getStoreSettings();
  const integrations = getIntegrationStatuses();

  return NextResponse.json({ store, integrations });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  try {
    requireAdmin(session);
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

  const parsed = UpdateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    const updated = await updateStoreSettings(
      parsed.data,
      session!.email,
      session!.role
    );
    return NextResponse.json({ success: true, store: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update store settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
