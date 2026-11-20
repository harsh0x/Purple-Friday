import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAllOrders } from "@/lib/orders";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security/origin";
import {
  submitCustomerReview,
  REVIEW_STORE,
  REVIEW_TOKEN_MAP,
} from "@/server/reviews/review-service";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2),
  body: z.string().min(5),
  photoUrls: z.array(z.string()).default([]),
  authorName: z.string().min(2),
  orderNumber: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const token = searchParams.get("token");

  // Validate token if provided
  if (token) {
    const invite = REVIEW_TOKEN_MAP.get(token);
    if (!invite || invite.expiresAt < Date.now()) {
      return NextResponse.json({ error: "Invalid or expired review invitation token" }, { status: 400 });
    }
    return NextResponse.json({
      valid: true,
      orderNumber: invite.orderNumber,
      productId: invite.productId,
    });
  }

  // Public approved reviews for a product
  const reviews = Array.from(REVIEW_STORE.values()).filter((r) => {
    if (productId && r.productId !== productId) return false;
    return r.status === "APPROVED";
  });

  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  // CSRF Origin Protection
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "Cross-origin requests are forbidden." },
      { status: 403 }
    );
  }

  // Rate Limiting (5 reviews/min per IP)
  const clientKey = getClientKey(req, "reviews");
  const rateLimitResult = await checkRateLimit(clientKey, 5, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Review submission limit reached. Please try again later." },
      { status: 429 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;

  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid review data." },
        { status: 400 }
      );
    }

    const { productId, rating, title, body: reviewBody, photoUrls, authorName, orderNumber } = parsed.data;

    // Check if user has an order containing this product that has been completed/delivered
    const allOrders = getAllOrders();
    const isVerifiedBuyer = Boolean(orderNumber) || allOrders.some(
      (o) =>
        (o.userId === userId || o.customerEmail.toLowerCase() === session?.user?.email?.toLowerCase()) &&
        o.items.some((i) => i.productId === productId)
    );

    // Smart Triage: 4-5 stars approved/queued, 1-3 stars quarantined & creates SupportTicket
    const result = await submitCustomerReview({
      productId,
      orderNumber,
      authorName,
      rating,
      title,
      body: reviewBody,
      photoUrls,
    });

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
        await prisma.review.create({
          data: {
            productId,
            userId,
            rating,
            title,
            body: reviewBody,
            verified: isVerifiedBuyer,
            photoUrls,
            status: result.review.status,
            authorName,
            orderNumber,
            supportTicketId: result.supportTicket?.id,
          },
        });
      }
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      verified: isVerifiedBuyer,
      review: result.review,
      ticketCreated: Boolean(result.supportTicket),
      message:
        result.review.status === "APPROVED"
          ? "Thank you! Your verified review is published."
          : result.review.status === "PENDING"
            ? "Thank you! Your review is in moderation queue."
            : "Thank you for your candid feedback. Our executive customer support team has opened an expedited ticket to resolve your merchandise experience.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating review";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
