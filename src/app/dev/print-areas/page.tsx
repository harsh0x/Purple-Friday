"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import { ProductMockup } from "@/components/mockup/ProductMockup";

const ALL_SLUGS = [
  "classic-crewneck-tshirt",
  "heavyweight-oversized-tee",
  "sports-performance-tee",
  "premium-organic-cotton-tee",
  "executive-pique-polo",
  "contrast-tipped-polo",
  "drifit-team-polo",
  "heavyweight-uniform-polo",
  "classic-pullover-hoodie",
  "metal-zipper-fleece-jacket",
  "minimalist-crewneck-sweatshirt",
  "varsity-raglan-hoodie",
  "structured-cotton-twill-cap",
  "trucker-mesh-snapback-cap",
  "unstructured-dad-hat",
  "performance-running-visor",
  "round-gloss-badge-58mm",
  "matte-rectangle-name-badge",
  "metallic-gold-lapel-badge",
  "clear-acrylic-conference-badge",
  "matte-insulated-steel-flask",
  "hardbound-leather-journal-a5",
  "executive-brass-twist-pen",
  "steel-engraved-keychain",
];

export default function DevPrintAreasPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const [selectedSlug, setSelectedSlug] = useState("classic-crewneck-tshirt");
  const [view, setView] = useState<"front" | "back">("front");
  const [printArea, setPrintArea] = useState({ x: 36, y: 26, width: 28, height: 28, rotation: 0 });
  const [color, setColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);

  const jsonSnippet = JSON.stringify(printArea, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-paper p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-ink/20 pb-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-violet font-bold">
              Atelier Engineering Tool
            </span>
            <h1 className="font-display text-2xl font-black text-ink">
              Print Safe Area Calibrator (/dev/print-areas)
            </h1>
          </div>
          <span className="px-3 py-1 bg-spot-lime text-ink font-mono text-xs font-bold rounded-sm border border-ink">
            Dev Mode Only
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Visualizer */}
          <div className="lg:col-span-7 bg-paper-pure border-2 border-ink p-6 rounded-sm shadow-stamp relative">
            <div className="aspect-square relative max-w-lg mx-auto border border-ink/20 bg-[#F5F3EF]">
              <ProductMockup
                slug={selectedSlug}
                view={view}
                color={color}
                printArea={printArea}
                showBadge
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-5 space-y-6 bg-paper-pure border-2 border-ink p-6 rounded-sm shadow-stamp">
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-1">Select Product</label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full font-mono text-xs border-2 border-ink p-2 rounded-xs bg-white text-ink"
              >
                {ALL_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setView("front")}
                className={`flex-1 py-2 font-mono text-xs font-bold uppercase border-2 border-ink ${
                  view === "front" ? "bg-violet text-white" : "bg-white text-ink"
                }`}
              >
                Front View
              </button>
              <button
                type="button"
                onClick={() => setView("back")}
                className={`flex-1 py-2 font-mono text-xs font-bold uppercase border-2 border-ink ${
                  view === "back" ? "bg-violet text-white" : "bg-white text-ink"
                }`}
              >
                Back View
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>X Position (Horizontal %):</span>
                  <span className="font-bold">{printArea.x}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={printArea.x}
                  onChange={(e) => setPrintArea({ ...printArea, x: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Y Position (Vertical %):</span>
                  <span className="font-bold">{printArea.y}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={printArea.y}
                  onChange={(e) => setPrintArea({ ...printArea, y: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Width (% of canvas):</span>
                  <span className="font-bold">{printArea.width}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={printArea.width}
                  onChange={(e) => setPrintArea({ ...printArea, width: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Height (% of canvas):</span>
                  <span className="font-bold">{printArea.height}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={printArea.height}
                  onChange={(e) => setPrintArea({ ...printArea, height: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Rotation (degrees):</span>
                  <span className="font-bold">{printArea.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={printArea.rotation}
                  onChange={(e) => setPrintArea({ ...printArea, rotation: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Tint Color Swatches */}
            <div>
              <label className="block font-mono text-xs font-bold text-ink mb-2">Test Garment Tint</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "White", hex: "#FFFFFF" },
                  { name: "Black", hex: "#15101F" },
                  { name: "Navy", hex: "#1B2A4A" },
                  { name: "Red", hex: "#C81E1E" },
                  { name: "Grey", hex: "#9E9E9E" },
                  { name: "Violet", hex: "#6A2CFF" },
                  { name: "Lime", hex: "#A3E635" },
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className="h-8 w-8 rounded-full border-2 border-ink shadow-xs"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Code Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-ink">Calculated JSON:</span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="font-mono text-xs px-2 py-1 bg-violet text-white rounded-xs"
                >
                  {copied ? "Copied!" : "Copy JSON"}
                </button>
              </div>
              <pre className="p-3 bg-paper font-mono text-xs text-ink rounded-xs border border-ink/20 overflow-x-auto">
                {jsonSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

