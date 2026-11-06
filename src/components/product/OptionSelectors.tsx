"use client";

import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Check, Circle, Square, RectangleHorizontal, Scissors } from "lucide-react";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ShapeOption {
  id: string;
  name: string;
  description: string;
  icon: "circle" | "rect" | "square" | "contour";
}

export interface FabricOption {
  id: string;
  name: string;
  weightGsm: number;
  badge?: "Popular" | "Premium" | "Eco-Choice";
  description: string;
}

interface OptionSelectorsProps {
  // Shape
  shapes?: ShapeOption[];
  selectedShape?: string;
  onSelectShape?: (shapeId: string) => void;

  // Color
  colors?: ColorOption[];
  selectedColor?: string;
  onSelectColor?: (colorHex: string) => void;

  // Fabric
  fabrics?: FabricOption[];
  selectedFabric?: string;
  onSelectFabric?: (fabricId: string) => void;

  // Size
  sizes?: string[];
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export function OptionSelectors({
  shapes,
  selectedShape,
  onSelectShape,
  colors,
  selectedColor,
  onSelectColor,
  fabrics,
  selectedFabric,
  onSelectFabric,
  sizes,
  selectedSize,
  onSelectSize,
}: OptionSelectorsProps) {
  return (
    <div className="space-y-6">
      {/* 1. Shape Cards (Distinct Style #1: Shape cards with small preview icons) */}
      {shapes && shapes.length > 0 && (
        <div className="space-y-2.5">
          <label className="block font-mono text-xs font-bold text-pf-ink uppercase tracking-wider">
            Die-Cut Geometry
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {shapes.map((s) => {
              const isSelected = selectedShape === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectShape && onSelectShape(s.id)}
                  className={`flex flex-col items-center justify-center p-3 border-2 transition-all text-center ${
                    isSelected
                      ? "border-pf-ink bg-pf-lilac/30 shadow-[3px_3px_0_0_#15101F]"
                      : "border-pf-ink/20 bg-white hover:border-pf-ink hover:bg-pf-paper"
                  }`}
                >
                  <div className="mb-2 text-pf-ink">
                    {s.icon === "circle" && <Circle className="h-5 w-5" />}
                    {s.icon === "rect" && <RectangleHorizontal className="h-5 w-5" />}
                    {s.icon === "square" && <Square className="h-5 w-5" />}
                    {s.icon === "contour" && <Scissors className="h-5 w-5 text-pf-violet" />}
                  </div>
                  <span className="font-display text-xs font-bold text-pf-ink leading-tight">
                    {s.name}
                  </span>
                  <span className="font-mono text-[10px] text-pf-ink/60 mt-0.5">
                    {s.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Colour Swatches (Distinct Style #2: Circular Tokens with Radix Tooltip) */}
      {colors && colors.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block font-mono text-xs font-bold text-pf-ink uppercase tracking-wider">
              Colourway Base
            </label>
            <span className="font-mono text-xs text-pf-violet font-bold">
              {colors.find((c) => c.hex.toLowerCase() === selectedColor?.toLowerCase())?.name ||
                "Select Tone"}
            </span>
          </div>

          <Tooltip.Provider delayDuration={150}>
            <div className="flex flex-wrap items-center gap-3">
              {colors.map((c) => {
                const isSelected = selectedColor?.toLowerCase() === c.hex.toLowerCase();
                const isLight = c.hex.toLowerCase() === "#ffffff" || c.hex.toLowerCase() === "#f5f0e8";
                return (
                  <Tooltip.Root key={c.name}>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelectColor && onSelectColor(c.hex)}
                        aria-label={`Select ${c.name}`}
                        className={`relative h-9 w-9 rounded-full border-2 border-pf-ink transition-transform ${
                          isSelected
                            ? "scale-110 shadow-[2px_2px_0_0_#15101F] ring-2 ring-pf-violet"
                            : "hover:scale-105 opacity-90 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <Check
                            className={`h-4 w-4 absolute inset-0 m-auto ${
                              isLight ? "text-pf-ink" : "text-white"
                            }`}
                          />
                        )}
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        className="bg-pf-ink text-white font-mono text-xs px-2.5 py-1 rounded shadow-md z-50 border border-white/20"
                      >
                        {c.name}
                        <Tooltip.Arrow className="fill-pf-ink" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              })}
            </div>
          </Tooltip.Provider>
        </div>
      )}

      {/* 3. Fabric Cards (Distinct Style #3: Structural Cards with Badges & GSM) */}
      {fabrics && fabrics.length > 0 && (
        <div className="space-y-2.5">
          <label className="block font-mono text-xs font-bold text-pf-ink uppercase tracking-wider">
            Fabric Construction & Weight
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fabrics.map((f) => {
              const isSelected = selectedFabric === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFabric && onSelectFabric(f.id)}
                  className={`flex flex-col justify-between p-3.5 border-2 text-left transition-all ${
                    isSelected
                      ? "border-pf-ink bg-pf-lilac/20 shadow-[3px_3px_0_0_#15101F]"
                      : "border-pf-ink/20 bg-white hover:border-pf-ink"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-sm font-bold text-pf-ink">
                      {f.name}
                    </span>
                    {f.badge && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 border border-pf-ink/30 ${
                          f.badge === "Popular"
                            ? "bg-pf-lime text-pf-ink"
                            : "bg-pf-violet text-white"
                        }`}
                      >
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-pf-ink/70">
                    <span>{f.description}</span>
                    <span className="font-bold text-pf-ink">{f.weightGsm} GSM</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Size Chips (Distinct Style #4: Clean Letter Chips) */}
      {sizes && sizes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block font-mono text-xs font-bold text-pf-ink uppercase tracking-wider">
              Garment Size
            </label>
            <span className="font-mono text-xs text-pf-ink/60 underline cursor-pointer hover:text-pf-violet">
              Size Chart Guide
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {sizes.map((sz) => {
              const isSelected = selectedSize === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onSelectSize && onSelectSize(sz)}
                  className={`min-w-[44px] h-11 px-3.5 border-2 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center ${
                    isSelected
                      ? "border-pf-ink bg-pf-ink text-white shadow-[2px_2px_0_0_#6A2CFF]"
                      : "border-pf-ink/20 bg-white text-pf-ink hover:border-pf-ink"
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
