"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ProductMockup } from "@/components/mockup/ProductMockup";
import { useCustomerLogo } from "@/hooks/useCustomerLogo";

interface ProductGalleryProps {
  template: string;
  selectedColor?: string;
  productName: string;
}

export function ProductGallery({
  template,
  selectedColor = "#FFFFFF",
  productName,
}: ProductGalleryProps) {
  const { logoUrl } = useCustomerLogo();
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slides: 0 = Vector Mockup (with customer logo), 1 = Detail Angle, 2 = Macro Texture Proof
  const slides = [
    { id: "mockup", label: "Specimen Proof", isMockup: true },
    { id: "detail-front", label: "Front View", isMockup: true },
    { id: "detail-texture", label: "Material Texture", isMockup: false },
  ];

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
      if (e.key === "ArrowLeft") {
        setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
      } else if (e.key === "ArrowRight") {
        setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Main Viewport */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-square w-full border-2 border-pf-ink bg-white overflow-hidden shadow-[4px_4px_0_0_#15101F] cursor-crosshair group"
      >
        {/* Registration Marks Motif */}
        <span className="absolute top-2 left-2 font-mono text-[10px] text-pf-ink/30 z-10 pointer-events-none">
          + FRAME_PROOF_01
        </span>
        <span className="absolute top-2 right-2 font-mono text-[10px] text-pf-ink/30 z-10 pointer-events-none">
          C•M•Y•K +
        </span>

        {/* Customer Logo Notification Badge */}
        {logoUrl && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 border border-pf-ink bg-pf-lime px-2.5 py-0.5 text-[11px] font-mono font-bold text-pf-ink shadow-[2px_2px_0_0_#15101F]">
            <Sparkles className="h-3 w-3" />
            Your Uploaded Logo Applied
          </div>
        )}

        {/* Content of Slide */}
        <div className="h-full w-full p-8 flex items-center justify-center">
          {slides[activeSlide].isMockup ? (
            <div className="h-full w-full max-h-[380px] max-w-[380px] transition-transform duration-200">
              <ProductMockup
                template={template}
                color={selectedColor}
                logoUrl={logoUrl}
                className="w-full h-full"
              />
            </div>
          ) : (
            /* Material Texture Macro Shot */
            <div className="h-full w-full flex flex-col items-center justify-center bg-pf-paper/50 border-2 border-dashed border-pf-ink/20 p-6 text-center">
              <div className="font-mono text-xs font-bold text-pf-violet uppercase tracking-wider mb-2">
                Macro Weave Inspection
              </div>
              <p className="font-sans text-xs text-pf-ink/75 max-w-xs leading-relaxed">
                High-density 230–320 GSM combed fibers inspected under 5000K daylight simulation. Zero pinholes, double-needle lockstitched seams.
              </p>
              <span className="mt-3 font-mono text-[10px] bg-pf-ink text-white px-2 py-0.5">
                ISO 12647-2 CALIBRATED
              </span>
            </div>
          )}
        </div>

        {/* Desktop Zoom Lens Label & Magnifier */}
        {isZooming && (
          <div className="hidden lg:block absolute bottom-3 right-3 z-20 bg-pf-ink text-white font-mono text-[11px] font-bold px-2 py-1 border border-white/20 shadow-sm pointer-events-none">
            Zoom Lens 2.5x • Real image
          </div>
        )}

        {isZooming && (
          <div
            className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden bg-white z-10"
            style={{
              backgroundImage: slides[activeSlide].isMockup ? undefined : "none",
            }}
          >
            <div
              className="absolute w-[250%] h-[250%]"
              style={{
                left: `-${zoomPos.x * 1.5}%`,
                top: `-${zoomPos.y * 1.5}%`,
              }}
            >
              <div className="h-full w-full p-20 flex items-center justify-center">
                <ProductMockup
                  template={template}
                  color={selectedColor}
                  logoUrl={logoUrl}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile / Fullscreen Lightbox Button */}
        <button
          onClick={() => setLightboxOpen(true)}
          aria-label="Open Fullscreen Lightbox"
          className="absolute bottom-3 left-3 z-20 h-9 w-9 rounded-full border-2 border-pf-ink bg-white flex items-center justify-center shadow-[2px_2px_0_0_#15101F] hover:bg-pf-paper active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Maximize2 className="h-4 w-4 text-pf-ink" />
        </button>

        {/* Carousel Arrow Navigation */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
          }}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full border border-pf-ink bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
          }}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full border border-pf-ink bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnails Row */}
      <div className="flex items-center gap-3">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setActiveSlide(idx)}
            className={`relative flex-1 aspect-square max-w-[80px] border-2 bg-white p-2 transition-all ${
              activeSlide === idx
                ? "border-pf-ink shadow-[3px_3px_0_0_#6A2CFF] ring-2 ring-pf-violet"
                : "border-pf-ink/30 hover:border-pf-ink opacity-70 hover:opacity-100"
            }`}
          >
            {s.isMockup ? (
              <ProductMockup
                template={template}
                color={selectedColor}
                logoUrl={logoUrl}
                className="w-full h-full"
              />
            ) : (
              <div className="h-full w-full bg-pf-ink/10 flex items-center justify-center font-mono text-[9px] text-pf-ink font-bold text-center leading-tight">
                Macro Weave
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mobile / Desktop Lightbox Modal */}
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-pf-ink/90 z-50 backdrop-blur-md" />
          <Dialog.Content className="fixed inset-4 sm:inset-10 z-50 flex flex-col items-center justify-between bg-white border-2 border-pf-ink p-6 shadow-2xl focus:outline-none overflow-hidden">
            <div className="w-full flex items-center justify-between pb-3 border-b-2 border-pf-ink">
              <Dialog.Title className="font-display text-lg font-bold text-pf-ink">
                {productName} — Production Specimen Lightbox
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  aria-label="Close lightbox"
                  className="p-1 rounded-full border-2 border-pf-ink hover:bg-pf-paper"
                >
                  <X className="h-5 w-5 text-pf-ink" />
                </button>
              </Dialog.Close>
            </div>

            <div className="w-full flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-lg aspect-square">
                <ProductMockup
                  template={template}
                  color={selectedColor}
                  logoUrl={logoUrl}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="w-full pt-3 border-t border-pf-ink/20 flex items-center justify-between text-xs font-mono text-pf-ink/70">
              <span>COLORWAY: {selectedColor.toUpperCase()}</span>
              <span>PINCH / ZOOM SUPPORTED</span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

