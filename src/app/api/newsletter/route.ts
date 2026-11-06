import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api";
import logger from "@/lib/logger";
import prisma from "@/lib/prisma";

const newsletterSchema = z.object({
  email: z.string().email("Please provide a valid corporate or personal email address"),
});

export const POST = createApiHandler(
  {
    bodySchema: newsletterSchema,
    rateLimit: { limit: 10, windowMs: 60000 },
  },
  async ({ body, requestId }) => {
    logger.info({ requestId, emailDomain: body.email.split("@")[1] }, "Newsletter subscription received");

    // Save to database if connected
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        await prisma.contactMessage.create({
          data: {
            name: "Newsletter Subscriber",
            email: body.email,
            subject: "Newsletter Subscription",
            message: "Subscribed to Purple Friday print dispatch updates",
            status: "SUBSCRIBED",
          },
        });
      } catch (err) {
        logger.warn({ err }, "Could not write newsletter subscription to database");
      }
    }

    return NextResponse.json({
      success: true,
      message: "You are subscribed to the Purple Friday Print Dispatch.",
    });
  }
);

