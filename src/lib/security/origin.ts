import { NextRequest } from "next/server";

/**
 * Validates that an incoming API mutation originates from the same site.
 * Protects against Cross-Site Request Forgery (CSRF).
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin) {
    const fetchSite = req.headers.get("sec-fetch-site");
    if (fetchSite === "same-origin" || fetchSite === "same-site") return true;
    // Allow in test/dev environment if explicitly local
    if (process.env.NODE_ENV === "test") return true;
    return false;
  }

  try {
    const originUrl = new URL(origin);
    // Compare host and port
    if (originUrl.host === host) {
      return true;
    }

    // Compare with configured site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      const allowed = new URL(siteUrl);
      if (originUrl.host === allowed.host) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

