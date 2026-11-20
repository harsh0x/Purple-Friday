import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import { writeAudit } from "./audit";

export interface StoreDetails {
  businessName: string;
  gstin: string;
  address: string;
  supportPhone: string;
  whatsappNumber: string;
  timeZone: string;
  currency: string;
}

export const DEFAULT_STORE_DETAILS: StoreDetails = {
  businessName: "Purple Friday Merchandise Atelier",
  gstin: "29AADCP9876Q1Z5",
  address: "108 Industrial Layout, Koramangala 5th Block, Bengaluru, Karnataka 560095, India",
  supportPhone: "+91 80 4965 2200",
  whatsappNumber: "+91 98765 43210",
  timeZone: "Asia/Kolkata (IST, UTC+05:30)",
  currency: "INR (₹, paise)",
};

// Memory fallback store for AppSettings
const SETTINGS_MEMORY_STORE = new Map<string, unknown>();
SETTINGS_MEMORY_STORE.set("store_details", DEFAULT_STORE_DETAILS);

export async function getStoreSettings(): Promise<StoreDetails> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const setting = await prisma.appSetting.findUnique({
        where: { key: "store_details" },
      });
      if (setting && setting.value) {
        return { ...DEFAULT_STORE_DETAILS, ...(setting.value as Partial<StoreDetails>) };
      }
    }
  } catch {
    // Fallback to memory
  }

  const cached = SETTINGS_MEMORY_STORE.get("store_details") as StoreDetails | undefined;
  return cached || DEFAULT_STORE_DETAILS;
}

export async function updateStoreSettings(
  updates: Partial<StoreDetails>,
  actor: string,
  actorRole: string
): Promise<StoreDetails> {
  const current = await getStoreSettings();
  const next: StoreDetails = {
    ...current,
    ...updates,
    timeZone: DEFAULT_STORE_DETAILS.timeZone, // Enforce India time
    currency: DEFAULT_STORE_DETAILS.currency,
  };

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.appSetting.upsert({
        where: { key: "store_details" },
        update: {
          value: next as unknown as Prisma.InputJsonValue,
          updatedBy: actor,
        },
        create: {
          key: "store_details",
          value: next as unknown as Prisma.InputJsonValue,
          updatedBy: actor,
        },
      });
    }
  } catch {
    // Memory fallback
  }

  SETTINGS_MEMORY_STORE.set("store_details", next);

  await writeAudit({
    actor,
    actorRole,
    action: "settings.update_store_details",
    entityType: "APP_SETTING",
    entityId: "store_details",
    before: current as unknown as Record<string, unknown>,
    after: next as unknown as Record<string, unknown>,
  });

  return next;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  category: "PAYMENT" | "SHIPPING" | "COMMUNICATION" | "STORAGE" | "SECURITY" | "AI";
  configured: boolean;
  statusText: "Configured" | "Not configured";
  description: string;
  requiredEnvKeys: string[];
}

/**
 * Returns clean, secret-less configuration status for external services.
 * Never leaks secret values or tokens.
 */
export function getIntegrationStatuses(): IntegrationStatus[] {
  const integrations: Array<{
    id: string;
    name: string;
    category: IntegrationStatus["category"];
    description: string;
    keys: string[];
  }> = [
    {
      id: "razorpay",
      name: "Razorpay Payment Gateway",
      category: "PAYMENT",
      description: "Indian UPI, Cards, NetBanking, and automated refunds.",
      keys: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business API",
      category: "COMMUNICATION",
      description: "Order dispatch alerts, digital proof approval links, and support.",
      keys: ["WHATSAPP_API_KEY", "WHATSAPP_PHONE_NUMBER_ID"],
    },
    {
      id: "courier",
      name: "Shiprocket / Delhivery Courier Logistics",
      category: "SHIPPING",
      description: "Automated AWB generation, pickup scheduling, and live tracking sync.",
      keys: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"],
    },
    {
      id: "resend",
      name: "Resend Transactional Email",
      category: "COMMUNICATION",
      description: "GST tax invoices, order receipts, and proof ready notifications.",
      keys: ["RESEND_API_KEY"],
    },
    {
      id: "cloudinary",
      name: "Cloudinary CDN & Media Storage",
      category: "STORAGE",
      description: "High-resolution vector assets, print proofs, and customer artwork.",
      keys: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    },
    {
      id: "turnstile",
      name: "Cloudflare Turnstile",
      category: "SECURITY",
      description: "Privacy-preserving anti-bot verification on customer auth & forms.",
      keys: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    },
    {
      id: "upstash",
      name: "Upstash Redis",
      category: "SECURITY",
      description: "Distributed rate limiting and token bucket storage.",
      keys: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    },
    {
      id: "gemini",
      name: "Google Gemini 2.0 AI Assistant",
      category: "AI",
      description: "Design assistance, mockup quality scoring, and palette recommendations.",
      keys: ["GEMINI_API_KEY"],
    },
  ];

  return integrations.map((item) => {
    const isConfigured = item.keys.every((k) => {
      const val = process.env[k];
      return Boolean(val && !val.includes("sample") && !val.includes("placeholder") && val.trim().length > 0);
    });

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      configured: isConfigured,
      statusText: isConfigured ? "Configured" : "Not configured",
      description: item.description,
      requiredEnvKeys: item.keys,
    };
  });
}
