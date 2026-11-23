import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  getCustomerAddresses,
  addCustomerAddress,
} from "@/server/customers/account-service";
import { isSameOrigin } from "@/lib/security/origin";

const addressSchema = z.object({
  label: z.enum(["Home", "Office", "Other"]),
  name: z.string().min(2, "Contact name is required."),
  phone: z.string().regex(/^[6-9][0-9]{9}$/, "Please enter a valid 10-digit Indian mobile number."),
  line1: z.string().min(3, "Address line 1 is required."),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  pin: z.string().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code."),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format.").optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
  }

  const addresses = getCustomerAddresses(userId);
  return NextResponse.json({ success: true, addresses });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests forbidden." }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const email = session.user.email;
  if (!userId || !email) {
    return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid address data." },
        { status: 400 }
      );
    }

    const address = await addCustomerAddress({
      userId,
      customerEmail: email,
      ...parsed.data,
      gstin: parsed.data.gstin || undefined,
    });

    return NextResponse.json({ success: true, address });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add address.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
