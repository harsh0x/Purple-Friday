"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ProductMockup } from "@/components/mockup/ProductMockup";
import { useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

export interface QuickViewProduct {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  basePrice: number;
  mrp: number;
  minQty: number;
  qtyStep?: number;
  template: string;
  colors?: Array<{ name: string; hex: string }>;
}

interface QuickViewSheetProps {
  product: QuickViewProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewSheet({ product, isOpen, onClose }: QuickViewSheetProps) {
  const { addItem, openCart } = useCart();
  const [selectedColor, setSelectedColor] = useState<string>("#15101F");
  const [qty, setQty] = useState<number>(product?.minQty || 5);

  React.useEffect(() => {
    if (product) {
      setQty(product.minQty || 5);
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0].hex);
      } else {
        setSelectedColor("#15101F");
      }
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    const colorName =
      product.colors?.find((c) => c.hex === selectedColor)?.name || "Standard";

    addItem({
      productId: product.slug,
      optionKey: `${product.slug}-${colorName.toLowerCase().replace(/\s+/g, "-")}`,
      qty,
      name: product.name,
      slug: product.slug,
      unitPrice: product.basePrice,
      template: product.template,
      options: { Colour: colorName },
    });

    onClose();
    openCart();
    toast.success(`Added ${qty} × ${product.name} to cart!`);
  };

  const lineTotal = product.basePrice * qty;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent side="responsive">
        <DrawerHeader>
          <div>
            <DrawerTitle>Quick View & Order</DrawerTitle>
            <DrawerDescription>
              Select options and add directly to your bulk cart
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <DrawerBody className="p-6 space-y-6">
          <div className="flex gap-4 items-center">
            <div className="h-28 w-28 p-2 bg-paper rounded-xs shrink-0 border border-ink/20 flex items-center justify-center">
              <ProductMockup
                template={product.template}
                color={selectedColor}
                className="max-h-full max-w-full drop-shadow-sm"
              />
            </div>
            <div>
              <span className="font-mono text-xs uppercase font-bold text-violet">
                Min. {product.minQty} pcs
              </span>
              <h3 className="font-display font-bold text-base text-ink line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-bold text-lg text-ink">
                  {formatINR(product.basePrice)}
                </span>
                <span className="font-mono text-xs text-ink/40 line-through">
                  {formatINR(product.mrp)}
                </span>
                <span className="text-[10px] font-mono font-bold text-ink bg-spot-lime px-1.5 py-0.5 rounded-xs">
                  Save {Math.round(((product.mrp - product.basePrice) / product.mrp) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/80 font-bold">
                Select Garment / Material Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`h-9 w-9 rounded-full border-2 transition-transform ${
                      selectedColor === c.hex
                        ? "scale-110 border-violet ring-2 ring-violet ring-offset-2"
                        : "border-ink/20 hover:scale-105"
                    }`}
                    title={c.name}
                    aria-label={`Select color ${c.name}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/80 font-bold">
                Bulk Quantity
              </label>
              <span className="font-mono text-xs text-ink/60">
                Min {product.minQty} • Step {product.qtyStep || 1}
              </span>
            </div>
            <div className="flex items-center border border-ink rounded-sm bg-paper-pure max-w-xs">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(product.minQty, prev - (product.qtyStep || 1)))}
                disabled={qty <= product.minQty}
                className="p-3 text-ink hover:bg-ink/10 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={qty}
                min={product.minQty}
                step={product.qtyStep || 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= product.minQty) setQty(val);
                }}
                className="flex-1 text-center font-mono font-bold text-sm bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setQty((prev) => prev + (product.qtyStep || 1))}
                className="p-3 text-ink hover:bg-ink/10"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter className="space-y-2">
          <Button
            variant="stamp"
            onClick={handleAddToCart}
            className="w-full"
          >
            Add {qty} Pcs to Cart — {formatINR(lineTotal)}
          </Button>
          <Link
            href={`/product/${product.slug}`}
            onClick={onClose}
            className="w-full text-center py-2 text-xs font-mono uppercase text-ink/70 hover:text-violet flex items-center justify-center gap-1"
          >
            <span>Full 3D Customizer & Tier Details</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

