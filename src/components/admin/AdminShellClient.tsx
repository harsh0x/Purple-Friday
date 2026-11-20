"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

interface AdminShellClientProps {
  userName?: string | null;
  userRole?: string | null;
  children: React.ReactNode;
}

export function AdminShellClient({
  userName,
  userRole,
  children,
}: AdminShellClientProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#110D1A] flex flex-col md:flex-row antialiased text-[#15101F]">
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

        {/* Content surface: Soft paper surface with subtle violet mesh */}
        <main className="flex-1 m-4 p-5 sm:p-8 bg-[#F5F0E8] rounded-3xl border border-[#15101F]/10 shadow-xl overflow-y-auto min-h-[calc(100vh-120px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
