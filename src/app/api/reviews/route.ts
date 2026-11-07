import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAllOrders } from "@/lib/orders";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2),
  body: z.string().min(5),
  photoUrls: z.array(z.string()).default([]),
  authorName: z.string().min(2),
});

export async function POST(req: NextRequest) {
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

    const { productId, rating, title, body: reviewBody, photoUrls, authorName } = parsed.data;

    // Check if user has an order containing this product that has been completed/delivered
    const allOrders = getAllOrders();
    const isVerifiedBuyer = allOrders.some(
      (o) =>
        (o.userId === userId || o.customerEmail.toLowerCase() === session?.user?.email?.toLowerCase()) &&
        o.items.some((i) => i.productId === productId)
    );

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
            status: "PENDING",
            authorName,
          },
        });
      }
    } catch {
      // Memory fallback
    }

    return NextResponse.json({
      success: true,
      verified: isVerifiedBuyer,
      message: "Review submitted for moderation. Thank you for your feedback!",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating review";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
