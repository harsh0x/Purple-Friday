"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Download, X } from "lucide-react";
import { toast } from "sonner";
import { get as idbGet, set as idbSet } from "idb-keyval";
import type Konva from "konva";

import type { CatalogueProduct } from "@/lib/catalogue";
import { useCustomerLogo } from "@/hooks/useCustomerLogo";
import { useCart } from "@/hooks/useCart";
import { getPrintAreaForTemplate } from "@/lib/customizer/print-areas";
import { calculatePrintDpi } from "@/lib/customizer/quality";
import {
  extractDominantColor,
} from "@/lib/customizer/extract-colors";
import {
  recommendContrastingProductColors,
} from "@/lib/customizer/contrast";
import { HistoryManager } from "@/lib/customizer/history";
import { resolveTierPrice } from "@/lib/pricing-client";
import { CustomizerCanvas } from "./CustomizerCanvas";
import { CustomizerControls } from "./CustomizerControls";
import { LetOurTeamDesignModal } from "@/components/product/LetOurTeamDesignModal";

export interface CustomizerStudioProps {
  product: CatalogueProduct;
}

interface CustomizerState {
  logoUrl?: string;
  uploadId?: string;
  logoOpacity: number;
  logoFlipped: boolean;
  logoTransform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
  textLayers: Array<{
    id: string;
    text: string;
    fontFamily: string;
    fontSize: number;
    fill: string;
    x: number;
    y: number;
  }>;
  selectedColor: string;
  view: "front" | "back";
  quantity: number;
}

export function CustomizerStudio({ product }: CustomizerStudioProps) {
  const { logoUrl: sessionLogo } = useCustomerLogo();
  const addItemToCart = useCart((s) => s.addItem);

  const printArea = useMemo(
    () => getPrintAreaForTemplate(product.template),
    [product.template]
  );

  const initialState: CustomizerState = useMemo(
    () => ({
      logoUrl: sessionLogo || undefined,
      uploadId: undefined,
      logoOpacity: 1.0,
      logoFlipped: false,
      logoTransform: {
        x: printArea.x + printArea.width / 2 - 50,
        y: printArea.y + printArea.height / 2 - 50,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      textLayers: [],
      selectedColor: product.colors[0]?.hex || "#15101F",
      view: "front",
      quantity: product.minQty,
    }),
    [sessionLogo, printArea, product]
  );

  const [state, setState] = useState<CustomizerState>(initialState);
  const [selectedElement, setSelectedElement] = useState<{
    type: "logo" | "text" | null;
    id?: string;
  }>({ type: null });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTeamDesignOpen, setIsTeamDesignOpen] = useState(false);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [dominantColor, setDominantColor] = useState("#15101F");

  const stageRef = useRef<Konva.Stage | null>(null);
  const historyRef = useRef<HistoryManager<CustomizerState>>(
    new HistoryManager<CustomizerState>(initialState, 35)
  );

  // Restore draft from IndexedDB on initial mount
  useEffect(() => {
    async function loadSavedDraft() {
      try {
        const saved = await idbGet<CustomizerState>(`pf_draft_${product.slug}`);
        if (saved && (saved.logoUrl || saved.textLayers.length > 0)) {
          setState(saved);
          historyRef.current = new HistoryManager<CustomizerState>(saved, 35);
          toast.info("Restored autosaved design draft from IndexedDB.");
        }
      } catch {
        // Fallback silently
      }
    }
    loadSavedDraft();
  }, [product.slug]);

  // Autosave to IndexedDB
  useEffect(() => {
    const timer = setTimeout(() => {
      idbSet(`pf_draft_${product.slug}`, state).catch(() => { });
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, product.slug]);

  // Extract dominant logo colour and update contrast helpers
  useEffect(() => {
    if (!state.logoUrl) return;
    extractDominantColor(state.logoUrl).then(setDominantColor);
  }, [state.logoUrl]);

  const contrastRecommendations = useMemo(() => {
    return recommendContrastingProductColors(dominantColor, product.colors);
  }, [dominantColor, product.colors]);

  // Print DPI Calculation
  const dpiResult = useMemo(() => {
    return calculatePrintDpi({
      imageWidthPx: 1200, // Estimated raster dimension from upload
      imageHeightPx: 1200,
      targetPrintWidthMm: printArea.physicalWidthMm,
      scale: Math.abs(state.logoTransform.scaleX),
      printMethod: product.printMethod,
    });
  }, [printArea.physicalWidthMm, state.logoTransform.scaleX, product.printMethod]);

  // History Actions
  const pushState = useCallback((newState: CustomizerState) => {
    setState(newState);
    historyRef.current.push(newState);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.canUndo()) {
      const prev = historyRef.current.undo();
      setState(prev);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyRef.current.canRedo()) {
      const next = historyRef.current.redo();
      setState(next);
    }
  }, []);

  // Upload handler via Step 3A API
  const handleUploadLogo = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "logo");

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload logo.");
      }

      const nextState: CustomizerState = {
        ...state,
        logoUrl: data.url,
        uploadId: data.uploadId,
        logoTransform: {
          x: printArea.x + printArea.width / 2 - 50,
          y: printArea.y + printArea.height / 2 - 50,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
        },
      };

      pushState(nextState);
      setSelectedElement({ type: "logo" });
      toast.success("Logo uploaded and safely neutralized.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Add / Edit Text Layer
  const handleAddTextLayer = (text: string, fontFamily: string, fill: string) => {
    const newLayer = {
      id: `txt_${Date.now()}`,
      text,
      fontFamily,
      fontSize: 24,
      fill,
      x: printArea.x + 20,
      y: printArea.y + printArea.height - 40,
    };

    const nextState = {
      ...state,
      textLayers: [...state.textLayers, newLayer],
    };
    pushState(nextState);
    setSelectedElement({ type: "text", id: newLayer.id });
    toast.success("Text placed on product.");
  };

  const handleRemoveTextLayer = (id: string) => {
    const nextState = {
      ...state,
      textLayers: state.textLayers.filter((l) => l.id !== id),
    };
    pushState(nextState);
    setSelectedElement({ type: null });
  };

  const handleUpdateTextProperties = (
    id: string,
    updates: Partial<{ text: string; fontFamily: string; fontSize: number; fill: string }>
  ) => {
    const nextState = {
      ...state,
      textLayers: state.textLayers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    };
    pushState(nextState);
  };

  // Auto-place logo in optimal position
  const handleAutoPlaceLogo = () => {
    const optimalWidth = printArea.width * 0.7;
    const optimalHeight = optimalWidth;
    const nextState: CustomizerState = {
      ...state,
      logoTransform: {
        x: printArea.x + (printArea.width - optimalWidth) / 2,
        y: printArea.y + (printArea.height - optimalHeight) / 2,
        scaleX: optimalWidth / 100,
        scaleY: optimalHeight / 100,
        rotation: 0,
      },
    };
    pushState(nextState);
    toast.info("Artwork auto-fitted to optical center.");
  };

  const handleResetLogo = () => {
    const nextState: CustomizerState = {
      ...state,
      logoTransform: {
        x: printArea.x + printArea.width / 2 - 50,
        y: printArea.y + printArea.height / 2 - 50,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
    };
    pushState(nextState);
  };

  // "Share Preview" generator with proof watermark
  const handleSharePreview = () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    setSharePreviewUrl(dataUrl);
  };

  // "Add to Cart" with server save
  const handleAddToCart = async () => {
    if (!stageRef.current) return;

    setIsAddingToCart(true);
    try {
      const exportDataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });

      // Save design to backend API
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productSlug: product.slug,
          uploadId: state.uploadId,
          previewUrl: exportDataUrl,
          layers: {
            logoTransform: state.logoTransform,
            logoOpacity: state.logoOpacity,
            logoFlipped: state.logoFlipped,
            textLayers: state.textLayers,
          },
          selectedColor: state.selectedColor,
          view: state.view,
          quantity: state.quantity,
          options: {
            Colour:
              product.colors.find((c) => c.hex.toLowerCase() === state.selectedColor.toLowerCase())
                ?.name || "Standard",
            View: state.view === "front" ? "Front" : "Back",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save customized design.");
      }

      const unitPrice = resolveTierPrice(state.quantity, product.basePrice, product.priceTiers);
      const colorObj = product.colors.find(
        (c) => c.hex.toLowerCase() === state.selectedColor.toLowerCase()
      );

      addItemToCart({
        productId: product.id,
        optionKey: `${product.slug}-${state.selectedColor}-${state.view}`,
        qty: state.quantity,
        name: product.name,
        slug: product.slug,
        unitPrice,
        template: product.template,
        designId: data.designId,
        options: {
          Colour: colorObj?.name || "Standard",
          Print: state.view === "front" ? "Front Chest" : "Full Back",
        },
      });

      toast.success("Custom design saved and added to cart!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving design";
      toast.error(msg);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-pf-ink/10 gap-4">
          <div>
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-pf-ink/60 hover:text-pf-violet transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {product.shortName}</span>
            </Link>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-pf-ink">
              Live Studio Customizer
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsTeamDesignOpen(true)}
              className="text-xs font-mono text-pf-ink/70 hover:text-pf-ink underline"
            >
              Need design help? Free brief
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Centered Interactive Canvas */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
            <CustomizerCanvas
              template={product.template}
              selectedColor={state.selectedColor}
              view={state.view}
              printArea={printArea}
              logoUrl={state.logoUrl}
              logoOpacity={state.logoOpacity}
              logoFlipped={state.logoFlipped}
              textLayers={state.textLayers}
              onUpdateLogoTransform={(t) =>
                pushState({ ...state, logoTransform: { ...state.logoTransform, ...t } })
              }
              onUpdateTextLayer={(id, updates) =>
                pushState({
                  ...state,
                  textLayers: state.textLayers.map((l) =>
                    l.id === id ? { ...l, ...updates } : l
                  ),
                })
              }
              onSelectElement={(type, id) => setSelectedElement({ type, id })}
              selectedElement={selectedElement}
              dpiResult={dpiResult}
              onOpenTeamDesign={() => setIsTeamDesignOpen(true)}
              stageRef={stageRef}
            />
          </div>

          {/* Right Control & Tool Panel */}
          <div className="lg:col-span-5 xl:col-span-4 w-full">
            <CustomizerControls
              product={product}
              selectedColor={state.selectedColor}
              onSelectColor={(hex) => pushState({ ...state, selectedColor: hex })}
              view={state.view}
              onSelectView={(v) => pushState({ ...state, view: v })}
              supportedViews={printArea.supportedViews}
              quantity={state.quantity}
              onUpdateQuantity={(q) => pushState({ ...state, quantity: q })}
              logoUrl={state.logoUrl}
              onUploadLogo={handleUploadLogo}
              isUploading={isUploading}
              uploadError={uploadError}
              logoOpacity={state.logoOpacity}
              onChangeLogoOpacity={(op) => pushState({ ...state, logoOpacity: op })}
              logoFlipped={state.logoFlipped}
              onToggleFlipLogo={() =>
                pushState({ ...state, logoFlipped: !state.logoFlipped })
              }
              onApplyProcessedLogo={(dataUrl) => pushState({ ...state, logoUrl: dataUrl })}
              onAutoPlaceLogo={handleAutoPlaceLogo}
              onResetLogo={handleResetLogo}
              textLayers={state.textLayers}
              onAddTextLayer={handleAddTextLayer}
              onRemoveTextLayer={handleRemoveTextLayer}
              onUpdateTextProperties={handleUpdateTextProperties}
              selectedElement={selectedElement}
              canUndo={historyRef.current.canUndo()}
              canRedo={historyRef.current.canRedo()}
              onUndo={handleUndo}
              onRedo={handleRedo}
              dpiResult={dpiResult}
              contrastRecommendations={contrastRecommendations}
              dominantLogoColor={dominantColor}
              onSharePreview={handleSharePreview}
              onAddToCart={handleAddToCart}
              isAddingToCart={isAddingToCart}
            />
          </div>
        </div>
      </div>

      {/* Share / Proof Preview Dialog */}
      {sharePreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-pf-ink/10 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-pf-ink/10">
              <h3 className="font-display font-bold text-lg text-pf-ink">
                Pre-Press Proof Preview
              </h3>
              <button
                type="button"
                onClick={() => setSharePreviewUrl(null)}
                className="p-1 rounded-lg hover:bg-pf-paper text-pf-ink/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-square rounded-xl overflow-hidden border border-pf-ink/10 bg-pf-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sharePreviewUrl}
                alt="Product Proof"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15 rotate-[-25deg]">
                <span className="text-3xl font-mono font-bold tracking-widest text-pf-ink border-4 border-dashed border-pf-ink p-4 uppercase">
                  Proof • Purple Friday
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Customizer link copied to clipboard!");
                }}
                className="flex-1 py-2.5 bg-pf-paper hover:bg-pf-lilac/30 text-pf-ink rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 border border-pf-ink/10"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Studio Link</span>
              </button>

              <a
                href={sharePreviewUrl}
                download={`purple-friday-${product.slug}-proof.png`}
                className="flex-1 py-2.5 bg-pf-ink text-white hover:bg-pf-ink/90 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download Proof</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Free Team Design Modal */}
      <LetOurTeamDesignModal
        isOpen={isTeamDesignOpen}
        onClose={() => setIsTeamDesignOpen(false)}
        productName={product.name}
      />
    </div>
  );
}