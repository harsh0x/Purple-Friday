import React from "react";
import { Metadata } from "next";
import { getAdminSession } from "@/lib/admin/admin-session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole } from "@/lib/admin/permissions";
import { AdminShellClient } from "@/components/admin/AdminShellClient";

export const metadata: Metadata = {
  title: "Admin Control Room | Purple Friday",
  description: "Internal operations and management atelier for Purple Friday.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminSession = await getAdminSession();
  let userName = adminSession?.name;
  let userRole = adminSession?.role;

  // Fallback to NextAuth session if active
  if (!userName || !userRole) {
    const nextAuthSession = await getServerSession(authOptions);
    const role = (nextAuthSession?.user as { role?: string })?.role;
    if (role && isStaffRole(role)) {
      userName = nextAuthSession?.user?.name || "Staff Member";
      userRole = role as typeof userRole;
    }
  }

  // If unauthenticated (e.g. on /admin/login), render without shell wrapper
  if (!userRole || !isStaffRole(userRole)) {
    return (
      <div data-admin-root="true" className="min-h-screen bg-[#15101F] text-white admin-portal admin-dark font-sans">
        {children}
      </div>
    );
  }

  return (
    <AdminShellClient userName={userName} userRole={userRole}>
      {children}
    </AdminShellClient>
  );
}
