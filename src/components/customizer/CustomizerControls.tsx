"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Type,
  Palette,
  RotateCcw,
  RotateCw,
  Sparkles,
  Share2,
  ShoppingCart,
  Trash2,
  FlipHorizontal,
  Wand2,
  Check,
  Camera,
} from "lucide-react";
import type { CatalogueProduct } from "@/lib/catalogue";
import { DpiCalculationResult } from "@/lib/customizer/quality";
import { ContrastRecommendation } from "@/lib/customizer/contrast";
import { removeWhiteBackgroundFromImageUrl } from "@/lib/customizer/background";
import { resolveTierPrice } from "@/lib/pricing-client";

export interface CustomizerControlsProps {
  product: CatalogueProduct;
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  view: "front" | "back";
  onSelectView: (view: "front" | "back") => void;
  supportedViews: Array<"front" | "back">;
  quantity: number;
  onUpdateQuantity: (qty: number) => void;
  logoUrl?: string;
  onUploadLogo: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadError?: string | null;
  logoOpacity: number;
  onChangeLogoOpacity: (opacity: number) => void;
  logoFlipped: boolean;
  onToggleFlipLogo: () => void;
  onApplyProcessedLogo: (dataUrl: string) => void;
  onAutoPlaceLogo: () => void;
  onResetLogo: () => void;
  textLayers: Array<{
    id: string;
    text: string;
    fontFamily: string;
    fontSize: number;
    fill: string;
    x: number;
    y: number;
  }>;
  onAddTextLayer: (text: string, fontFamily: string, fill: string) => void;
  onRemoveTextLayer: (id: string) => void;
  onUpdateTextProperties: (
    id: string,
    updates: Partial<{ text: string; fontFamily: string; fontSize: number; fill: string }>
  ) => void;
  selectedElement: { type: "logo" | "text" | null; id?: string };
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  dpiResult: DpiCalculationResult;
  contrastRecommendations: ContrastRecommendation[];
  dominantLogoColor: string;
  onSharePreview: () => void;
  onAddToCart: () => void;
  isAddingToCart: boolean;
}

const CURATED_FONTS = [
  { label: "Bricolage Grotesque", value: "Bricolage Grotesque" },
  { label: "Instrument Sans", value: "Instrument Sans" },
  { label: "DM Mono", value: "DM Mono" },
  { label: "Impact", value: "Impact" },
  { label: "Georgia", value: "Georgia" },
  { label: "Courier New", value: "Courier New" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Brush Script MT", value: "Brush Script MT" },
];

export function CustomizerControls({
  product,
  selectedColor,
  onSelectColor,
  view,
  onSelectView,
  supportedViews,
  quantity,
  onUpdateQuantity,
  logoUrl,
  onUploadLogo,
  isUploading,
  uploadError,
  logoOpacity,
  onChangeLogoOpacity,
  logoFlipped,
  onToggleFlipLogo,
  onApplyProcessedLogo,
  onAutoPlaceLogo,
  onResetLogo,
  textLayers,
  onAddTextLayer,
  onRemoveTextLayer,
  onUpdateTextProperties,
  selectedElement,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  contrastRecommendations,
  onSharePreview,
  onAddToCart,
  isAddingToCart,
}: CustomizerControlsProps) {
  const [activeTab, setActiveTab] = useState<"artwork" | "text" | "product">("artwork");
  const [bgTolerance, setBgTolerance] = useState(25);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [newTextString, setNewTextString] = useState("COMPANY NAME");
  const [selectedFont, setSelectedFont] = useState(CURATED_FONTS[0].value);
  const [selectedTextColor, setSelectedTextColor] = useState("#FFFFFF");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Active selected text layer
  const activeTextLayer =
    selectedElement.type === "text" && selectedElement.id
      ? textLayers.find((t) => t.id === selectedElement.id)
      : null;

  // Pricing calculations
  const unitPrice = resolveTierPrice(quantity, product.basePrice, product.priceTiers);
  const lineSubtotal = unitPrice * quantity;

  // Background removal trigger
  const handleRemoveBackground = async () => {
    if (!logoUrl) return;
    setIsProcessingBg(true);
    try {
      const transparentUrl = await removeWhiteBackgroundFromImageUrl(logoUrl, bgTolerance);
      onApplyProcessedLogo(transparentUrl);
    } catch {
      // Ignore fallback
    } finally {
      setIsProcessingBg(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadLogo(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-pf-ink/10 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-pf-ink/10 bg-pf-paper/50">
        <button
          type="button"
          onClick={() => setActiveTab("artwork")}
          className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "artwork"
              ? "border-pf-violet text-pf-violet bg-white font-bold"
              : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
        >
          <Upload className="w-4 h-4" />
          <span>Artwork</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "text"
              ? "border-pf-violet text-pf-violet bg-white font-bold"
              : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
        >
          <Type className="w-4 h-4" />
          <span>Text ({textLayers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("product")}
          className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === "product"
              ? "border-pf-violet text-pf-violet bg-white font-bold"
              : "border-transparent text-pf-ink/60 hover:text-pf-ink"
            }`}
        >
          <Palette className="w-4 h-4" />
          <span>Product</span>
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[580px] flex-1">
        {/* TAB 1: ARTWORK & UPLOAD */}
        {activeTab === "artwork" && (
          <div className="space-y-6">
            {/* Upload Zone */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/70 mb-2">
                Upload Logo or Vector Art
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) onUploadLogo(file);
                }}
                className="border-2 border-dashed border-pf-ink/20 hover:border-pf-violet rounded-xl p-5 text-center transition-colors bg-pf-paper/30 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <div className="w-10 h-10 rounded-full bg-pf-violet/10 flex items-center justify-center text-pf-violet mb-2">
                  <Upload className="w-5 h-5" />
                </div>

                <div className="text-sm font-medium text-pf-ink">
                  {isUploading ? "Uploading & Sanitizing..." : "Drop logo here or browse"}
                </div>
                <div className="text-xs text-pf-ink/50 mt-1">
                  PNG, JPG, WebP, SVG • Max 5MB
                </div>

                {uploadError && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded w-full">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Mobile Camera Option */}
              <div className="mt-2 flex justify-end md:hidden">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-xs font-mono text-pf-violet flex items-center gap-1 hover:underline"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take photo</span>
                </button>
              </div>
            </div>

            {/* Placement Quick Tools */}
            {logoUrl && (
              <div className="space-y-4 pt-4 border-t border-pf-ink/10">
                <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/70">
                  Artwork Controls
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={onAutoPlaceLogo}
                    className="flex flex-col items-center justify-center py-2.5 px-2 bg-pf-paper hover:bg-pf-lilac/30 rounded-lg text-xs font-mono text-pf-ink border border-pf-ink/10 transition-colors"
                  >
                    <Wand2 className="w-4 h-4 text-pf-violet mb-1" />
                    <span>Auto-Fit</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleFlipLogo}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-mono border transition-colors ${logoFlipped
                        ? "bg-pf-violet text-white border-pf-violet"
                        : "bg-pf-paper hover:bg-pf-lilac/30 text-pf-ink border-pf-ink/10"
                      }`}
                  >
                    <FlipHorizontal className="w-4 h-4 mb-1" />
                    <span>Flip</span>
                  </button>

                  <button
                    type="button"
                    onClick={onResetLogo}
                    className="flex flex-col items-center justify-center py-2.5 px-2 bg-pf-paper hover:bg-pf-lilac/30 rounded-lg text-xs font-mono text-pf-ink border border-pf-ink/10 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mb-1" />
                    <span>Center</span>
                  </button>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-pf-ink/70">
                    <span>Opacity</span>
                    <span>{Math.round(logoOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(logoOpacity * 100)}
                    onChange={(e) => onChangeLogoOpacity(Number(e.target.value) / 100)}
                    className="w-full accent-pf-violet cursor-pointer"
                  />
                </div>

                {/* White Background Remover Tool */}
                <div className="bg-pf-paper/60 p-4 rounded-xl border border-pf-ink/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pf-ink flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pf-violet" />
                      Remove White Background
                    </span>
                    <span className="text-xs font-mono text-pf-ink/60">
                      Tol: {bgTolerance}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={bgTolerance}
                    onChange={(e) => setBgTolerance(Number(e.target.value))}
                    className="w-full accent-pf-violet cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    disabled={isProcessingBg}
                    className="w-full py-2 bg-pf-ink text-white hover:bg-pf-ink/90 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isProcessingBg ? "Neutralizing white..." : "Cut Out White BG"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEXT TOOL */}
        {activeTab === "text" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/70">
                Add Text to Print Area
              </div>

              <input
                type="text"
                value={newTextString}
                onChange={(e) => setNewTextString(e.target.value)}
                placeholder="e.g. BENGALURU 2026"
                className="w-full px-3 py-2 bg-white border border-pf-ink/20 rounded-lg text-sm text-pf-ink focus:outline-none focus:border-pf-violet"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-pf-ink/20 rounded-lg text-xs font-mono text-pf-ink focus:outline-none focus:border-pf-violet"
                >
                  {CURATED_FONTS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedTextColor}
                    onChange={(e) => setSelectedTextColor(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border border-pf-ink/20 p-0.5 bg-white"
                  />
                  <span className="text-xs font-mono text-pf-ink/70">{selectedTextColor}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (newTextString.trim()) {
                    onAddTextLayer(newTextString.trim(), selectedFont, selectedTextColor);
                  }
                }}
                className="w-full py-2.5 bg-pf-violet text-white hover:bg-pf-violet/90 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Type className="w-4 h-4" />
                <span>Place Text on Product</span>
              </button>
            </div>

            {/* Active Selected Text Edit Controls */}
            {activeTextLayer && (
              <div className="p-4 bg-pf-paper rounded-xl border border-pf-ink/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-pf-ink">
                  <span>Selected Text Layer</span>
                  <button
                    type="button"
                    onClick={() => onRemoveTextLayer(activeTextLayer.id)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={activeTextLayer.text}
                  onChange={(e) =>
                    onUpdateTextProperties(activeTextLayer.id, { text: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-pf-ink/20 rounded text-sm text-pf-ink"
                />

                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Font Size: {activeTextLayer.fontSize}px</span>
                  <input
                    type="range"
                    min="14"
                    max="64"
                    value={activeTextLayer.fontSize}
                    onChange={(e) =>
                      onUpdateTextProperties(activeTextLayer.id, {
                        fontSize: Number(e.target.value),
                      })
                    }
                    className="w-32 accent-pf-violet cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCT CONTROLS & AI ASSISTANT */}
        {activeTab === "product" && (
          <div className="space-y-6">
            {/* Color Switcher */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/70 mb-2">
                Blank Colour
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onSelectColor(c.hex)}
                    title={c.name}
                    className={`w-9 h-9 rounded-full border-2 transition-transform relative flex items-center justify-center ${selectedColor.toLowerCase() === c.hex.toLowerCase()
                        ? "border-pf-violet scale-110 shadow-sm"
                        : "border-pf-ink/20 hover:scale-105"
                      }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor.toLowerCase() === c.hex.toLowerCase() && (
                      <Check
                        className={`w-4 h-4 ${c.hex.toLowerCase() === "#ffffff" ? "text-pf-ink" : "text-white"
                          }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Front / Back View Switch (if supported) */}
            {supportedViews.length > 1 && (
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/70 mb-2">
                  Print Location View
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {supportedViews.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onSelectView(v)}
                      className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg border transition-colors ${view === v
                          ? "bg-pf-ink text-white border-pf-ink"
                          : "bg-pf-paper text-pf-ink/70 border-pf-ink/10 hover:text-pf-ink"
                        }`}
                    >
                      {v === "front" ? "Front Chest" : "Full Back"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI-Flavoured Contrast Recommendations */}
            {logoUrl && contrastRecommendations.length > 0 && (
              <div className="bg-pf-lilac/20 p-4 rounded-xl border border-pf-violet/20 space-y-3">
                <div className="text-xs font-bold text-pf-violet flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-pf-violet" />
                  AI Colour Matching
                </div>
                <div className="space-y-2">
                  {contrastRecommendations.map((rec) => (
                    <div
                      key={rec.hex}
                      onClick={() => onSelectColor(rec.hex)}
                      className="p-2.5 bg-white rounded-lg border border-pf-ink/10 hover:border-pf-violet cursor-pointer transition-colors flex items-center gap-3 text-xs"
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-pf-ink/20 shrink-0"
                        style={{ backgroundColor: rec.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-pf-ink">{rec.name}</div>
                        <div className="text-pf-ink/70 text-[11px] truncate">{rec.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* "Try on all colours" strip */}
            {logoUrl && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-pf-ink/70">
                  Try on all colours
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => onSelectColor(c.hex)}
                      className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${selectedColor.toLowerCase() === c.hex.toLowerCase()
                          ? "border-pf-violet bg-pf-lilac/20"
                          : "border-pf-ink/10 hover:border-pf-ink/30 bg-white"
                        }`}
                    >
                      <div
                        className="w-full h-8 rounded border border-pf-ink/10 flex items-center justify-center p-1"
                        style={{ backgroundColor: c.hex }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-[10px] font-mono text-pf-ink truncate w-full text-center">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action / Price Bar */}
      <div className="p-4 border-t border-pf-ink/10 bg-pf-paper/80 space-y-3">
        {/* Undo / Redo & Quantity Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg bg-white border border-pf-ink/10 text-pf-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pf-paper"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="p-2 rounded-lg bg-white border border-pf-ink/10 text-pf-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pf-paper"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-pf-ink/70">Qty:</span>
            <input
              type="number"
              min={product.minQty}
              step={product.qtyStep}
              value={quantity}
              onChange={(e) => onUpdateQuantity(Math.max(product.minQty, Number(e.target.value)))}
              className="w-16 px-2 py-1 bg-white border border-pf-ink/20 rounded font-mono text-sm text-center text-pf-ink focus:outline-none focus:border-pf-violet"
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-pf-ink/10">
          <div>
            <div className="text-xs text-pf-ink/60">Tier Unit Price</div>
            <div className="font-mono font-bold text-base text-pf-ink">₹{unitPrice} / pc</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-pf-ink/60">Estimated Total (excl. GST)</div>
            <div className="font-mono font-bold text-base text-pf-violet">
              ₹{lineSubtotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSharePreview}
            className="py-2.5 px-3 bg-white hover:bg-pf-paper text-pf-ink border border-pf-ink/20 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Preview</span>
          </button>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={isAddingToCart}
            className="py-2.5 px-3 bg-pf-violet hover:bg-pf-violet/90 text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isAddingToCart ? "Saving..." : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}