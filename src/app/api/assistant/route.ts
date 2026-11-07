import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { generateAssistantReply } from "@/lib/assistant/responder";

const assistantSchema = z.object({
  message: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  // 1. Sliding Window Rate Limiting (15 requests/min)
  const clientKey = getClientKey(req, "assistant");
  const rateLimitResult = await checkRateLimit(clientKey, 15, 60000);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit reached. Please wait a moment before sending another query.",
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = assistantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid message up to 500 characters." },
        { status: 400 }
      );
    }

    const result = await generateAssistantReply(parsed.data.message);

    return NextResponse.json({
      success: true,
      reply: result.reply,
      source: result.source,
      suggestedQuestions: result.suggestedQuestions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Assistant response error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
