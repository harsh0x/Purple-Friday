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

export interface CodSettings {
  enabled: boolean;
  advancePercent: number; // default 25, allowed 20 to 30
  maxCodValuePaise: number; // default 1500000 (Rs 15,000)
}

export const DEFAULT_COD_SETTINGS: CodSettings = {
  enabled: true,
  advancePercent: 25,
  maxCodValuePaise: 1500000, // Rs 15,000 in integer paise
};

export interface RtoRiskSettings {
  threshold: number; // default 50
  pinRtoWeight: number; // default 30
  pinRtoRateThreshold: number; // default 0.20 (20%)
  phoneRtoWeight: number; // default 35
  multiNameWeight: number; // default 20
  suspiciousAddressWeight: number; // default 25
  stateMismatchWeight: number; // default 15
  highCodWeight: number; // default 20
  highCodThresholdPaise: number; // default 500000 (Rs 5,000)
}

export const DEFAULT_RTO_RISK_SETTINGS: RtoRiskSettings = {
  threshold: 50,
  pinRtoWeight: 30,
  pinRtoRateThreshold: 0.20,
  phoneRtoWeight: 35,
  multiNameWeight: 20,
  suspiciousAddressWeight: 25,
  stateMismatchWeight: 15,
  highCodWeight: 20,
  highCodThresholdPaise: 500000,
};

export interface SupportRefundSettings {
  supportAgentRefundLimitPaise: number; // default Rs 5,000 (500000 paise)
}

export const DEFAULT_SUPPORT_REFUND_SETTINGS: SupportRefundSettings = {
  supportAgentRefundLimitPaise: 500000,
};

export interface MarginSettings {
  paymentGatewayFeePercent: number; // default 2.0%
  paymentGatewayFixedFeePaise: number; // default 0 paise
}

export const DEFAULT_MARGIN_SETTINGS: MarginSettings = {
  paymentGatewayFeePercent: 2.0,
  paymentGatewayFixedFeePaise: 0,
};

export interface SampleToBulkSettings {
  sampleMaxQty: number; // default 2
  bulkMinQty: number; // default 20
  conversionWindowDays: number; // default 60
}

export const DEFAULT_SAMPLE_TO_BULK_SETTINGS: SampleToBulkSettings = {
  sampleMaxQty: 2,
  bulkMinQty: 20,
  conversionWindowDays: 60,
};

export interface ReorderNudgeSettings {
  autoSendReorderNudge: boolean; // default false (never send automatically without explicit setting)
  defaultReorderGapDays: number; // default 90 days
}

export const DEFAULT_REORDER_NUDGE_SETTINGS: ReorderNudgeSettings = {
  autoSendReorderNudge: false,
  defaultReorderGapDays: 90,
};

export interface ReviewSettings {
  autoApprovePositiveReviews: boolean; // default true
  reviewRequestDelayDays: number; // default 3 days
}

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  autoApprovePositiveReviews: true,
  reviewRequestDelayDays: 3,
};

export interface SmartRankingSettings {
  conversionWeight: number; // default 0.4
  marginWeight: number; // default 0.3
  stockWeight: number; // default 0.2
  reviewWeight: number; // default 0.1
}

export const DEFAULT_SMART_RANKING_SETTINGS: SmartRankingSettings = {
  conversionWeight: 0.4,
  marginWeight: 0.3,
  stockWeight: 0.2,
  reviewWeight: 0.1,
};

// Memory fallback store for AppSettings
const SETTINGS_MEMORY_STORE = new Map<string, unknown>();
SETTINGS_MEMORY_STORE.set("store_details", DEFAULT_STORE_DETAILS);
SETTINGS_MEMORY_STORE.set("cod_settings", DEFAULT_COD_SETTINGS);
SETTINGS_MEMORY_STORE.set("rto_risk_settings", DEFAULT_RTO_RISK_SETTINGS);
SETTINGS_MEMORY_STORE.set("support_refund_settings", DEFAULT_SUPPORT_REFUND_SETTINGS);
SETTINGS_MEMORY_STORE.set("margin_settings", DEFAULT_MARGIN_SETTINGS);
SETTINGS_MEMORY_STORE.set("sample_to_bulk_settings", DEFAULT_SAMPLE_TO_BULK_SETTINGS);
SETTINGS_MEMORY_STORE.set("reorder_nudge_settings", DEFAULT_REORDER_NUDGE_SETTINGS);
SETTINGS_MEMORY_STORE.set("review_settings", DEFAULT_REVIEW_SETTINGS);
SETTINGS_MEMORY_STORE.set("smart_ranking_settings", DEFAULT_SMART_RANKING_SETTINGS);

export async function getCodSettings(): Promise<CodSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const setting = await prisma.appSetting.findUnique({
        where: { key: "cod_settings" },
      });
      if (setting && setting.value) {
        const val = setting.value as Partial<CodSettings>;
        return {
          enabled: val.enabled ?? DEFAULT_COD_SETTINGS.enabled,
          advancePercent: Math.min(30, Math.max(20, Number(val.advancePercent) || DEFAULT_COD_SETTINGS.advancePercent)),
          maxCodValuePaise: Number(val.maxCodValuePaise) || DEFAULT_COD_SETTINGS.maxCodValuePaise,
        };
      }
    }
  } catch {
    // Memory fallback
  }
  return (SETTINGS_MEMORY_STORE.get("cod_settings") as CodSettings) || DEFAULT_COD_SETTINGS;
}

export async function updateCodSettings(
  updates: Partial<CodSettings>,
  actor: string,
  actorRole: string
): Promise<CodSettings> {
  const current = await getCodSettings();
  const next: CodSettings = {
    enabled: updates.enabled ?? current.enabled,
    advancePercent: Math.min(30, Math.max(20, Number(updates.advancePercent ?? current.advancePercent))),
    maxCodValuePaise: Math.max(0, Number(updates.maxCodValuePaise ?? current.maxCodValuePaise)),
  };

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.appSetting.upsert({
        where: { key: "cod_settings" },
        update: { value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
        create: { key: "cod_settings", value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
      });
    }
  } catch {
    // Memory fallback
  }

  SETTINGS_MEMORY_STORE.set("cod_settings", next);

  await writeAudit({
    actor,
    actorRole,
    action: "settings.update_cod_settings",
    entityType: "APP_SETTING",
    entityId: "cod_settings",
    before: current as unknown as Record<string, unknown>,
    after: next as unknown as Record<string, unknown>,
  });

  return next;
}

export async function getRtoRiskSettings(): Promise<RtoRiskSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const setting = await prisma.appSetting.findUnique({
        where: { key: "rto_risk_settings" },
      });
      if (setting && setting.value) {
        return { ...DEFAULT_RTO_RISK_SETTINGS, ...(setting.value as Partial<RtoRiskSettings>) };
      }
    }
  } catch {
    // Memory fallback
  }
  return (SETTINGS_MEMORY_STORE.get("rto_risk_settings") as RtoRiskSettings) || DEFAULT_RTO_RISK_SETTINGS;
}

export async function updateRtoRiskSettings(
  updates: Partial<RtoRiskSettings>,
  actor: string,
  actorRole: string
): Promise<RtoRiskSettings> {
  const current = await getRtoRiskSettings();
  const next: RtoRiskSettings = {
    ...current,
    ...updates,
  };

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.appSetting.upsert({
        where: { key: "rto_risk_settings" },
        update: { value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
        create: { key: "rto_risk_settings", value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
      });
    }
  } catch {
    // Memory fallback
  }

  SETTINGS_MEMORY_STORE.set("rto_risk_settings", next);

  await writeAudit({
    actor,
    actorRole,
    action: "settings.update_rto_risk_settings",
    entityType: "APP_SETTING",
    entityId: "rto_risk_settings",
    before: current as unknown as Record<string, unknown>,
    after: next as unknown as Record<string, unknown>,
  });

  return next;
}

export async function getSupportRefundSettings(): Promise<SupportRefundSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const setting = await prisma.appSetting.findUnique({
        where: { key: "support_refund_settings" },
      });
      if (setting && setting.value) {
        return { ...DEFAULT_SUPPORT_REFUND_SETTINGS, ...(setting.value as Partial<SupportRefundSettings>) };
      }
    }
  } catch {
    // Memory fallback
  }
  return (SETTINGS_MEMORY_STORE.get("support_refund_settings") as SupportRefundSettings) || DEFAULT_SUPPORT_REFUND_SETTINGS;
}

export async function updateSupportRefundSettings(
  limitPaise: number,
  actor: string,
  actorRole: string
): Promise<SupportRefundSettings> {
  const current = await getSupportRefundSettings();
  const next: SupportRefundSettings = {
    supportAgentRefundLimitPaise: Math.max(0, limitPaise),
  };

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.appSetting.upsert({
        where: { key: "support_refund_settings" },
        update: { value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
        create: { key: "support_refund_settings", value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
      });
    }
  } catch {
    // Memory fallback
  }

  SETTINGS_MEMORY_STORE.set("support_refund_settings", next);

  await writeAudit({
    actor,
    actorRole,
    action: "settings.update_support_refund_limit",
    entityType: "APP_SETTING",
    entityId: "support_refund_settings",
    before: current as unknown as Record<string, unknown>,
    after: next as unknown as Record<string, unknown>,
  });

  return next;
}

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

// -------------------------------------------------------------
// Part 5: Analytics, Margin, Cohorts & Smart Ranking Settings
// -------------------------------------------------------------

export async function getMarginSettings(): Promise<MarginSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const s = await prisma.appSetting.findUnique({ where: { key: "margin_settings" } });
      if (s?.value) {
        const v = s.value as Partial<MarginSettings>;
        return {
          paymentGatewayFeePercent: Number(v.paymentGatewayFeePercent) || DEFAULT_MARGIN_SETTINGS.paymentGatewayFeePercent,
          paymentGatewayFixedFeePaise: Number(v.paymentGatewayFixedFeePaise) || DEFAULT_MARGIN_SETTINGS.paymentGatewayFixedFeePaise,
        };
      }
    }
  } catch {}
  return (SETTINGS_MEMORY_STORE.get("margin_settings") as MarginSettings) || DEFAULT_MARGIN_SETTINGS;
}

export async function updateMarginSettings(
  updates: Partial<MarginSettings>,
  actor: string,
  actorRole: string
): Promise<MarginSettings> {
  const current = await getMarginSettings();
  const next: MarginSettings = {
    paymentGatewayFeePercent: updates.paymentGatewayFeePercent !== undefined ? updates.paymentGatewayFeePercent : current.paymentGatewayFeePercent,
    paymentGatewayFixedFeePaise: updates.paymentGatewayFixedFeePaise !== undefined ? updates.paymentGatewayFixedFeePaise : current.paymentGatewayFixedFeePaise,
  };
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.appSetting.upsert({
        where: { key: "margin_settings" },
        update: { value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
        create: { key: "margin_settings", value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
      });
    }
  } catch {}
  SETTINGS_MEMORY_STORE.set("margin_settings", next);
  await writeAudit({
    actor,
    actorRole,
    action: "settings.update_margin_rules",
    entityType: "APP_SETTING",
    entityId: "margin_settings",
    before: current as unknown as Record<string, unknown>,
    after: next as unknown as Record<string, unknown>,
  });
  return next;
}

export async function getSampleToBulkSettings(): Promise<SampleToBulkSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const s = await prisma.appSetting.findUnique({ where: { key: "sample_to_bulk_settings" } });
      if (s?.value) {
        const v = s.value as Partial<SampleToBulkSettings>;
        return {
          sampleMaxQty: Number(v.sampleMaxQty) || DEFAULT_SAMPLE_TO_BULK_SETTINGS.sampleMaxQty,
          bulkMinQty: Number(v.bulkMinQty) || DEFAULT_SAMPLE_TO_BULK_SETTINGS.bulkMinQty,
          conversionWindowDays: Number(v.conversionWindowDays) || DEFAULT_SAMPLE_TO_BULK_SETTINGS.conversionWindowDays,
        };
      }
    }
  } catch {}
  return (SETTINGS_MEMORY_STORE.get("sample_to_bulk_settings") as SampleToBulkSettings) || DEFAULT_SAMPLE_TO_BULK_SETTINGS;
}

export async function updateSampleToBulkSettings(
  updates: Partial<SampleToBulkSettings>,
  actor: string,
  actorRole: string
): Promise<SampleToBulkSettings> {
  const current = await getSampleToBulkSettings();
  const next: SampleToBulkSettings = {
    sampleMaxQty: updates.sampleMaxQty ?? current.sampleMaxQty,
    bulkMinQty: updates.bulkMinQty ?? current.bulkMinQty,
    conversionWindowDays: updates.conversionWindowDays ?? current.conversionWindowDays,
  };
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      await prisma.appSetting.upsert({
        where: { key: "sample_to_bulk_settings" },
        update: { value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
        create: { key: "sample_to_bulk_settings", value: next as unknown as Prisma.InputJsonValue, updatedBy: actor },
      });
    }
  } catch {}
  SETTINGS_MEMORY_STORE.set("sample_to_bulk_settings", next);
  await writeAudit({
    actor,
    actorRole,
    action: "settings.update_sample_to_bulk",
    entityType: "APP_SETTING",
    entityId: "sample_to_bulk_settings",
    before: current as unknown as Record<string, unknown>,
    after: next as unknown as Record<string, unknown>,
  });
  return next;
}

export const setSampleToBulkSettings = (updates: Partial<SampleToBulkSettings>) =>
  updateSampleToBulkSettings(updates, "Admin", "SUPER_ADMIN");

export async function getReorderNudgeSettings(): Promise<ReorderNudgeSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const s = await prisma.appSetting.findUnique({ where: { key: "reorder_nudge_settings" } });
      if (s?.value) {
        const v = s.value as Partial<ReorderNudgeSettings>;
        return {
          autoSendReorderNudge: Boolean(v.autoSendReorderNudge),
          defaultReorderGapDays: Number(v.defaultReorderGapDays) || DEFAULT_REORDER_NUDGE_SETTINGS.defaultReorderGapDays,
        };
      }
    }
  } catch {}
  return (SETTINGS_MEMORY_STORE.get("reorder_nudge_settings") as ReorderNudgeSettings) || DEFAULT_REORDER_NUDGE_SETTINGS;
}

export async function getReviewSettings(): Promise<ReviewSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const s = await prisma.appSetting.findUnique({ where: { key: "review_settings" } });
      if (s?.value) {
        const v = s.value as Partial<ReviewSettings>;
        return {
          autoApprovePositiveReviews: v.autoApprovePositiveReviews !== undefined ? Boolean(v.autoApprovePositiveReviews) : DEFAULT_REVIEW_SETTINGS.autoApprovePositiveReviews,
          reviewRequestDelayDays: Number(v.reviewRequestDelayDays) || DEFAULT_REVIEW_SETTINGS.reviewRequestDelayDays,
        };
      }
    }
  } catch {}
  return (SETTINGS_MEMORY_STORE.get("review_settings") as ReviewSettings) || DEFAULT_REVIEW_SETTINGS;
}

export async function getSmartRankingSettings(): Promise<SmartRankingSettings> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("dummy")) {
      const s = await prisma.appSetting.findUnique({ where: { key: "smart_ranking_settings" } });
      if (s?.value) {
        const v = s.value as Partial<SmartRankingSettings>;
        return {
          conversionWeight: Number(v.conversionWeight) || DEFAULT_SMART_RANKING_SETTINGS.conversionWeight,
          marginWeight: Number(v.marginWeight) || DEFAULT_SMART_RANKING_SETTINGS.marginWeight,
          stockWeight: Number(v.stockWeight) || DEFAULT_SMART_RANKING_SETTINGS.stockWeight,
          reviewWeight: Number(v.reviewWeight) || DEFAULT_SMART_RANKING_SETTINGS.reviewWeight,
        };
      }
    }
  } catch {}
  return (SETTINGS_MEMORY_STORE.get("smart_ranking_settings") as SmartRankingSettings) || DEFAULT_SMART_RANKING_SETTINGS;
}
