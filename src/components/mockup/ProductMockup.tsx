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
  logoUrl?: string;
  className?: string;
}

export function ProductMockup({
  template,
  color,
  logoUrl,
  className = "w-full h-full",
}: ProductMockupProps) {
  // Normalize template name
  const normalized = (template || "").toLowerCase();

  if (normalized.includes("polo")) {
    return <PoloTemplate color={color} logoUrl={logoUrl} className={className} />;
  }
  if (normalized.includes("hoodie") || normalized.includes("sweatshirt")) {
    return <HoodieTemplate color={color} logoUrl={logoUrl} className={className} />;
  }
  if (normalized.includes("cap") || normalized.includes("hat")) {
    return <CapTemplate color={color} logoUrl={logoUrl} className={className} />;
  }
  if (normalized.includes("badge") || normalized.includes("pin")) {
    return <RoundBadgeTemplate color={color} logoUrl={logoUrl} className={className} />;
  }
  if (normalized.includes("pen")) {
    return <PenTemplate color={color} logoUrl={logoUrl} className={className} />;
  }
  if (normalized.includes("keychain") || normalized.includes("keyring")) {
    return <KeychainTemplate color={color} logoUrl={logoUrl} className={className} />;
  }
  if (normalized.includes("notebook") || normalized.includes("diary") || normalized.includes("journal")) {
    return <NotebookTemplate color={color} logoUrl={logoUrl} className={className} />;
  }
  if (normalized.includes("bottle") || normalized.includes("sipper") || normalized.includes("flask")) {
    return <BottleTemplate color={color} logoUrl={logoUrl} className={className} />;
  }

  // Default to T-shirt
  return <TeeTemplate color={color} logoUrl={logoUrl} className={className} />;
}

