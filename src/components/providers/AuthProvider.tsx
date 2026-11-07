"use client";

import React, { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

// Filter out third-party browser extension hydration warnings in development (e.g. Bitdefender bis_skin_checked)
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const errorString = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
    if (
      errorString.includes("bis_skin_checked") ||
      errorString.includes("bis_register") ||
      errorString.includes("cz-shortcut-listen") ||
      errorString.includes("fdprocessedid") ||
      errorString.includes("data-lastpass") ||
      errorString.includes("data-1p-ignore")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cleanAttrs = (el: Element) => {
        if (!el || !el.removeAttribute) return;
        if (el.hasAttribute("bis_skin_checked")) el.removeAttribute("bis_skin_checked");
        if (el.hasAttribute("bis_register")) el.removeAttribute("bis_register");
      };

      // Clean existing
      const elements = document.querySelectorAll("[bis_skin_checked], [bis_register]");
      elements.forEach(cleanAttrs);

      // Observe dynamic insertions by anti-tracker extensions
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "attributes" && m.attributeName?.startsWith("bis_")) {
            cleanAttrs(m.target as Element);
          } else if (m.addedNodes.length > 0) {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const el = node as Element;
                cleanAttrs(el);
                el.querySelectorAll?.("[bis_skin_checked], [bis_register]").forEach(cleanAttrs);
              }
            });
          }
        }
      });

      observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ["bis_skin_checked", "bis_register"],
      });

      return () => observer.disconnect();
    } catch {
      // Ignore extension-related DOM cleanup errors
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
