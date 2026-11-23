import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  updateCustomerAddress,
  deleteCustomerAddress,
} from "@/server/customers/account-service";
import { isSameOrigin } from "@/lib/security/origin";

const updateSchema = z.object({
  label: z.enum(["Home", "Office", "Other"]).optional(),
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^[6-9][0-9]{9}$/).optional(),
  line1: z.string().min(3).optional(),
  line2: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pin: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
  gstin: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const email = session.user.email;
  const { id } = await context.params;

  if (!userId || !email) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const updated = await updateCustomerAddress(id, userId, email, parsed.data);
    return NextResponse.json({ success: true, address: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update address.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const email = session.user.email;
  const { id } = await context.params;

  if (!userId || !email) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
  }

  try {
    await deleteCustomerAddress(id, userId, email);
    return NextResponse.json({ success: true, message: "Address deleted." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete address.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
