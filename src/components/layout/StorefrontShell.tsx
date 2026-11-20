"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchDrawer } from "@/components/drawers/SearchDrawer";
import { CartDrawer } from "@/components/drawers/CartDrawer";
import { WishlistDrawer } from "@/components/drawers/WishlistDrawer";
import { PurpleAssistant } from "@/components/chat/PurpleAssistant";
import { PageTransition } from "@/components/motion/PageTransition";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // Pure Admin Layout: Zero storefront header, footer, announcement bar, drawers, or floating widgets
    return (
      <main id="main-content" className="flex-1 flex flex-col w-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <SearchDrawer />
      <CartDrawer />
      <WishlistDrawer />
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="flex-1 flex flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <PurpleAssistant />
    </>
  );
}
