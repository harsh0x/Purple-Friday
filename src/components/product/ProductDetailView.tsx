"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, ShieldCheck, ShoppingCart, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import { ProductGallery } from "./ProductGallery";
import { OptionSelectors, ColorOption, ShapeOption, FabricOption } from "./OptionSelectors";
import { QuantityPriceTiers, PriceTier } from "./QuantityPriceTiers";
import { DeliveryEstimator } from "./DeliveryEstimator";
import { ProductAccordionTabs } from "./ProductAccordionTabs";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { StickyMobileBar } from "./StickyMobileBar";
import { LetOurTeamDesignModal } from "./LetOurTeamDesignModal";
import { ProductCard, ProductCardData } from "./ProductCard";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatINR, calculateDiscountPercent } from "@/lib/utils";

export interface ProductDetailProps {
  product: {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    description: string;
    badges: string[];
    specChips: string[];
    audience: string;
    minQty: number;
    qtyStep: number;
    mrp: number;
    basePrice: number;
    printMethod: string;
    template: string;
    rating: number;
    reviewCount: number;
    colors: ColorOption[];
    priceTiers: PriceTier[];
  };
  relatedProducts: ProductCardData[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // State
  const [quantity, setQuantity] = useState<number>(product.minQty);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0]?.hex || "#FFFFFF"
  );
  const [selectedShape, setSelectedShape] = useState<string>("circle");
  const [selectedFabric, setSelectedFabric] = useState<string>("cotton-100");
  const [selectedSize, setSelectedSize] = useState<string>("L");

  const isFavorited = isInWishlist(product.slug);

  // Compute active unit price based on quantity
  const activeTier =
    product.priceTiers.find((t) => {
      if (t.maxQty === null) return quantity >= t.minQty;
      return quantity >= t.minQty && quantity <= t.maxQty;
    }) || product.priceTiers[0];

  const unitPrice = activeTier ? activeTier.unitPrice : product.basePrice;
  const lineTotal = quantity * unitPrice;
  const discountPercent = calculateDiscountPercent(product.mrp, unitPrice);

  // Dynamic Options by Category
  const isBadge = product.template.includes("badge");
  const isApparel =
    product.template.includes("tee") ||
    product.template.includes("polo") ||
    product.template.includes("hoodie");

  const shapes: ShapeOption[] = isBadge
    ? [
        { id: "circle", name: "Circle", description: "58mm Standard", icon: "circle" },
        { id: "rect", name: "Rectangle", description: "70x25mm Name", icon: "rect" },
        { id: "square", name: "Square", description: "50x50mm Edge", icon: "square" },
        { id: "contour", name: "Contour Cut", description: "Custom Die", icon: "contour" },
      ]
    : [];

  const fabrics: FabricOption[] = isApparel
    ? [
        {
          id: "cotton-100",
          name: "100% Super-Combed Cotton",
          weightGsm: product.template.includes("hoodie") ? 320 : 180,
          badge: "Popular",
          description: "Bio-washed, pre-shrunk silky jersey",
        },
        {
          id: "french-terry",
          name: "Heavyweight French Terry",
          weightGsm: product.template.includes("hoodie") ? 360 : 240,
          badge: "Premium",
          description: "Structured streetwear drape",
        },
      ]
    : [];

  const sizes = isApparel ? ["S", "M", "L", "XL", "2XL"] : [];

  // Direct Add to Cart (Blank / Previously Designed Order)
  const handleAddToCart = () => {
    const selectedColorName =
      product.colors?.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name ||
      "Standard";

    const optionKey = `${product.slug}-${selectedColorName}-${selectedSize}-${selectedShape}-${selectedFabric}`;

    addItem({
      productId: product.id,
      optionKey,
      qty: quantity,
      name: product.name,
      slug: product.slug,
      unitPrice,
      template: product.template,
      options: {
        Colour: selectedColorName,
        ...(isApparel ? { Size: selectedSize, Fabric: selectedFabric } : {}),
        ...(isBadge ? { Shape: selectedShape } : {}),
      },
    });

    toast.success(`${quantity}x ${product.shortName} added to cart!`);
    openCart();
  };

  // Nav to customizer
  const handleDesignNow = () => {
    const query = new URLSearchParams();
    query.set("qty", String(quantity));
    query.set("color", selectedColor);
    if (isApparel) {
      query.set("size", selectedSize);
      query.set("fabric", selectedFabric);
    }
    if (isBadge) {
      query.set("shape", selectedShape);
    }
    router.push(`/customize/${product.slug}?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-pf-paper pb-20">
      {/* Breadcrumb Strip */}
      <div className="border-b border-pf-ink/10 bg-white px-4 md:px-8 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-2 font-mono text-xs text-pf-ink/60">
          <Link href="/" className="hover:text-pf-violet">
            Home
          </Link>
          <span>/</span>
          <Link href="/collections/all" className="hover:text-pf-violet">
            Collections
          </Link>
          <span>/</span>
          <span className="font-bold text-pf-ink truncate">{product.shortName}</span>
        </div>
      </div>

      {/* Main 2-Column Product Grid */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Gallery & Technical Accordion (6 cols) */}
          <div className="lg:col-span-6 space-y-8">
            <ProductGallery
              template={product.template}
              selectedColor={selectedColor}
              productName={product.name}
            />

            <ProductAccordionTabs
              specs={product.specChips.map((s) => ({ label: "Feature", value: s }))}
              printMethod={product.printMethod}
              minQty={product.minQty}
            />
          </div>

          {/* Right Column: Product Info & Purchase Controls (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header info */}
            <div>
              {/* Badges & Trust Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.badges.map((b) => (
                  <span
                    key={b}
                    className="font-mono text-[10px] font-bold uppercase tracking-wider bg-pf-lime text-pf-ink px-2 py-0.5 border border-pf-ink/30"
                  >
                    {b}
                  </span>
                ))}
                <span className="font-mono text-[10px] text-pf-ink/60 bg-pf-ink/5 px-2 py-0.5 border border-pf-ink/10">
                  Pre-Flight Proof Included
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-pf-ink leading-tight">
                {product.name}
              </h1>

              {/* Rating & Orders Count */}
              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex items-center gap-1 text-pf-violet">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-pf-violet text-pf-violet" />
                  ))}
                  <span className="font-mono text-xs font-bold text-pf-ink ml-1.5">
                    {product.rating}
                  </span>
                </div>
                <span className="text-pf-ink/30">•</span>
                <span className="font-mono text-xs text-pf-ink/70">
                  {product.reviewCount} Verified Reviews
                </span>
                <span className="text-pf-ink/30">•</span>
                <span className="font-mono text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  1,200+ runs delivered
                </span>
              </div>
            </div>

            {/* Price Block */}
            <div className="border-2 border-pf-ink bg-white p-4 shadow-[4px_4px_0_0_#15101F]">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-3xl font-black text-pf-ink">
                  {formatINR(unitPrice)}
                </span>
                <span className="font-mono text-base text-pf-ink/40 line-through">
                  {formatINR(product.mrp)}
                </span>
                {discountPercent > 0 && (
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded">
                    Save {discountPercent}%
                  </span>
                )}
                <span className="font-mono text-xs text-pf-ink/60">/ piece</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs font-mono text-pf-ink/60">
                <span>Inclusive of all taxes (18% GST)</span>
                <span>Minimum Order: {product.minQty} pcs</span>
              </div>
            </div>

            {/* Option Selectors: Shapes, Colours, Fabrics, Sizes */}
            <div className="border-2 border-pf-ink bg-white p-5 shadow-[4px_4px_0_0_#15101F] space-y-6">
              <OptionSelectors
                shapes={shapes}
                selectedShape={selectedShape}
                onSelectShape={setSelectedShape}
                colors={product.colors}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                fabrics={fabrics}
                selectedFabric={selectedFabric}
                onSelectFabric={setSelectedFabric}
                sizes={sizes}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
              />
            </div>

            {/* Quantity Stepper, Dynamic Upsell & Price Tiers */}
            <div className="border-2 border-pf-ink bg-white p-5 shadow-[4px_4px_0_0_#15101F]">
              <QuantityPriceTiers
                tiers={product.priceTiers}
                quantity={quantity}
                minQty={product.minQty}
                qtyStep={product.qtyStep}
                basePrice={product.basePrice}
                mrp={product.mrp}
                onQuantityChange={setQuantity}
              />
            </div>

            {/* CTAs Block */}
            <div className="space-y-3 pt-2">
              {/* Primary Stamp CTA */}
              <button
                type="button"
                onClick={handleDesignNow}
                className="w-full flex items-center justify-center gap-3 border-2 border-pf-ink bg-pf-violet text-white font-mono text-base font-extrabold uppercase tracking-wider py-4 shadow-[5px_5px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#15101F] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
              >
                <Sparkles className="h-5 w-5 text-pf-lime" />
                <span>Design Your {product.shortName}</span>
              </button>

              {/* Secondary Direct Add to Cart & Wishlist */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-pf-ink bg-white text-pf-ink font-mono text-xs font-bold uppercase tracking-wider py-3 shadow-[3px_3px_0_0_#15101F] hover:bg-pf-paper hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add Plain / Blank Order ({quantity} pcs)</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.slug)}
                  aria-label="Add to wishlist"
                  className={`h-11 w-11 shrink-0 rounded-full border-2 border-pf-ink flex items-center justify-center shadow-[2px_2px_0_0_#15101F] transition-all ${
                    isFavorited
                      ? "bg-rose-50 text-rose-600 border-rose-600"
                      : "bg-white text-pf-ink hover:bg-pf-paper"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-rose-600" : ""}`} />
                </button>
              </div>

              {/* Let Our Team Design It Modal Trigger */}
              <div className="text-center pt-1">
                <LetOurTeamDesignModal
                  productName={product.name}
                  productSlug={product.slug}
                />
              </div>
            </div>

            {/* Delivery Estimator */}
            <DeliveryEstimator subtotal={lineTotal} />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-20">
        <ProductReviewsSection
          productName={product.name}
          overallRating={product.rating}
          totalReviews={product.reviewCount}
        />
      </div>

      {/* Related Products Carousel */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="border-t-2 border-pf-ink bg-pf-paper py-16 px-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
                Explore More Blanks
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-pf-ink mt-1">
                Related custom merchandise
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Mobile Bar */}
      <StickyMobileBar
        productName={product.shortName}
        unitPrice={unitPrice}
        productSlug={product.slug}
        selectedColor={selectedColor}
        quantity={quantity}
      />
    </div>
  );
}
