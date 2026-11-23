import { NextRequest, NextResponse } from "next/server";
import { saveAdminQuote } from "@/lib/admin/admin-store";
import { z } from "zod";
import { notifyAdmin } from "@/server/notifications/admin-dispatcher";

const quoteSubmitSchema = z.object({
  productSlug: z.string().default("general"),
  productName: z.string().default("Custom Merch Run"),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  quantity: z.number().optional(),
  budget: z.number().optional(),
  notes: z.string().optional(),
  briefFileUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = quoteSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const saved = saveAdminQuote({
      productSlug: parsed.data.productSlug,
      productName: parsed.data.productName,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      quantity: parsed.data.quantity,
      budget: parsed.data.budget,
      notes: parsed.data.notes,
      briefFileUrl: parsed.data.briefFileUrl,
    });

    try {
      await notifyAdmin("NEW_QUOTE", {
        quoteId: saved.id,
        companyName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        quantity: parsed.data.quantity,
      });
    } catch (err) {
      console.warn("[quotes] notifyAdmin NEW_QUOTE error:", err);
    }

    return NextResponse.json({
      success: true,
      quoteId: saved.id,
      message: "Brief received! Prepress team will contact you on WhatsApp/Email within 2 hours.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error submitting quote request";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

