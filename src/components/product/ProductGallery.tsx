"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X, ChevronLeft, ChevronRight, Sparkles, ZoomIn } from "lucide-react";
import { ProductMockup } from "@/components/mockup/ProductMockup";
import { useCustomerLogo } from "@/hooks/useCustomerLogo";

interface ProductGalleryProps {
  template: string;
  slug?: string;
  selectedColor?: string;
  productName: string;
  isApparel?: boolean;
}

export function ProductGallery({
  template,
  slug,
  selectedColor = "#FFFFFF",
  productName,
  isApparel = false,
}: ProductGalleryProps) {
  const { logoUrl } = useCustomerLogo();
  const [activeView, setActiveView] = useState<"front" | "back">("front");
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move for desktop zoom lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - left) / width) * 100, 0), 100);
    const y = Math.min(Math.max(((e.clientY - top) / height) * 100, 0), 100);
    setZoomPos({ x, y });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        setActiveView((prev) => (prev === "front" ? "back" : "front"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Main Photographic Stage */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-square w-full border-2 border-ink bg-[#F5F3EF] overflow-hidden shadow-stamp group cursor-crosshair"
      >
        {/* Registration Marks Motif */}
        <span className="absolute top-2 left-2 font-mono text-[10px] text-ink/30 z-10 pointer-events-none">
          + PROOF_FRAME
        </span>
        <span className="absolute top-2 right-2 font-mono text-[10px] text-ink/30 z-10 pointer-events-none">
          {activeView === "front" ? "VIEW: FRONT" : "VIEW: REAR"} +
        </span>

        {/* Customer Logo Notification Badge */}
        {logoUrl && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 border border-ink bg-spot-lime px-2.5 py-0.5 text-[11px] font-mono font-bold text-ink shadow-stamp-sm">
            <Sparkles className="h-3 w-3" />
            Live Logo Projected
          </div>
        )}

        {/* Real Product Photo with Logo Compositing */}
        <div className="h-full w-full p-4 flex items-center justify-center relative">
          <ProductMockup
            slug={slug}
            template={template}
            color={selectedColor}
            view={activeView}
            size="gallery"
            showBadge
            className="w-full h-full max-h-[460px] max-w-[460px]"
          />

          {/* Desktop Hover Zoom Lens (Magnifies 2.5x) */}
          {isZooming && (
            <div
              className="hidden lg:block absolute pointer-events-none rounded-full border-2 border-ink shadow-2xl overflow-hidden bg-white z-30"
              style={{
                width: 140,
                height: 140,
                left: `calc(${zoomPos.x}% - 70px)`,
                top: `calc(${zoomPos.y}% - 70px)`,
              }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  transform: "scale(2.5)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
              >
                <ProductMockup
                  slug={slug}
                  template={template}
                  color={selectedColor}
                  view={activeView}
                  size="gallery"
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Fabric Macro Inset Bubble ("Real image" lens) */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <div className="h-16 w-16 rounded-full border-2 border-ink overflow-hidden shadow-stamp-sm bg-white/90 backdrop-blur-xs relative group/lens">
              <div className="w-full h-full scale-[2.2] origin-center flex items-center justify-center">
                <ProductMockup
                  slug={slug}
                  template={template}
                  color={selectedColor}
                  view={activeView}
                  size="thumb"
                  className="w-full h-full"
                />
              </div>
              <div className="absolute inset-0 bg-ink/10 flex items-center justify-center opacity-0 group-hover/lens:opacity-100 transition-opacity">
                <ZoomIn className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-ink/70 bg-white/80 px-1.5 py-0.5 rounded-xs border border-ink/20 shadow-xs">
              Fabric Weave 2.5x
            </span>
          </div>
        </div>

        {/* Left & Right Switcher Arrows for Apparel / Multi-View Products */}
        <button
          type="button"
          onClick={() => setActiveView((prev) => (prev === "front" ? "back" : "front"))}
          aria-label="Previous View"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border-2 border-ink bg-white/90 text-ink hover:bg-violet hover:text-white flex items-center justify-center shadow-stamp-sm transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveView((prev) => (prev === "front" ? "back" : "front"))}
          aria-label="Next View"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border-2 border-ink bg-white/90 text-ink hover:bg-violet hover:text-white flex items-center justify-center shadow-stamp-sm transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Fullscreen Expand Action */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open Fullscreen Lightbox"
          className="absolute bottom-3 right-3 z-20 h-8 w-8 rounded-xs border-2 border-ink bg-white text-ink hover:bg-spot-lime flex items-center justify-center shadow-stamp-sm transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Available Sizes Strip under the photo (Matches reference screenshot) */}
      {isApparel && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-paper-pure border border-ink/20 rounded-xs font-mono text-xs text-ink/80">
          <span className="font-bold text-[11px] text-ink uppercase">Available Sizes:</span>
          {["S", "M", "L", "XL", "2XL", "3XL", "4XL"].map((sz) => (
            <span
              key={sz}
              className="px-2 py-0.5 bg-paper rounded-xs border border-ink/20 font-bold text-[11px]"
            >
              {sz}
            </span>
          ))}
        </div>
      )}

      {/* View Switcher Thumbnails */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveView("front")}
          className={`py-2 px-3 border-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeView === "front"
              ? "border-violet bg-violet text-white shadow-stamp-sm"
              : "border-ink/20 bg-white text-ink hover:border-ink"
          }`}
        >
          <span>Front View (Chest)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView("back")}
          className={`py-2 px-3 border-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeView === "back"
              ? "border-violet bg-violet text-white shadow-stamp-sm"
              : "border-ink/20 bg-white text-ink hover:border-ink"
          }`}
        >
          <span>Rear View (Upper Back)</span>
        </button>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-4 sm:inset-12 z-50 bg-paper-pure border-2 border-ink p-6 rounded-sm shadow-2xl flex flex-col items-center justify-center max-w-4xl mx-auto my-auto overflow-hidden">
            <div className="w-full flex items-center justify-between pb-3 border-b border-ink/20 mb-4">
              <span className="font-display font-black text-lg text-ink">
                {productName} — 1:1 Scale Inspection
              </span>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close Lightbox"
                  className="p-1 border border-ink rounded-xs hover:bg-paper"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 w-full flex items-center justify-center max-h-[70vh]">
              <ProductMockup
                slug={slug}
                template={template}
                color={selectedColor}
                view={activeView}
                size="gallery"
                showBadge
                className="w-full h-full max-w-2xl max-h-full"
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
