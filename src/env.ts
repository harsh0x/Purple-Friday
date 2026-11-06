import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(1).default("dev-secret-at-least-32-chars-long-placeholder"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),

  // Public Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  // Cloudinary (Optional fallback)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Razorpay (Optional fallback)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Resend (Optional fallback)
  RESEND_API_KEY: z.string().optional(),

  // Google Gemini API (Optional fallback)
  GEMINI_API_KEY: z.string().optional(),

  // Cloudflare Turnstile (Optional fallback)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Upstash Redis (Optional fallback)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Admin Defaults
  ADMIN_EMAIL: z.string().email().default("admin@purplefriday.in"),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).default("ChangeThisPasswordInProduction123!"),

  // System
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration. Check logs for details.");
  }

  return parsed.data;
}

export const env = validateEnv();

