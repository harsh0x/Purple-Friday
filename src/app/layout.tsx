import type { Metadata } from "next";
import { bricolage, instrumentSans, dmMono } from "@/lib/fonts";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchDrawer } from "@/components/drawers/SearchDrawer";
import { CartDrawer } from "@/components/drawers/CartDrawer";
import { WishlistDrawer } from "@/components/drawers/WishlistDrawer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Purple Friday | Custom Printed Products & Corporate Merch India",
  description:
    "Production-grade custom printing for magnetic badges, t-shirts, hoodies, caps, bottles, and corporate gift sets. High-definition preview and tier pricing in rupees.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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
    >
      <body className="font-sans bg-paper text-ink antialiased min-h-screen flex flex-col">
        {/* WCAG AA Accessible Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet focus:text-white focus:font-mono focus:text-xs focus:rounded-sm focus:shadow-stamp"
        >
          Skip to main content
        </a>

        {/* Global Notifications */}
        <Toaster />

        {/* Global Drawers */}
        <SearchDrawer />
        <CartDrawer />
        <WishlistDrawer />

        {/* App Shell Header */}
        <AnnouncementBar />
        <Header />

        {/* Main Content Landmark */}
        <main id="main-content" className="flex-1">
          {children}
        </main>

        {/* App Shell Footer */}
        <Footer />
      </body>
    </html>
  );
}
