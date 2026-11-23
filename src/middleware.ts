import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAdminSessionToken, touchAdminSession, applyAdminSessionCookie, ADMIN_COOKIE_NAME } from "@/lib/admin/admin-session";
import { isStaffRole } from "@/lib/admin/permissions";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Dedicated Admin Route Protection
  if (pathname.startsWith("/admin")) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const sessionResult = await verifyAdminSessionToken(adminCookie);

    // Allow access to login page
    if (pathname === "/admin/login") {
      if (sessionResult.valid && sessionResult.session) {
        // Already authenticated admin -> redirect to /admin
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // Attempt NextAuth fallback for development backwards compatibility
    let effectiveRole: string | null = null;
    const effectiveSession = sessionResult.session;

    if (sessionResult.valid && sessionResult.session) {
      effectiveRole = sessionResult.session.role;
    } else {
      const nextAuthToken = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET || "pf_super_secret_jwt_key_2026_dev_fallback",
      });
      if (nextAuthToken && isStaffRole(nextAuthToken.role as string)) {
        effectiveRole = nextAuthToken.role as string;
      }
    }

    // If no valid admin session exists
    if (!effectiveRole || !isStaffRole(effectiveRole)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      if (sessionResult.reason && sessionResult.reason.includes("expired")) {
        loginUrl.searchParams.set("reason", "expired");
      }
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();

    // Touch idle session timestamp if valid session cookie present
    if (effectiveSession) {
      const touchedToken = await touchAdminSession(effectiveSession);
      applyAdminSessionCookie(response, touchedToken);
    }

    // Admin security & no-cache headers
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  }

  // 2. Customer Storefront Route Protection
  if (pathname.startsWith("/account")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "pf_super_secret_jwt_key_2026_dev_fallback",
    });

    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Generate random base64 nonce for CSP script validation
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Content-Security-Policy in ENFORCING mode for production security
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : ""}`.trim(),
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' blob: data: https://images.unsplash.com https://res.cloudinary.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `frame-src 'none'`,
    `connect-src 'self' https://api.resend.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `block-all-mixed-content`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Strict Production HTTP Security Headers
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|assets/).*)",
  ],
};
