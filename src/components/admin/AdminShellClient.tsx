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
          className={`min-h-screen flex flex-col md:flex-row antialiased transition-colors duration-200 ${isDark ? "bg-[#0F0D15] text-[#F4F3F8]" : "bg-[#110D1A] text-[#15101F]"
            }`}
        >
          {/* Floating rounded frosted ink sidebar */}
          <AdminSidebar
            userRole={userRole}
            isOpenMobile={mobileDrawerOpen}
            onCloseMobile={() => setMobileDrawerOpen(false)}
          />

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
            {/* Floating rounded frosted ink top bar */}
            <AdminTopBar
              userName={userName}
              userRole={userRole}
              onOpenMobileMenu={() => setMobileDrawerOpen(true)}
            />

              {/* Content surface: Adapts to Light (Warm Paper) or Dark (Obsidian / Slate) */}
              <main
                className={`flex-1 m-4 p-5 sm:p-8 rounded-3xl border shadow-xl overflow-y-auto min-h-[calc(100vh-120px)] transition-colors duration-200 ${isDark
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
