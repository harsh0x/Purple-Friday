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
  const activeColorName =
    colors?.find((c) => c.hex.toLowerCase() === selectedColor?.toLowerCase())?.name ||
    (selectedColor === "#FFFFFF" ? "White" : "Selected");

  return (
    <div className="space-y-6">
      {/* 1. Shape Cards for Badges (Logo Cutout, Circle, Square, Rectangle) */}
      {shapes && shapes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block font-mono text-xs font-bold text-ink uppercase tracking-wider">
              Choose Badge Shape
            </label>
            <span className="font-mono text-xs text-violet font-bold capitalize">
              {shapes.find((s) => s.id === selectedShape)?.name || "Select Shape"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {shapes.map((s) => {
              const isSelected = selectedShape === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectShape && onSelectShape(s.id)}
                  className={`p-3 border-2 rounded-sm text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "border-violet bg-violet/5 shadow-stamp-sm"
                      : "border-ink/20 bg-paper-pure hover:border-ink hover:bg-paper"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-1.5 rounded-xs border ${
                        isSelected
                          ? "bg-violet text-white border-violet"
                          : "bg-paper text-ink border-ink/20"
                      }`}
                    >
                      {s.icon === "circle" && <Circle className="h-4 w-4" />}
                      {s.icon === "rect" && <RectangleHorizontal className="h-4 w-4" />}
                      {s.icon === "square" && <Square className="h-4 w-4" />}
                      {s.icon === "contour" && <Scissors className="h-4 w-4" />}
                    </div>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-spot-lime border border-ink" />
                    )}
                  </div>
                  <div>
                    <span className="font-display font-bold text-xs text-ink block">
                      {s.name}
                    </span>
                    <span className="font-mono text-[10px] text-ink/60 block mt-0.5">
                      {s.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Colour Swatches Grid (Matches Reference Layout with Name Labels) */}
      {colors && colors.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block font-mono text-xs font-bold text-ink uppercase tracking-wider">
                Select Colour
              </label>
              <span className="px-2 py-0.5 bg-ink text-white font-mono text-[11px] font-bold rounded-xs shadow-xs">
                {activeColorName}
              </span>
            </div>
            <span className="font-mono text-[11px] text-ink/60">
              {colors.length} Available Tones
            </span>
          </div>

          <Tooltip.Provider delayDuration={150}>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 pt-1">
              {colors.map((c) => {
                const isSelected = selectedColor?.toLowerCase() === c.hex.toLowerCase();
                const isLight =
                  c.hex.toLowerCase() === "#ffffff" ||
                  c.hex.toLowerCase() === "#f5f0e8" ||
                  c.hex.toLowerCase() === "#fafafa";
                return (
                  <Tooltip.Root key={c.name}>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelectColor && onSelectColor(c.hex)}
                        aria-label={`Select ${c.name}`}
                        className={`flex flex-col items-center p-1.5 rounded-xs border-2 transition-all group ${
                          isSelected
                            ? "border-violet bg-violet/10 shadow-stamp-sm scale-105"
                            : "border-ink/15 bg-paper hover:border-ink/50 hover:bg-white"
                        }`}
                      >
                        <div
                          className={`relative h-7 w-7 rounded-full border-2 border-ink flex items-center justify-center shadow-xs transition-transform ${
                            isSelected ? "ring-2 ring-violet" : "group-hover:scale-110"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`h-3.5 w-3.5 ${
                                isLight ? "text-ink" : "text-white"
                              }`}
                            />
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-ink/80 truncate w-full text-center mt-1">
                          {c.name}
                        </span>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        className="bg-ink text-white font-mono text-xs px-2.5 py-1 rounded shadow-md z-50 border border-white/20"
                      >
                        {c.name}
                        <Tooltip.Arrow className="fill-ink" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              })}
            </div>
          </Tooltip.Provider>
        </div>
      )}

      {/* 3. Fabric Specification Cards */}
      {fabrics && fabrics.length > 0 && (
        <div className="space-y-2.5">
          <label className="block font-mono text-xs font-bold text-ink uppercase tracking-wider">
            Fabric Weight & Weave
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fabrics.map((f) => {
              const isSelected = selectedFabric === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFabric && onSelectFabric(f.id)}
                  className={`p-3.5 border-2 rounded-sm text-left transition-all ${
                    isSelected
                      ? "border-violet bg-violet/5 shadow-stamp-sm"
                      : "border-ink/20 bg-paper-pure hover:border-ink hover:bg-paper"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-ink">{f.name}</span>
                    {f.badge && (
                      <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border border-ink/30 bg-spot-lime text-ink">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-violet font-bold">
                    {f.weightGsm} GSM
                  </div>
                  <p className="font-sans text-xs text-ink/70 mt-1">{f.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Size letter chips for non-apparel products */}
      {sizes && sizes.length > 0 && (
        <div className="space-y-2">
          <label className="block font-mono text-xs font-bold text-ink uppercase tracking-wider">
            Dimension Specification
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSelectSize && onSelectSize(s)}
                  className={`px-3 py-1.5 font-mono text-xs font-bold border-2 rounded-xs transition-all ${
                    isSelected
                      ? "border-ink bg-violet text-white shadow-stamp-sm"
                      : "border-ink/20 bg-white text-ink hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
