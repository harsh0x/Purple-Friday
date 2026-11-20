import type { Metadata } from "next";
import { bricolage, instrumentSans, dmMono } from "@/lib/fonts";
import { Toaster } from "@/components/ui/sonner";
import { LenisProvider } from "@/components/motion/LenisProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "Purple Friday | Custom Printed Products & Corporate Merch India",
    template: "%s | Purple Friday",
  },
  description:
    "Production-grade custom printing for magnetic badges, t-shirts, hoodies, caps, bottles, and corporate gift sets. High-definition preview and tier pricing in rupees.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://purplefriday.in"),
  openGraph: {
    title: "Purple Friday | Custom Printed Merchandise & Corporate Swag",
    description:
      "Direct-to-floor custom printing for Indian startups and teams. Magnetic badges, bio-washed cotton apparel, and laser-engraved executive kits.",
    url: "https://purplefriday.in",
    siteName: "Purple Friday",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Purple Friday | Custom Printed Merchandise India",
    description: "Proof-ready custom merchandise with bulk quantity pricing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${bricolage.variable} ${instrumentSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Intercept and suppress external chrome-extension errors (e.g. Urban VPN M_ID injection) */}
        <script
          id="suppress-extension-errors"
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window==='undefined')return;function isExtErr(e){var s=(e&&e.stack)||'';var m=(e&&e.message)||'';var f=(e&&e.filename)||'';return f.indexOf('chrome-extension://')!==-1||s.indexOf('chrome-extension://')!==-1||m.indexOf('M_ID')!==-1||m.indexOf('bis_skin_checked')!==-1;}window.addEventListener('error',function(ev){if(isExtErr(ev)||isExtErr(ev.error)){ev.preventDefault();ev.stopImmediatePropagation();return true;}},true);window.addEventListener('unhandledrejection',function(ev){if(isExtErr(ev.reason)){ev.preventDefault();ev.stopImmediatePropagation();}},true);})();`,
          }}
        />
      </head>
      <body className="font-sans bg-paper text-ink antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        {/* WCAG AA Accessible Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet focus:text-white focus:font-mono focus:text-xs focus:rounded-sm focus:shadow-stamp"
        >
          Skip to main content
        </a>

        {/* Global Notifications */}
        <Toaster />

        {/* Global Organization & WebSite JSON-LD */}
        <script
          id="organization-schema-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://purplefriday.in/#organization",
                  name: "Purple Friday",
                  url: "https://purplefriday.in",
                  logo: "https://purplefriday.in/favicon.ico",
                  description:
                    "Production-grade custom printing for magnetic badges, t-shirts, hoodies, caps, and corporate gift sets in India.",
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: "42/1, 1st Cross, HSR Layout Sector 3",
                    addressLocality: "Bengaluru",
                    addressRegion: "Karnataka",
                    postalCode: "560102",
                    addressCountry: "IN",
                  },
                  contactPoint: {
                    "@type": "ContactPoint",
                    telephone: "+919876543210",
                    contactType: "customer service",
                    areaServed: "IN",
                    availableLanguage: ["en", "hi"],
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://purplefriday.in/#website",
                  url: "https://purplefriday.in",
                  name: "Purple Friday",
                  publisher: {
                    "@id": "https://purplefriday.in/#organization",
                  },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://purplefriday.in/search?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />

        <AuthProvider>
          <LenisProvider>
            <StorefrontShell>{children}</StorefrontShell>
          </LenisProvider>
        </AuthProvider>
      </body>
    </html >
  );
}
