"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pf-customer-logo";

export function useCustomerLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Read from sessionStorage on client mount
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) setLogoUrl(stored);
      } catch {
        // sessionStorage restricted
      }
    }

    // Listen to custom logo update event across components
    const handleLogoUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>;
      setLogoUrl(customEvent.detail);
    };

    window.addEventListener("pf-logo-updated", handleLogoUpdate);
    return () => window.removeEventListener("pf-logo-updated", handleLogoUpdate);
  }, []);

  const saveLogo = (url: string | null) => {
    setLogoUrl(url);
    if (typeof window !== "undefined") {
      try {
        if (url) {
          sessionStorage.setItem(STORAGE_KEY, url);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
        window.dispatchEvent(
          new CustomEvent<string | null>("pf-logo-updated", { detail: url })
        );
      } catch {
        // Ignore
      }
    }
  };

  return { logoUrl, setLogoUrl: saveLogo };
}

