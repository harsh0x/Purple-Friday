import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAdminSessionToken, touchAdminSession, applyAdminSessionCookie, ADMIN_COOKIE_NAME } from "@/lib/admin/admin-session";
import { hasPermission, getRoleHomeScreen, isStaffRole, Permission } from "@/lib/admin/permissions";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Dedicated Admin Route Protection
  if (pathname.startsWith("/admin")) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const sessionResult = verifyAdminSessionToken(adminCookie);

    // Allow access to login page
    if (pathname === "/admin/login") {
      if (sessionResult.valid && sessionResult.session) {
        // Already authenticated staff -> redirect to role home
        const homeUrl = new URL(getRoleHomeScreen(sessionResult.session.role), request.url);
        return NextResponse.redirect(homeUrl);
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

    // If no valid staff session exists
    if (!effectiveRole || !isStaffRole(effectiveRole)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      if (sessionResult.reason && sessionResult.reason.includes("expired")) {
        loginUrl.searchParams.set("reason", "expired");
      }
      return NextResponse.redirect(loginUrl);
    }

    // Role-specific permission enforcement
    const requiredPermissionMap: Record<string, Permission> = {
      "/admin/team": "admin:manage_team",
      "/admin/audit": "admin:view_audit",
      "/admin/settings": "admin:manage_settings",
    };

    const matchedPrefix = Object.keys(requiredPermissionMap).find((prefix) => pathname.startsWith(prefix));
    if (matchedPrefix) {
      const perm = requiredPermissionMap[matchedPrefix];
      if (!hasPermission(effectiveRole, perm)) {
        const homeUrl = new URL(getRoleHomeScreen(effectiveRole), request.url);
        homeUrl.searchParams.set("error", "Unauthorized");
        return NextResponse.redirect(homeUrl);
      }
    }

    const response = NextResponse.next();

    // Touch idle session timestamp if valid session cookie present
    if (effectiveSession) {
      const touchedToken = touchAdminSession(effectiveSession);
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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://challenges.cloudflare.com`,
    `frame-src 'self' https://api.razorpay.com https://challenges.cloudflare.com`,
    `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://res.cloudinary.com https://challenges.cloudflare.com https://generativelanguage.googleapis.com`,
    `img-src 'self' data: blob: https://res.cloudinary.com`,
    `style-src 'self' 'unsafe-inline'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `report-uri /api/csp-report`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set Enforcing Security Headers
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-nonce", nonce);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Camera scoped only to /design route for logo live capture
  const isDesignRoute = pathname.startsWith("/design");
  const cameraPolicy = isDesignRoute ? "camera=(self)" : "camera=()";
  response.headers.set(
    "Permissions-Policy",
    `${cameraPolicy}, microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")`
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
