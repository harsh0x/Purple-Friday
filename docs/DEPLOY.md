# Purple Friday — Vercel Production Deployment Guide

## 1. Environment Variables
Configure these in **Vercel Project Settings > Environment Variables** (Production):

| Variable | Required | Where to get / Value format |
|---|---|---|
| `DATABASE_URL` | **Yes** | Neon / Supabase pooled connection string (`?pgbouncer=true` or pooler) |
| `DIRECT_URL` | **Yes** | Neon / Supabase direct non-pooled connection string for migrations |
| `NEXTAUTH_SECRET` | **Yes** | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Yes** | Production URL, e.g. `https://purplefriday.in` |
| `ADMIN_JWT_SECRET` | **Yes** | Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Production URL, e.g. `https://purplefriday.in` |
| `ADMIN_EMAIL` | **Yes** | Primary Superadmin email address |
| `ADMIN_INITIAL_PASSWORD` | **Yes** | Strong initial admin password (min 12 chars) |
| `CRON_SECRET` | **Yes** | Generate: `openssl rand -hex 24` (matches Vercel cron header) |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary Dashboard > Product Environment > Cloud Name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary Dashboard > API Keys |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary Dashboard > API Keys |
| `OTP_SECRET` | **Yes** | Generate: `openssl rand -base64 32` |
| `DEV_OTP_LOG` | **Yes** | Set to `"false"` (startup fails if true in production) |
| `RESEND_API_KEY` | Optional | Resend Console > API Keys (`re_...`) |
| `EMAIL_FROM` | Optional | Verified sender, e.g. `Purple Friday <orders@purplefriday.in>` |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Console > Redis Database > REST URL |
| `UPSTASH_REDIS_REST_TOKEN`| Optional | Upstash Console > Redis Database > REST Token |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | Web push public key |
| `VAPID_PRIVATE_KEY` | Optional | Web push private key |
| `VAPID_SUBJECT` | Optional | e.g. `mailto:admin@purplefriday.in` |

## 2. Deployment Steps
1. **Push Repository**: Ensure all local assets (`../purple-friday-assets`) remain outside Git.
2. **Import Project into Vercel**: Framework preset: **Next.js**, Root Directory: `./` (or `purple-friday`).
3. **Build Command**: Set Build Command to `npm run vercel-build` (runs migrations + build).
4. **Deploy**: Trigger initial build. Vercel runs Prisma migrations and Next.js static optimization.
5. **Bootstrap Admin**: In Vercel CLI or deploy console, run `npm run seed:prod-admin` to provision single Superadmin.
6. **Verify Health**: Check `https://<domain>/api/health` returns `{"ok":true}`.
