"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  renderMockupToCanvas,
  PrintArea,
  PrintMethod,
  SurfaceType,
} from "@/lib/mockup-canvas";

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
  template?: MockupTemplateType | string;
  slug?: string;
  color?: string;
  logoUrl?: string | null;
  className?: string;
  view?: "front" | "back";
  size?: "thumb" | "card" | "gallery";
  printArea?: PrintArea;
  printMethod?: PrintMethod;
  surface?: SurfaceType;
  showBadge?: boolean;
}

// Map generic template nicknames to canonical catalogue slugs
const TEMPLATE_TO_SLUG: Record<string, string> = {
  tee: "classic-crewneck-tshirt",
  tshirt: "classic-crewneck-tshirt",
  polo: "executive-pique-polo",
  hoodie: "classic-pullover-hoodie",
  sweatshirt: "minimalist-crewneck-sweatshirt",
  cap: "structured-cotton-twill-cap",
  hat: "unstructured-dad-hat",
  badge: "round-gloss-badge-58mm",
  pin: "metallic-gold-lapel-badge",
  pen: "executive-brass-twist-pen",
  keychain: "steel-engraved-keychain",
  notebook: "hardbound-leather-journal-a5",
  diary: "hardbound-leather-journal-a5",
  journal: "hardbound-leather-journal-a5",
  bottle: "matte-insulated-steel-flask",
  flask: "matte-insulated-steel-flask",
  mug: "ceramic-coffee-mug",
};

// Sensible default print areas per product archetype
const DEFAULT_PRINT_CONFIGS: Record<
  string,
  {
    front: PrintArea;
    back?: PrintArea;
    printMethod: PrintMethod;
    surface: SurfaceType;
  }
> = {
  // Badges
  "round-gloss-badge-58mm": {
    front: { x: 26, y: 26, width: 48, height: 48 },
    printMethod: "print",
    surface: "flat",
  },
  "matte-rectangle-name-badge": {
    front: { x: 20, y: 38, width: 60, height: 24 },
    printMethod: "print",
    surface: "flat",
  },
  "metallic-gold-lapel-badge": {
    front: { x: 30, y: 30, width: 40, height: 40 },
    printMethod: "engrave",
    surface: "flat",
  },
  "clear-acrylic-conference-badge": {
    front: { x: 26, y: 32, width: 48, height: 48 },
    printMethod: "print",
    surface: "flat",
  },

  // T-Shirts
  "classic-crewneck-tshirt": {
    front: { x: 36, y: 26, width: 28, height: 28 },
    back: { x: 33, y: 22, width: 34, height: 32 },
    printMethod: "print",
    surface: "flat",
  },
  "heavyweight-oversized-tee": {
    front: { x: 35, y: 26, width: 30, height: 30 },
    back: { x: 32, y: 22, width: 36, height: 34 },
    printMethod: "print",
    surface: "flat",
  },
  "sports-performance-tee": {
    front: { x: 36, y: 26, width: 28, height: 28 },
    back: { x: 33, y: 22, width: 34, height: 32 },
    printMethod: "print",
    surface: "flat",
  },
  "premium-organic-cotton-tee": {
    front: { x: 36, y: 26, width: 28, height: 28 },
    back: { x: 33, y: 22, width: 34, height: 32 },
    printMethod: "print",
    surface: "flat",
  },

  // Polos
  "executive-pique-polo": {
    front: { x: 55, y: 28, width: 20, height: 20 },
    back: { x: 34, y: 24, width: 32, height: 28 },
    printMethod: "embroidery",
    surface: "flat",
  },
  "contrast-tipped-polo": {
    front: { x: 55, y: 28, width: 20, height: 20 },
    back: { x: 34, y: 24, width: 32, height: 28 },
    printMethod: "embroidery",
    surface: "flat",
  },
  "drifit-team-polo": {
    front: { x: 55, y: 28, width: 20, height: 20 },
    back: { x: 34, y: 24, width: 32, height: 28 },
    printMethod: "print",
    surface: "flat",
  },
  "heavyweight-uniform-polo": {
    front: { x: 55, y: 28, width: 20, height: 20 },
    back: { x: 34, y: 24, width: 32, height: 28 },
    printMethod: "embroidery",
    surface: "flat",
  },

  // Hoodies
  "classic-pullover-hoodie": {
    front: { x: 35, y: 30, width: 30, height: 24 },
    back: { x: 32, y: 26, width: 36, height: 32 },
    printMethod: "print",
    surface: "flat",
  },
  "metal-zipper-fleece-jacket": {
    front: { x: 56, y: 30, width: 20, height: 20 },
    back: { x: 32, y: 26, width: 36, height: 32 },
    printMethod: "embroidery",
    surface: "flat",
  },
  "minimalist-crewneck-sweatshirt": {
    front: { x: 35, y: 28, width: 30, height: 28 },
    back: { x: 32, y: 24, width: 36, height: 32 },
    printMethod: "print",
    surface: "flat",
  },
  "varsity-raglan-hoodie": {
    front: { x: 35, y: 30, width: 30, height: 24 },
    back: { x: 32, y: 26, width: 36, height: 32 },
    printMethod: "print",
    surface: "flat",
  },

  // Caps
  "structured-cotton-twill-cap": {
    front: { x: 36, y: 44, width: 28, height: 20 },
    printMethod: "embroidery",
    surface: "curved",
  },
  "trucker-mesh-snapback-cap": {
    front: { x: 36, y: 44, width: 28, height: 20 },
    printMethod: "print",
    surface: "curved",
  },
  "unstructured-dad-hat": {
    front: { x: 36, y: 44, width: 28, height: 20 },
    printMethod: "embroidery",
    surface: "curved",
  },
  "performance-running-visor": {
    front: { x: 36, y: 46, width: 28, height: 18 },
    printMethod: "print",
    surface: "curved",
  },

  // Corporate Gifts
  "matte-insulated-steel-flask": {
    front: { x: 38, y: 40, width: 24, height: 26 },
    printMethod: "engrave",
    surface: "curved",
  },
  "hardbound-leather-journal-a5": {
    front: { x: 32, y: 36, width: 36, height: 36 },
    printMethod: "emboss",
    surface: "flat",
  },
  "executive-brass-twist-pen": {
    front: { x: 42, y: 38, width: 16, height: 26 },
    printMethod: "engrave",
    surface: "curved",
  },
  "steel-engraved-keychain": {
    front: { x: 36, y: 38, width: 28, height: 28 },
    printMethod: "engrave",
    surface: "flat",
  },
};

export function ProductMockup({
  template,
  slug: explicitSlug,
  color,
  logoUrl,
  className = "w-full h-full",
  view = "front",
  size = "card",
  printArea,
  printMethod,
  surface,
  showBadge = false,
}: ProductMockupProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  // Only render a dynamic composite if an explicit logo is passed via props (e.g. Hero preview)
  const effectiveLogo = logoUrl ? logoUrl : null;

  // Resolve canonical slug
  let resolvedSlug = explicitSlug || "";
  if (!resolvedSlug && template) {
    const norm = template.toLowerCase().trim();
    resolvedSlug = TEMPLATE_TO_SLUG[norm] || norm;
  }
  if (!resolvedSlug) {
    resolvedSlug = "classic-crewneck-tshirt";
  }

  // Get configuration
  const config =
    DEFAULT_PRINT_CONFIGS[resolvedSlug] ||
    DEFAULT_PRINT_CONFIGS["classic-crewneck-tshirt"];

  const effectivePrintArea =
    printArea || (view === "back" && config.back ? config.back : config.front);
  const effectivePrintMethod = printMethod || config.printMethod;
  const effectiveSurface = surface || config.surface;

  // Determine image and mask paths
  const viewFile = view === "back" ? "back" : "front";
  const photoUrl = `/products/${resolvedSlug}/${viewFile}.webp`;
  const maskUrl = `/products/${resolvedSlug}/mask-${viewFile}.png`;
  const staticFallback = `/products/${resolvedSlug}/${view === "back" ? "back-" : ""}${size}.webp`;

    useEffect(() => {
      let isCancelled = false;

        const render = async () => {
          if (!effectiveLogo) {
            setIsRendered(false);
            return;
          }
          const canvas = canvasRef.current;
          const container = containerRef.current;
          if (!canvas || !container) return;

          const rect = container.getBoundingClientRect();
          const displayWidth = Math.max(120, Math.round(rect.width || 320));
          const displayHeight = Math.max(120, Math.round(rect.height || 320));

          const dpr = Math.min(2, window.devicePixelRatio || 1);
          canvas.width = Math.round(displayWidth * dpr);
          canvas.height = Math.round(displayHeight * dpr);

            try {
              await renderMockupToCanvas(canvas, {
                photoUrl,
                maskUrl,
                color,
                logoUrl: effectiveLogo,
                printArea: effectivePrintArea,
                printMethod: effectivePrintMethod,
                surface: effectiveSurface,
                dpr,
              });

          if (!isCancelled) {
            setIsRendered(true);
          }
        } catch {
          // Fall back gracefully to static image without throwing
          if (!isCancelled) {
            setIsRendered(false);
          }
        }
      };

    // Debounce render slightly for rapid swatch switching
    const timer = setTimeout(render, 30);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    photoUrl,
    maskUrl,
    color,
    effectiveLogo,
    effectivePrintArea,
    effectivePrintMethod,
    effectiveSurface,
  ]);

      return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden flex items-center justify-center bg-paper-pure select-none ${className}`}
      >
        {effectiveLogo ? (
          <>
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-contain transition-opacity duration-300 ${isRendered ? "opacity-100" : "opacity-0"
                }`}
            />
            {!isRendered && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={staticFallback}
                alt={resolvedSlug}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                loading="lazy"
              />
            )}
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staticFallback}
            alt={resolvedSlug}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />
        )}

      {showBadge && (
        <span className="absolute bottom-2 left-2 z-10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider bg-ink/80 text-white rounded-xs backdrop-blur-xs">
          Studio Proof
        </span>
      )}
    </div>
  );
}
