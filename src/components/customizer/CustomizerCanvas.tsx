"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Rect,
  Circle,
  Line,
  Group,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { PrintAreaBounds } from "@/lib/customizer/print-areas";
import { DpiCalculationResult } from "@/lib/customizer/quality";

export interface CustomizerCanvasProps {
  template: string;
  selectedColor: string;
  view: "front" | "back";
  printArea: PrintAreaBounds;
  logoUrl?: string;
  logoOpacity: number;
  logoFlipped: boolean;
  textLayers: Array<{
    id: string;
    text: string;
    fontFamily: string;
    fontSize: number;
    fill: string;
    x: number;
    y: number;
  }>;
  onUpdateLogoTransform: (transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  }) => void;
  onUpdateTextLayer: (id: string, updates: Partial<{ x: number; y: number }>) => void;
  onSelectElement: (type: "logo" | "text" | null, id?: string) => void;
  selectedElement: { type: "logo" | "text" | null; id?: string };
  dpiResult: DpiCalculationResult;
  onOpenTeamDesign: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function CustomizerCanvas({
  template,
  selectedColor,
  view,
  printArea,
  logoUrl,
  logoOpacity,
  logoFlipped,
  textLayers,
  onUpdateLogoTransform,
  onUpdateTextLayer,
  onSelectElement,
  selectedElement,
  dpiResult,
  onOpenTeamDesign,
  stageRef,
}: CustomizerCanvasProps) {
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [showSnapX, setShowSnapX] = useState(false);
  const [showSnapY, setShowSnapY] = useState(false);

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const logoNodeRef = useRef<Konva.Image | null>(null);
  const textNodesRef = useRef<Map<string, Konva.Text>>(new Map());

  // Load logo HTML image
  useEffect(() => {
    if (!logoUrl) {
      setLogoImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = logoUrl;
    img.onload = () => setLogoImage(img);
  }, [logoUrl]);

  // Update Konva Transformer attachment
  useEffect(() => {
    if (!transformerRef.current) return;

    if (selectedElement.type === "logo" && logoNodeRef.current) {
      transformerRef.current.nodes([logoNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (selectedElement.type === "text" && selectedElement.id) {
      const textNode = textNodesRef.current.get(selectedElement.id);
      if (textNode) {
        transformerRef.current.nodes([textNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElement, logoImage, textLayers]);

  // Arrow key nudging handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1;

      if (selectedElement.type === "logo" && logoNodeRef.current) {
        const node = logoNodeRef.current;
        let handled = false;

        if (e.key === "ArrowLeft") {
          node.x(node.x() - step);
          handled = true;
        } else if (e.key === "ArrowRight") {
          node.x(node.x() + step);
          handled = true;
        } else if (e.key === "ArrowUp") {
          node.y(node.y() - step);
          handled = true;
        } else if (e.key === "ArrowDown") {
          node.y(node.y() + step);
          handled = true;
        }

        if (handled) {
          e.preventDefault();
          onUpdateLogoTransform({
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
        }
      }
    },
    [selectedElement, onUpdateLogoTransform]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const centerX = printArea.x + printArea.width / 2;
  const centerY = printArea.y + printArea.height / 2;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Canvas Quality & Dimension Bar */}
      <div className="w-full max-w-[560px] flex items-center justify-between pb-3 text-xs font-mono text-pf-ink/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PRINT AREA: {printArea.physicalWidthMm}mm</span>
        </div>

        {logoUrl && (
          <div className="flex items-center gap-2">
            {dpiResult.isLowQuality ? (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span>⚠️ {dpiResult.dpi} DPI (Low)</span>
                <button
                  type="button"
                  onClick={onOpenTeamDesign}
                  className="underline font-bold hover:text-amber-800"
                >
                  Free Clean-Up
                </button>
              </div>
            ) : (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ {dpiResult.dpi} DPI ({dpiResult.rating})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Konva Stage Box */}
      <div className="w-full max-w-[560px] aspect-square rounded-2xl bg-white border border-pf-ink/10 shadow-sm relative overflow-hidden select-none">
        <Stage
          width={560}
          height={560}
          ref={stageRef}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              onSelectElement(null);
            }
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) {
              onSelectElement(null);
            }
          }}
        >
          {/* Base Product Silhouette Layer */}
          <Layer>
            {/* Background fabric canvas tint */}
            <Rect width={560} height={560} fill="#FAF8F5" />

            {/* Product Body Silhouette Shape based on template */}
            <Group x={30} y={30}>
              {template.includes("badge") ? (
                <Circle
                  x={250}
                  y={250}
                  radius={200}
                  fill={selectedColor}
                  stroke="#15101F"
                  strokeWidth={3}
                  shadowColor="#15101F"
                  shadowBlur={12}
                  shadowOpacity={0.15}
                />
              ) : template.includes("cap") ? (
                <Rect
                  x={100}
                  y={130}
                  width={300}
                  height={240}
                  cornerRadius={100}
                  fill={selectedColor}
                  stroke="#15101F"
                  strokeWidth={3}
                  shadowColor="#15101F"
                  shadowBlur={10}
                  shadowOpacity={0.12}
                />
              ) : template.includes("bottle") ? (
                <Rect
                  x={170}
                  y={80}
                  width={160}
                  height={350}
                  cornerRadius={24}
                  fill={selectedColor}
                  stroke="#15101F"
                  strokeWidth={3}
                  shadowColor="#15101F"
                  shadowBlur={10}
                  shadowOpacity={0.12}
                />
              ) : (
                /* Apparel Silhouette (Tee, Polo, Hoodie) */
                <Rect
                  x={80}
                  y={40}
                  width={340}
                  height={420}
                  cornerRadius={32}
                  fill={selectedColor}
                  stroke="#15101F"
                  strokeWidth={3}
                  shadowColor="#15101F"
                  shadowBlur={14}
                  shadowOpacity={0.15}
                />
              )}
            </Group>

            {/* Print Area Guide (Dashed boundary & watermarked corner) */}
            {printArea.shape === "circle" ? (
              <Circle
                x={centerX}
                y={centerY}
                radius={printArea.width / 2}
                stroke="#6A2CFF"
                strokeWidth={1.5}
                dash={[6, 4]}
                opacity={0.65}
              />
            ) : (
              <Rect
                x={printArea.x}
                y={printArea.y}
                width={printArea.width}
                height={printArea.height}
                stroke="#6A2CFF"
                strokeWidth={1.5}
                dash={[6, 4]}
                opacity={0.65}
                cornerRadius={4}
              />
            )}

            {/* Print Area Label */}
            <KonvaText
              x={printArea.x + 8}
              y={printArea.y + 8}
              text={`PRINT AREA • ${view.toUpperCase()}`}
              fontSize={9}
              fontFamily="DM Mono"
              fill="#6A2CFF"
              opacity={0.5}
            />

            {/* Center Snapping Guidelines */}
            {showSnapX && (
              <Line
                points={[centerX, printArea.y, centerX, printArea.y + printArea.height]}
                stroke="#6A2CFF"
                strokeWidth={1}
                dash={[3, 3]}
              />
            )}
            {showSnapY && (
              <Line
                points={[printArea.x, centerY, printArea.x + printArea.width, centerY]}
                stroke="#6A2CFF"
                strokeWidth={1}
                dash={[3, 3]}
              />
            )}
          </Layer>

          {/* Interactive Artwork Layer */}
          <Layer>
            {/* Customer Logo */}
            {logoImage && (
              <KonvaImage
                ref={logoNodeRef}
                image={logoImage}
                x={centerX - 50}
                y={centerY - 50}
                width={100}
                height={100}
                opacity={logoOpacity}
                scaleX={logoFlipped ? -1 : 1}
                draggable
                dragBoundFunc={(pos) => {
                  const nodeWidth = 100 * Math.abs(logoNodeRef.current?.scaleX() || 1);
                  const nodeHeight = 100 * Math.abs(logoNodeRef.current?.scaleY() || 1);

                  // Snapping detection (within 6px of center)
                  const nearCenterX = Math.abs(pos.x + nodeWidth / 2 - centerX) < 6;
                  const nearCenterY = Math.abs(pos.y + nodeHeight / 2 - centerY) < 6;

                  setShowSnapX(nearCenterX);
                  setShowSnapY(nearCenterY);

                  const snappedX = nearCenterX ? centerX - nodeWidth / 2 : pos.x;
                  const snappedY = nearCenterY ? centerY - nodeHeight / 2 : pos.y;

                  // Clamping inside print area bounds
                  const minX = printArea.x;
                  const maxX = printArea.x + printArea.width - nodeWidth;
                  const minY = printArea.y;
                  const maxY = printArea.y + printArea.height - nodeHeight;

                  return {
                    x: Math.max(minX, Math.min(snappedX, maxX)),
                    y: Math.max(minY, Math.min(snappedY, maxY)),
                  };
                }}
                onClick={() => onSelectElement("logo")}
                onTap={() => onSelectElement("logo")}
                onDragEnd={() => {
                  setShowSnapX(false);
                  setShowSnapY(false);
                  if (logoNodeRef.current) {
                    onUpdateLogoTransform({
                      x: logoNodeRef.current.x(),
                      y: logoNodeRef.current.y(),
                      scaleX: logoNodeRef.current.scaleX(),
                      scaleY: logoNodeRef.current.scaleY(),
                      rotation: logoNodeRef.current.rotation(),
                    });
                  }
                }}
                onTransformEnd={() => {
                  if (logoNodeRef.current) {
                    onUpdateLogoTransform({
                      x: logoNodeRef.current.x(),
                      y: logoNodeRef.current.y(),
                      scaleX: logoNodeRef.current.scaleX(),
                      scaleY: logoNodeRef.current.scaleY(),
                      rotation: logoNodeRef.current.rotation(),
                    });
                  }
                }}
              />
            )}

            {/* Text Layers */}
            {textLayers.map((layer) => (
              <KonvaText
                key={layer.id}
                ref={(node) => {
                  if (node) textNodesRef.current.set(layer.id, node);
                  else textNodesRef.current.delete(layer.id);
                }}
                text={layer.text}
                x={layer.x}
                y={layer.y}
                fontSize={layer.fontSize}
                fontFamily={layer.fontFamily}
                fill={layer.fill}
                draggable
                dragBoundFunc={(pos) => ({
                  x: Math.max(printArea.x, Math.min(pos.x, printArea.x + printArea.width - 60)),
                  y: Math.max(printArea.y, Math.min(pos.y, printArea.y + printArea.height - 20)),
                })}
                onClick={() => onSelectElement("text", layer.id)}
                onTap={() => onSelectElement("text", layer.id)}
                onDragEnd={(e) => {
                  onUpdateTextLayer(layer.id, { x: e.target.x(), y: e.target.y() });
                }}
              />
            ))}

            {/* Konva Transformer */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size limit
                if (newBox.width < 20 || newBox.height < 20) {
                  return oldBox;
                }
                return newBox;
              }}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              rotateEnabled={true}
              anchorCornerRadius={3}
              anchorFill="#6A2CFF"
              anchorStroke="#FFFFFF"
              anchorSize={9}
              borderStroke="#6A2CFF"
              borderDash={[4, 4]}
            />
          </Layer>
        </Stage>
      </div>

      {/* Helpful Hint */}
      <div className="mt-3 text-center text-xs text-pf-ink/60 font-sans">
        💡 Drag artwork to move. Use corners to scale. Use arrow keys on keyboard to nudge (1px).
      </div>
    </div>
  );
}
