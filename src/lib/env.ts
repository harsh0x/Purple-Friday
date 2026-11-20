import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(16).default("purple-friday-default-nextauth-secret-key-32chars"),
  ADMIN_JWT_SECRET: z.string().min(16).default("purple-friday-default-admin-jwt-secret-key-32ch"),
  CRON_SECRET: z.string().min(8).default("pf-cron-secret-token"),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Shipping (Shiprocket)
  SHIPROCKET_API_USER: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPPING_WEBHOOK_SECRET: z.string().optional(),

  // Communication
  RESEND_API_KEY: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid production environment configuration");
    }
  }
  return result.data || (process.env as unknown as Env);
}

export const env = validateEnv();
