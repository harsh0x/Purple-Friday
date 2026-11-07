export interface AssistantResponse {
  reply: string;
  source: "GEMINI_AI" | "OFFLINE_RULES";
  suggestedQuestions?: string[];
}

const OFFLINE_KNOWLEDGE: Array<{
  keywords: string[];
  reply: string;
}> = [
  {
    keywords: ["moq", "minimum", "minimum order", "small order", "min quantity", "single piece"],
    reply:
      "Our Minimum Order Quantity (MOQ) depends on the product line: Magnetic Badges, T-Shirts, and Caps start at just 5 pieces. Insulated Steel Flasks and Executive Welcome Kits start at 10 pieces. As your batch quantity increases (25, 50, 100, 250+ units), our automated tiered volume pricing unlocks savings up to 45% per piece.",
  },
  {
    keywords: ["delivery", "dispatch", "turnaround", "how long", "time", "shipping", "transit", "when will"],
    reply:
      "Standard orders dispatch within 24 to 48 hours following your digital pre-press proof approval. Transit via our express courier partners (Delhivery Express, BlueDart Apex, DTDC) typically takes 2-3 business days to metro hubs (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai) and 3-5 days across non-metro pincodes in India.",
  },
  {
    keywords: ["gst", "tax", "invoice", "input credit", "itc", "gstin"],
    reply:
      "Yes, all orders include an official B2B GST Tax Invoice with HSN codes (e.g. 7117 for metal badges, 6109 for cotton t-shirts, 9608 for pens). Enter your 15-character corporate GSTIN at checkout to claim the full 18% GST Input Tax Credit (ITC). Intra-state orders in Karnataka split CGST 9% + SGST 9%, and inter-state orders charge IGST 18%.",
  },
  {
    keywords: ["proof", "approval", "approve", "prepress", "preview", "sample", "mockup", "mistake"],
    reply:
      "We operate under a strict 'Approve Before We Print' guarantee. Within 24 hours of placing your order, our pre-press team renders an exact digital vector proof with Pantone simulation and print safe zones. You inspect it in your account with a 2x zoom loupe. If anything looks off, click 'Request Changes' and we will revise it for free. Nothing is sent to physical production until you click 'Approve Proof'.",
  },
  {
    keywords: ["print method", "dtg", "screen print", "embroidery", "laser", "printing", "technique"],
    reply:
      "We use industrial, in-house manufacturing lines: Direct-to-Garment (DTG) for photo-realistic multi-color apparel, High-Density Screen Print for vibrant long-run tees, 12,000-stitch Tajima Tajima embroidery for piqué polos and caps, Fiber Laser Engraving for stainless steel flasks and brass pens, and Offset Lithography with gloss Mylar for magnetic badges.",
  },
  {
    keywords: ["artwork", "logo format", "file format", "resolution", "dpi", "svg", "png", "vector"],
    reply:
      "For razor-sharp printing, vector formats (SVG, PDF, AI, EPS) are best. High-resolution raster images (PNG, WebP, JPG) at 200–300 DPI are also accepted. Our Customizer Studio checks your image resolution in real time. If your logo is low-resolution, our studio team will vector trace and clean it up completely free of charge.",
  },
  {
    keywords: ["sample", "physical sample", "single sample", "test print"],
    reply:
      "Because our MOQ is as low as 5 pieces on badges, t-shirts, and caps, we recommend placing a 5-piece pilot batch with your logo to inspect fabric feel, size drape, and print vibrancy before commissioning a 500+ unit corporate run.",
  },
  {
    keywords: ["discount", "bulk", "corporate discount", "coupon", "code"],
    reply:
      "Volume discounts are automatically calculated right on the product page and cart — no coupon code required! For your first order, you can also use coupon code 'FIRSTORDER' at checkout for 12% off subtotal orders above ₹1,000. Orders above ₹15,000 qualify for bulk coupon 'BULK15'.",
  },
  {
    keywords: ["gift", "corporate gift", "kit", "welcome kit", "onboarding", "hamper"],
    reply:
      "Our Artisan Welcome Kits combine double-walled insulated flasks, matte soft-touch notebooks, engraved rollerball pens, and metallic badges in a custom branded presentation box. Use our Corporate Gifting Budget Planner at /corporate-gifting to simulate kit combinations and generate instant official PDF quotations.",
  },
];

export async function generateAssistantReply(userMessage: string): Promise<AssistantResponse> {
  const cleanInput = userMessage.trim().toLowerCase();

  // 1. Try Gemini API if API key is provided
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 10 && !apiKey.includes("dummy")) {
    try {
      const systemInstruction = `You are Vikram, the Master Printmaker and AI Assistant for "Purple Friday", a premier Indian custom merchandise print-shop (Bengaluru & Tirupur).
Respond ONLY to questions about custom merchandise, printing methods (Offset, Screen Print, DTG, Tajima Embroidery, Laser Engraving), Minimum Order Quantities (5-10 pcs), turnaround (24-48h dispatch, pan-India delivery), 18% GST input credit, pricing tiers, and proof approvals.
Never answer general coding, politics, or unrelated topics.
Format your answer strictly in clean, concise PLAIN TEXT. DO NOT USE MARKDOWN (no asterisks, no hashes, no bullet asterisks). Keep responses under 90 words.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\nCustomer Question: ${userMessage}` }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 200,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText && typeof rawText === "string") {
          // Strip any markdown characters for safety
          const plainText = rawText
            .replace(/[*#_`~[\]]/g, "")
            .replace(/\n\s*\n/g, "\n")
            .trim();

          return {
            reply: plainText,
            source: "GEMINI_AI",
            suggestedQuestions: [
              "What is your turnaround time?",
              "Can I see a proof before printing?",
              "How does 18% GST credit work?",
            ],
          };
        }
      }
    } catch {
      // Fallback to offline rule-based responder
    }
  }

  // 2. Intelligent Offline Knowledge Heuristic Matcher
  for (const item of OFFLINE_KNOWLEDGE) {
    if (item.keywords.some((kw) => cleanInput.includes(kw))) {
      return {
        reply: item.reply,
        source: "OFFLINE_RULES",
        suggestedQuestions: [
          "What is your turnaround time?",
          "Can I see a proof before printing?",
          "Do you offer sample orders?",
        ],
      };
    }
  }

  // Generic fallback if no specific keyword matched
  return {
    reply:
      "Purple Friday specializes in custom merchandise with in-house manufacturing across Bengaluru and Tirupur. We print magnetic badges, 240 GSM heavy cotton tees, piqué polos, caps, flasks, and executive welcome kits starting from 5 pieces with 18% GST input credit. You can upload your logo in our Customizer Studio or request our prepress specialists to prepare a free digital proof.",
    source: "OFFLINE_RULES",
    suggestedQuestions: [
      "What is your minimum order quantity?",
      "How fast is dispatch?",
      "Do I get a GST tax invoice?",
    ],
  };
}

