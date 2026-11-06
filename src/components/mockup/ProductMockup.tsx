"use client";

import React from "react";
import { TeeTemplate } from "./templates/TeeTemplate";
import { PoloTemplate } from "./templates/PoloTemplate";
import { HoodieTemplate } from "./templates/HoodieTemplate";
import { CapTemplate } from "./templates/CapTemplate";
import { RoundBadgeTemplate } from "./templates/RoundBadgeTemplate";
import { PenTemplate } from "./templates/PenTemplate";
import { KeychainTemplate } from "./templates/KeychainTemplate";
import { NotebookTemplate } from "./templates/NotebookTemplate";
import { BottleTemplate } from "./templates/BottleTemplate";
import { useCustomerLogo } from "@/hooks/useCustomerLogo";

export type MockupTemplateType =
  | "tee"
  | "polo"
  | "hoodie"
  | "cap"
  | "badge"
  | "pen"
  | "keychain"
  | "notebook"
  | "bottle";

export interface ProductMockupProps {
  template: MockupTemplateType | string;
  color?: string;
  logoUrl?: string | null;
  className?: string;
  view?: "front" | "back";
}

export function ProductMockup({
  template,
  color,
  logoUrl,
  className = "w-full h-full",
  view = "front",
}: ProductMockupProps) {
  const { logoUrl: sessionLogo } = useCustomerLogo();
  const effectiveLogo = logoUrl !== undefined ? logoUrl || undefined : sessionLogo || undefined;

  // Normalize template name
  const normalized = (template || "").toLowerCase();

  if (normalized.includes("polo")) {
    return <PoloTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }
  if (normalized.includes("hoodie") || normalized.includes("sweatshirt")) {
    return <HoodieTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }
  if (normalized.includes("cap") || normalized.includes("hat")) {
    return <CapTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }
  if (normalized.includes("badge") || normalized.includes("pin")) {
    return <RoundBadgeTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }
  if (normalized.includes("pen")) {
    return <PenTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }
  if (normalized.includes("keychain") || normalized.includes("keyring")) {
    return <KeychainTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }
  if (normalized.includes("notebook") || normalized.includes("diary") || normalized.includes("journal")) {
    return <NotebookTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }
  if (normalized.includes("bottle") || normalized.includes("sipper") || normalized.includes("flask")) {
    return <BottleTemplate color={color} logoUrl={effectiveLogo} className={className} />;
  }

  // Default to T-shirt
  return <TeeTemplate color={color} logoUrl={effectiveLogo} className={className} view={view} />;
}
