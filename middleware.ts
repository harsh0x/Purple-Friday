import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Generate random base64 nonce for CSP script validation
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Content-Security-Policy in REPORT-ONLY mode for Part 1 & Part 2
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com`,
    `frame-src 'self' https://api.razorpay.com`,
    `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com`,
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
  requestHeaders.set("Content-Security-Policy-Report-Only", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set Security Headers
  response.headers.set("Content-Security-Policy-Report-Only", cspHeader);
  response.headers.set("x-nonce", nonce);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")'
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

