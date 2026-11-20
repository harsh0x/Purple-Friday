"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Move,
  Maximize2,
  RotateCw,
  Printer,
  Palette,
  CheckCircle2,
  Layers,
  Save,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { getPrintAreaForTemplate, PrintAreaBounds } from "@/lib/customizer/print-areas";

interface MockupPlacementEditorProps {
  orderNumber: string;
  itemId: string;
  productId: string;
  artworkUrl?: string | null;
  currentMockupUrl?: string | null;
  existingPlacement?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    pantone?: string;
    notes?: string;
  } | null;
  initialPrintMethod?: string | null;
  orderVersion: number;
  onMockupSaved?: (mockupUrl: string) => void;
}

const PRINT_METHODS = [
  { id: "DTF", label: "DTF (Direct to Film)", description: "High-density color, soft-hand finish on cotton & blends" },
  { id: "Sublimation", label: "Sublimation", description: "All-over dye infusion for ceramics, mugs & polyester" },
  { id: "Embroidery", label: "Embroidery", description: "Precision dimensional thread stitching with needle depth" },
  { id: "Laser Engraving", label: "Laser Engraving", description: "Permanent contrast rotary ablation on metal & wood" },
];

export function MockupPlacementEditor({
  orderNumber,
  itemId,
  productId,
  artworkUrl,
  currentMockupUrl,
  existingPlacement,
  initialPrintMethod = "DTF",
  orderVersion,
  onMockupSaved,
}: MockupPlacementEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Print bounds from product template
  const printBounds = getPrintAreaForTemplate(productId);

  // Position, scale, rotation within the print zone mask (0-100% relative to print zone)
  const [posX, setPosX] = useState(existingPlacement?.x ?? 50); // Centered (0 to 100)
  const [posY, setPosY] = useState(existingPlacement?.y ?? 50); // Centered (0 to 100)
  const [scale, setScale] = useState(existingPlacement?.width ?? 60); // 20% to 100%
  const [rotation, setRotation] = useState(existingPlacement?.rotation ?? 0); // 0 to 360 deg
  const [printMethod, setPrintMethod] = useState(initialPrintMethod || "DTF");
  const [pantone, setPantone] = useState(existingPlacement?.pantone ?? "");
  const [designerNotes, setDesignerNotes] = useState(existingPlacement?.notes ?? "");
  const [saving, setSaving] = useState(false);

  // Product template base image mock (clean background for preview)
  const productBaseUrl = productId.includes("hoodie")
    ? "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80"
    : productId.includes("mug") || productId.includes("ceramic")
    ? "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"
    : productId.includes("bottle")
    ? "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80"
    : productId.includes("tote")
    ? "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80"
    : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80";

  // Re-draw canvas preview whenever placement values change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 600;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw base product background
    const bgImg = new window.Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = productBaseUrl;

    bgImg.onload = () => {
      ctx.drawImage(bgImg, 0, 0, width, height);

      // 2. Draw print zone boundary mask
      const pz = printBounds;
      ctx.save();
      ctx.strokeStyle = "#6A2CFF";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      if (pz.shape === "circle") {
        ctx.beginPath();
        const radius = pz.width / 2;
        ctx.arc(pz.x + radius, pz.y + radius, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(pz.x, pz.y, pz.width, pz.height);
      }
      ctx.restore();

      // 3. Draw Customer Artwork if available, clamped strictly within print zone
      if (artworkUrl) {
        const logoImg = new window.Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = artworkUrl;

        logoImg.onload = () => {
          ctx.save();

          // Clip to print zone boundary so logo NEVER bleeds outside
          ctx.beginPath();
          if (pz.shape === "circle") {
            const radius = pz.width / 2;
            ctx.arc(pz.x + radius, pz.y + radius, radius, 0, Math.PI * 2);
          } else {
            ctx.rect(pz.x, pz.y, pz.width, pz.height);
          }
          ctx.clip();

          // Calculate logo dimensions clamped to print zone
          const maxLogoW = (pz.width * scale) / 100;
          const maxLogoH = (pz.height * scale) / 100;

          // Position clamped inside print zone
          const centerX = pz.x + (pz.width * posX) / 100;
          const centerY = pz.y + (pz.height * posY) / 100;

          ctx.translate(centerX, centerY);
          if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180);
          }

          // Apply print texture filter
          if (printMethod === "Embroidery") {
            ctx.shadowColor = "rgba(0,0,0,0.4)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;
          } else if (printMethod === "Laser Engraving") {
            ctx.globalCompositeOperation = "luminosity";
          }

          ctx.drawImage(logoImg, -maxLogoW / 2, -maxLogoH / 2, maxLogoW, maxLogoH);
          ctx.restore();
        };
      }
    };
  }, [artworkUrl, productBaseUrl, printBounds, posX, posY, scale, rotation, printMethod]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleSaveMockup = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");

      const placementPayload = {
        x: posX,
        y: posY,
        width: scale,
        height: scale,
        rotation,
        pantone: pantone.trim() || undefined,
        notes: designerNotes.trim() || undefined,
      };

      const res = await fetch(`/api/admin/orders/${orderNumber}/items/${itemId}/mockup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: placementPayload,
          printMethod,
          mockupImageBase64: dataUrl,
          expectedVersion: orderVersion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save mockup");

      toast.success("Mockup placement and rendered proof saved successfully!");
      if (onMockupSaved && data.mockupUrl) {
        onMockupSaved(data.mockupUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save mockup";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
        <div>
          <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#6A2CFF]" />
            <span>Designer Print-Zone Placement & Mockup Atelier</span>
          </h3>
          <p className="text-xs text-[#8A829E] mt-0.5">
            Precision logo positioning clamped inside the physical print zone mask ({printBounds.physicalWidthMm} mm).
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-[#6A2CFF] dark:text-[#CDB8FF] border border-[#6A2CFF]/20">
          Print Method: {printMethod}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Interactive Canvas Viewport */}
        <div className="space-y-2">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90">
              Print Zone Mask: {printBounds.width}x{printBounds.height}px ({printBounds.shape})
            </div>
          </div>
          <p className="text-[11px] text-[#8A829E] text-center italic">
            Dashed outline indicates physical boundary; artwork is strictly clipped inside mask.
          </p>
        </div>

        {/* Right: Fine-Tuning Controls */}
        <div className="space-y-4 text-xs">
          {/* Print Method Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-[#6A2CFF]" />
              <span>Print Production Method</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRINT_METHODS.map((method) => {
                const isSelected = printMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPrintMethod(method.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#6A2CFF] bg-[#6A2CFF]/10 text-[#6A2CFF] dark:text-[#CDB8FF] font-semibold"
                        : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-xs">{method.label}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{method.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position & Scale Sliders */}
          <div className="space-y-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
            {/* Horizontal Position X */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <Move className="w-3 h-3 text-[#6A2CFF]" /> Horizontal Offset X
                </span>
                <span className="font-bold">{posX}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={posX}
                onChange={(e) => setPosX(Number(e.target.value))}
                className="w-full accent-[#6A2CFF] cursor-pointer"
              />
            </div>

            {/* Vertical Position Y */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <Move className="w-3 h-3 text-[#6A2CFF]" /> Vertical Offset Y
                </span>
                <span className="font-bold">{posY}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="w-full accent-[#6A2CFF] cursor-pointer"
              />
            </div>

            {/* Scale / Size */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-[#6A2CFF]" /> Print Scale / Size
                </span>
                <span className="font-bold">{scale}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-[#6A2CFF] cursor-pointer"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-[#6A2CFF]" /> Rotation
                </span>
                <span className="font-bold">{rotation}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-[#6A2CFF] cursor-pointer"
              />
            </div>
          </div>

          {/* Pantone & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Exact Pantone (PMS)</label>
              <input
                type="text"
                value={pantone}
                onChange={(e) => setPantone(e.target.value)}
                placeholder="E.g., PMS 2685 C"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Designer Notes</label>
              <input
                type="text"
                value={designerNotes}
                onChange={(e) => setDesignerNotes(e.target.value)}
                placeholder="E.g., Satin stitch density 0.4mm"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveMockup}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db] disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Rendering..." : "Save Mockup & Placement"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
