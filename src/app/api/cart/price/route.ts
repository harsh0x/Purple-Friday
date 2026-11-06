import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api";
import { calculateCartPricing } from "@/lib/pricing";

const cartPriceSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      optionKey: z.string().min(1),
      qty: z.number().int().positive(),
      options: z.record(z.string(), z.string()).optional(),
      designId: z.string().optional(),
    })
  ),
  couponCode: z.string().optional(),
});

export const POST = createApiHandler(
  {
    bodySchema: cartPriceSchema,
    rateLimit: { limit: 120, windowMs: 60000 },
  },
  async ({ body }) => {
    const calculation = await calculateCartPricing(body.items, body.couponCode);

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  }
);
