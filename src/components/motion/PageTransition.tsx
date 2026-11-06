"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-editorial w-full flex-1"
    >
      {children}
    </div>
  );
}

