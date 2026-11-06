"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-paper-pure group-[.toaster]:text-ink group-[.toaster]:border-ink group-[.toaster]:shadow-stamp group-[.toaster]:rounded-sm group-[.toaster]:font-sans",
          description: "group-[.toast]:text-ink/70 group-[.toast]:font-mono text-xs",
          actionButton:
            "group-[.toast]:bg-violet group-[.toast]:text-white group-[.toast]:font-mono group-[.toast]:text-xs group-[.toast]:rounded-sm",
          cancelButton:
            "group-[.toast]:bg-paper-dark group-[.toast]:text-ink group-[.toast]:font-mono group-[.toast]:text-xs group-[.toast]:rounded-sm",
        },
      }}
    />
  );
}

