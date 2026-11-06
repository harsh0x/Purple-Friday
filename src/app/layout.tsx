import type { Metadata } from "next";
import { bricolage, instrumentSans, dmMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Purple Friday | Custom Printed Products & Corporate Merch India",
  description:
    "Production-grade custom printing for magnetic badges, t-shirts, hoodies, caps, bottles, and corporate gift sets. High-definition preview and tier pricing in rupees.",
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
          <body className="font-sans bg-paper text-ink antialiased min-h-screen">
            {children}
          </body>
        </html>
        );
}
