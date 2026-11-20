"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { AdminThemeProvider, useAdminTheme } from "./AdminThemeContext";

interface AdminShellClientProps {
  userName?: string | null;
  userRole?: string | null;
  children: React.ReactNode;
}

  function AdminShellInner({
    userName,
    userRole,
    children,
  }: AdminShellClientProps) {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const { theme } = useAdminTheme();
    const isDark = theme === "dark";

    return (
      <div
        className={`relative min-h-screen flex flex-col md:flex-row antialiased transition-colors duration-200 overflow-x-hidden ${
          isDark ? "bg-[#0F0D15] text-[#F4F3F8]" : "bg-[#110D1A] text-[#15101F]"
        }`}
      >
        {/* Ambient background color depth behind the admin shell for liquid glass refraction & blur */}
        <div
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
          aria-hidden="true"
        >
          {/* Ambient violet radial orb behind sidebar area */}
          <div className="absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#7C3AED]/25 via-[#6A2CFF]/15 to-transparent blur-[80px]" />
          {/* Ambient indigo/electric glow lower on left */}
          <div className="absolute top-1/2 -left-24 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#6366F1]/18 via-[#8B5CF6]/12 to-transparent blur-[90px]" />
          {/* Ambient subtle lime rim highlight orb near bottom left */}
          <div className="absolute -bottom-24 left-16 w-[320px] h-[320px] rounded-full bg-gradient-to-t from-[#D9F99D]/8 via-[#7C3AED]/10 to-transparent blur-[70px]" />
          {/* Subtle top-right ambient depth */}
          <div className="absolute -top-32 right-1/4 w-[500px] h-[350px] rounded-full bg-[#7C3AED]/8 blur-[100px]" />
        </div>

        {/* Floating rounded liquid glass sidebar */}
        <div className="relative z-10 shrink-0">
          <AdminSidebar
            userRole={userRole}
            isOpenMobile={mobileDrawerOpen}
            onCloseMobile={() => setMobileDrawerOpen(false)}
          />
        </div>

        {/* Main Workspace */}
        <div className="relative z-10 flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          {/* Floating rounded frosted ink top bar */}
          <AdminTopBar
            userName={userName}
            userRole={userRole}
            onOpenMobileMenu={() => setMobileDrawerOpen(true)}
          />

          {/* Content surface: Adapts to Light (Warm Paper) or Dark (Obsidian / Slate) */}
          <main
            className={`flex-1 m-4 p-5 sm:p-8 rounded-3xl border shadow-xl overflow-y-auto min-h-[calc(100vh-120px)] transition-colors duration-200 ${
              isDark
                ? "bg-[#13111C] border-[#2A253B] text-[#F4F3F8]"
                : "bg-[#F5F0E8] border-[#15101F]/10 text-[#15101F]"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    );
}

        export function AdminShellClient(props: AdminShellClientProps) {
  return (
        <AdminThemeProvider>
          <AdminShellInner {...props} />
        </AdminThemeProvider>
        );
}
