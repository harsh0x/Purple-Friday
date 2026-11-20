"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Download,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { ArtworkAnalysisResult } from "@/server/artwork/artwork-ingestion";

interface ArtworkIngestionCardProps {
  orderNumber: string;
  itemId: string;
  currentArtworkUrl?: string | null;
  onArtworkUpdated?: (newUrl: string) => void;
}

export function ArtworkIngestionCard({
  orderNumber,
  itemId,
  onArtworkUpdated,
}: ArtworkIngestionCardProps) {
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ArtworkAnalysisResult | null>(null);
  const [pantoneInput, setPantoneInput] = useState("");
  const [savedPantone, setSavedPantone] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("orderNumber", orderNumber);
    formData.append("itemId", itemId);
    formData.append("printWidthInches", "10"); // Standard print zone width

    setUploading(true);
    try {
      const res = await fetch("/api/admin/artwork/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setAnalysis(data.artwork);
      toast.success(`Artwork "${file.name}" ingested and analyzed.`);
      if (onArtworkUpdated && data.artwork.previewUrl) {
        onArtworkUpdated(data.artwork.previewUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSavePantone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pantoneInput.trim()) return;
    setSavedPantone(pantoneInput.trim());
    toast.success(`Pantone code "${pantoneInput.trim()}" saved for print production.`);
  };

  return (
    <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 backdrop-blur-md shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
        <div>
          <h3 className="text-sm font-bold text-[#15101F] dark:text-[#F5F0E8] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#6A2CFF]" />
            <span>Artwork Ingestion & Pre-Flight Analysis</span>
          </h3>
          <p className="text-xs text-[#8A829E] mt-0.5">
            Accepts PNG, JPG, WebP, SVG, PDF directly; AI & CDR stored as production source files.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="relative border-2 border-dashed border-zinc-300 dark:border-white/15 hover:border-[#6A2CFF] rounded-xl p-5 text-center transition-colors">
        <input
          type="file"
          id={`artwork-upload-${itemId}`}
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.ai,.cdr"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="space-y-1.5 pointer-events-none">
          <UploadCloud className="w-6 h-6 text-[#6A2CFF] mx-auto animate-bounce" />
          <p className="text-xs font-semibold text-[#15101F] dark:text-[#F5F0E8]">
            {uploading ? "Analyzing magic bytes & color profiles..." : "Click or drag artwork here to ingest"}
          </p>
          <p className="text-[11px] text-[#8A829E]">
            PNG, JPG, WebP, SVG, PDF, AI, CDR (Max 25 MB)
          </p>
        </div>
      </div>

      {/* Analysis Output when file ingested */}
      {analysis && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 space-y-3.5 animate-in fade-in">
          {/* File header */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <span className="font-bold text-[#15101F] dark:text-[#F5F0E8]">{analysis.originalFilename}</span>
              <span className="text-[#8A829E] ml-2">({(analysis.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-[#6A2CFF] dark:text-[#CDB8FF] border border-[#6A2CFF]/20">
              {analysis.detectedFormat}
            </span>
          </div>

          {/* AI / CDR Source vector message */}
          {analysis.isSourceOnly ? (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <FileCode className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Production Source File (AI/CDR)</span>
                <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-400">
                  Native vector source file stored securely for factory plotters and screen burning. Direct browser preview is not available.
                </p>
                <a
                  href={analysis.downloadUrl}
                  className="mt-2 inline-flex items-center gap-1 font-semibold underline text-blue-700 dark:text-blue-300"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Original Source File</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Effective DPI Preflight Badge */}
              {analysis.effectiveDpi !== undefined && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    analysis.dpiRating === "optimal"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                      : analysis.dpiRating === "warning"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-800 dark:text-amber-300"
                      : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 font-mono">
                      {analysis.dpiRating === "optimal" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span>
                        Effective DPI: {analysis.effectiveDpi} DPI ({analysis.widthPx}px / {analysis.printWidthInches}&quot; zone)
                      </span>
                    </span>
                    <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-white/60 dark:bg-white/10">
                      {analysis.dpiRating?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px]">{analysis.dpiExplanation}</p>
                </div>
              )}

              {/* Dominant Colors Extraction */}
              {analysis.dominantColors && analysis.dominantColors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A829E]">
                    Dominant Colors & Approximate CMYK
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {analysis.dominantColors.map((c, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center gap-2.5"
                      >
                        <div
                          className="w-7 h-7 rounded-lg border border-black/10 shrink-0 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="text-[11px] font-mono leading-tight">
                          <div className="font-bold text-[#15101F] dark:text-[#F5F0E8]">{c.hex}</div>
                          <div className="text-[#8A829E] text-[10px]">
                            C{c.cmyk.c} M{c.cmyk.m} Y{c.cmyk.y} K{c.cmyk.k}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pantone Manual Assignment Form */}
          <form onSubmit={handleSavePantone} className="pt-2 border-t border-zinc-200/80 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Manual Pantone Matching (PMS Code)
              </label>
              <span className="text-[10px] text-zinc-400 italic">No automatic Pantone matching claimed</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={pantoneInput}
                onChange={(e) => setPantoneInput(e.target.value)}
                placeholder="E.g., PMS 2685 C, Pantone Cool Gray 8 C..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-[#15101F] dark:text-[#F5F0E8] focus:outline-none focus:ring-2 focus:ring-[#6A2CFF]/40"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#6A2CFF] text-white hover:bg-[#5822db] transition-colors"
              >
                Save PMS
              </button>
            </div>
            {savedPantone && (
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Active Pantone: <span className="font-bold">{savedPantone}</span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
