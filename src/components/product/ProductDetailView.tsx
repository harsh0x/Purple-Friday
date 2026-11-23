"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, ShieldCheck, ShoppingCart, Sparkles, Heart, Share2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ProductGallery } from "./ProductGallery";
import { OptionSelectors, ColorOption, ShapeOption, FabricOption } from "./OptionSelectors";
import { QuantityPriceTiers, PriceTier } from "./QuantityPriceTiers";
import { ApparelSizePicker } from "./ApparelSizePicker";
import { DeliveryEstimator } from "./DeliveryEstimator";
import { ProductAccordionTabs } from "./ProductAccordionTabs";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { StickyMobileBar } from "./StickyMobileBar";
import { LetOurTeamDesignModal } from "./LetOurTeamDesignModal";
import { ProductCard, ProductCardData } from "./ProductCard";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatINR, calculateDiscountPercent } from "@/lib/utils";
import { categoryHref } from "@/lib/urls";

// Complete 15-color studio palette as specified by user
const STORE_PALETTE: ColorOption[] = [
  { name: "Black", hex: "#15101F" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Red", hex: "#C81E1E" },
  { name: "Grey", hex: "#9E9E9E" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Maroon", hex: "#800020" },
  { name: "Royal Blue", hex: "#2B4C7E" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#6A2CFF" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Sky Blue", hex: "#38BDF8" },
  { name: "Dark Green", hex: "#14532D" },
  { name: "Lime", hex: "#A3E635" },
  { name: "Green", hex: "#16A34A" },
];

export interface ProductDetailProps {
  product: {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    categorySlug?: string;
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

  // Category Flags
  const isBadge =
    product.template.includes("badge") ||
    product.categorySlug === "magnetic-badges";
  const isApparel =
    product.template.includes("tee") ||
    product.template.includes("polo") ||
    product.template.includes("hoodie") ||
    product.categorySlug === "t-shirts" ||
    product.categorySlug === "polo-shirts" ||
    product.categorySlug === "hoodies";
  const isCap =
    product.template.includes("cap") || product.categorySlug === "caps";
  const isCorporateGift =
    product.categorySlug === "corporate-gifts" ||
    product.template.includes("bottle") ||
    product.template.includes("notebook") ||
    product.template.includes("pen") ||
    product.template.includes("keychain");

  // State
  const [quantity, setQuantity] = useState<number>(product.minQty);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0]?.hex || "#FFFFFF"
  );
  const [selectedShape, setSelectedShape] = useState<string>("circle");
  const [selectedFabric, setSelectedFabric] = useState<string>("cotton-100");
  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [selectedFinish, setSelectedFinish] = useState<string>("gloss");
  const [selectedEngraving, setSelectedEngraving] = useState<string>("laser-mirror");

  // Apparel Size-Wise Distribution State
  const [sizeSplit, setSizeSplit] = useState<Record<string, number>>({
    L: product.minQty,
  });

  const totalSizeSelected = Object.values(sizeSplit).reduce((sum, n) => sum + (n || 0), 0);
  const sizeSplitMatches = !isApparel || totalSizeSelected === quantity;

  // Handle Quantity Change from Tier Stepper
  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    if (isApparel) {
      // Re-allocate remaining or default to L
      setSizeSplit({ L: newQty });
    }
  };

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

  // Dynamic Options: Badge Shapes
  const shapes: ShapeOption[] = isBadge
    ? [
        { id: "contour", name: "Logo Cutout", description: "Contour Die Cut", icon: "contour" },
  { id: "circle", name: "Circle", description: "58mm Standard", icon: "circle" },
  { id: "square", name: "Square", description: "50x50mm Edge", icon: "square" },
  { id: "rect", name: "Rectangle", description: "70x25mm Name", icon: "rect" },
      ]
    : [];

  // Determine effective photo slug (Badges switch photo based on shape card!)
  let effectivePhotoSlug = product.slug;
  if (isBadge) {
    if (selectedShape === "rect") effectivePhotoSlug = "matte-rectangle-name-badge";
    else if (selectedShape === "contour") effectivePhotoSlug = "metallic-gold-lapel-badge";
    else if (selectedShape === "square") effectivePhotoSlug = "clear-acrylic-conference-badge";
    else effectivePhotoSlug = "round-gloss-badge-58mm";
  }

  // Color options: for apparel use 15-color palette, else product palette
  const effectiveColors: ColorOption[] = isApparel ? STORE_PALETTE : product.colors;

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
    : isCap
    ?[
        {
          id: "cotton-twill",
          name: "100% Brushed Cotton Twill",
          weightGsm: 280,
          badge: "Popular",
          description: "Heavyweight structured 6-panel",
        },
        {
          id: "breathable-mesh",
          name: "Breathable Nylon Trucker Mesh",
          weightGsm: 180,
          badge: "Eco-Choice",
          description: "Airflow cooling back panels",
        },
      ]
    : [];

  const nonApparelSizes = isBadge ? ["44mm", "58mm", "70x25mm"] : [];

  // Direct Add to Cart
  const handleAddToCart = () => {
    if (isApparel && !sizeSplitMatches) {
      toast.error(`Please allocate sizes to match your quantity of ${quantity} pcs!`);
      return;
    }

    const selectedColorName =
      effectiveColors.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name ||
      "Standard";

    const sizeSummary = isApparel
      ? Object.entries(sizeSplit)
        .filter(([, count]) => count > 0)
        .map(([s, count]) => `${s}: ${count}`)
        .join(", ")
      : selectedSize;

    const optionKey = `${product.slug}-${selectedColorName}-${sizeSummary}-${selectedShape}-${selectedFabric}-${selectedFinish}-${selectedEngraving}`;

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
        ...(isApparel ? { "Size Distribution": sizeSummary, Fabric: selectedFabric } : {}),
        ...(isBadge ? { Shape: selectedShape, Finish: selectedFinish, Size: selectedSize } : {}),
        ...(isCorporateGift ? { Engraving: selectedEngraving } : {}),
      },
    });

    toast.success(`Added ${quantity}x ${product.shortName} to your cart!`);
    openCart();
  };

  // Nav to customizer studio
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
    router.push(`/design/${product.slug}?${query.toString()}`);
  };

  // Web Share API
  const handleShare = async () => {
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Purple Friday:`,
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else if (typeof window !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Product URL copied to clipboard!");
    }
  };

  return (
    <div className="bg-paper min-h-screen pb-24 lg:pb-0">
      {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-ink/20 bg-paper-pure px-4 md:px-8 py-3 text-xs font-mono text-ink/70"
        >
          <div className="mx-auto max-w-7xl flex items-center gap-2">
            <Link href="/" className="hover:text-violet transition-colors">
              Home
            </Link>
            <span>/</span>
            {product.categorySlug && (
              <>
                <Link
                  href={categoryHref(product.categorySlug)}
                  className="hover:text-violet transition-colors capitalize"
                >
                  {product.categorySlug.replace(/-/g, " ")}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-ink font-bold truncate">{product.name}</span>
          </div>
        </nav>

              {/* Main Viewport Grid */}
              <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  {/* Left Column: Real Photographic Gallery & Zoom Stage (6 cols) */}
                  <div className="lg:col-span-6 lg:sticky lg:top-24">
                    <ProductGallery
                      template={product.template}
                      slug={effectivePhotoSlug}
                      selectedColor={selectedColor}
                      productName={product.name}
                      isApparel={isApparel}
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
                          className="font-mono text-[10px] font-bold uppercase tracking-wider bg-spot-lime text-ink px-2.5 py-0.5 border border-ink/30 rounded-xs"
                        >
                          {b}
                        </span>
                      ))}
                      <span className="font-mono text-[10px] text-ink/70 bg-ink/5 px-2.5 py-0.5 border border-ink/10 rounded-xs">
                        100% Studio Proof Included
                      </span>
                    </div>

                        {/* Product Title */}
                        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink leading-tight">
                          {product.name}
                        </h1>

                              {/* Rating & Orders Count */ }
                              < div className = "mt-2.5 flex items-center gap-3" >
                <div className="flex items-center gap-1 text-violet">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-violet text-violet" />
                  ))}
                        <span className="font-mono text-xs font-bold text-ink ml-1.5">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-ink/30">•</span>
                      <span className="font-mono text-xs text-ink/70">
                        {product.reviewCount} Verified Reviews
                      </span>
                      <span className="text-ink/30">•</span>
                      <span className="font-mono text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        1,200+ runs delivered
                      </span>
                    </div>
                  </div>

                        {/* Price Block */ }
                        < div className="border-2 border-ink bg-white p-4 shadow-stamp">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-3xl font-black text-ink">
                          {formatINR(unitPrice)}
                        </span>
                        <span className="font-mono text-base text-ink/40 line-through">
                          {formatINR(product.mrp)}
                        </span>
                        {discountPercent > 0 && (
                          <span className="font-mono text-xs font-bold text-ink bg-spot-lime px-2 py-0.5 border border-ink/20 rounded">
                            Save {discountPercent}%
                          </span>
                        )}
                        <span className="font-mono text-xs text-ink/60">/ piece</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs font-mono text-ink/70">
                        <span>Inclusive of all taxes (18% GST input credit eligible)</span>
                        <span>Min Order: {product.minQty} pcs</span>
                      </div>
                    </div>

                      {/* Option Selectors: Shapes, Colours, Fabrics */}
                      <div className="border-2 border-ink bg-white p-5 shadow-stamp space-y-6">
                        <OptionSelectors
                          shapes={shapes}
                          selectedShape={selectedShape}
                          onSelectShape={setSelectedShape}
                          colors={effectiveColors}
                          selectedColor={selectedColor}
                          onSelectColor={setSelectedColor}
                          fabrics={fabrics}
                          selectedFabric={selectedFabric}
                          onSelectFabric={setSelectedFabric}
                          sizes={nonApparelSizes}
                          selectedSize={selectedSize}
                          onSelectSize={setSelectedSize}
                        />

                        {/* Custom Badges Finish Selector */}
                        {isBadge && (
                          <div className="space-y-2 pt-2 border-t border-ink/10">
                            <label className="block font-mono text-xs font-bold text-ink uppercase tracking-wider">
                              Surface Finish
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "gloss", label: "Artisan Gloss" },
                                { id: "matte", label: "Anti-Glare Matte" },
                                { id: "brushed", label: "Metallic Brushed" },
                              ].map((fin) => (
                                <button
                                  key={fin.id}
                                  type="button"
                                  onClick={() => setSelectedFinish(fin.id)}
                                  className={`p-2 font-mono text-xs font-bold border-2 transition-all ${selectedFinish === fin.id
                                      ? "border-ink bg-violet text-white shadow-stamp-sm"
                                      : "border-ink/20 bg-white text-ink hover:border-ink"
                                    }`}
                                >
                                  {fin.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Corporate Gifts Engraving Selector */}
                      {isCorporateGift && (
                        <div className="space-y-2 pt-2 border-t border-ink/10">
                          <label className="block font-mono text-xs font-bold text-ink uppercase tracking-wider">
                            Custom Marking Technique
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: "laser-mirror", label: "Mirror Gold Laser" },
                              { id: "fiber-matte", label: "Fiber Matte Etch" },
                              { id: "blind-deboss", label: "Blind Debossing" },
                            ].map((eng) => (
                              <button
                                key={eng.id}
                                type="button"
                                onClick={() => setSelectedEngraving(eng.id)}
                                className={`p-2 font-mono text-xs font-bold border-2 transition-all ${selectedEngraving === eng.id
                                    ? "border-ink bg-violet text-white shadow-stamp-sm"
                                    : "border-ink/20 bg-white text-ink hover:border-ink"
                                  }`}
                              >
                                {eng.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quantity Price Tier Selector with Stepper */}
                    <div className="border-2 border-ink bg-white p-5 shadow-[4px_4px_0_0_#15101F]">
                      <QuantityPriceTiers
                        tiers={product.priceTiers}
                        quantity={quantity}
                        minQty={product.minQty}
                        qtyStep={product.qtyStep}
                        basePrice={product.basePrice}
                        mrp={product.mrp}
                        onQuantityChange={handleQuantityChange}
                      />
                    </div>

                      {/* Apparel Size-Wise Quantity Picker */}
                      {isApparel && (
                        <ApparelSizePicker
                          targetQuantity={quantity}
                          sizeSplit={sizeSplit}
                          onChange={setSizeSplit}
                        />
                      )}

                        {/* CTAs Block */}
                        <div className="space-y-3 pt-2">
                          {/* Primary Stamp CTA: Customizer */}
                          <button
                            type="button"
                            onClick={handleDesignNow}
                            className="w-full flex items-center justify-center gap-3 border-2 border-ink bg-violet text-white font-mono text-base font-extrabold uppercase tracking-wider py-4 shadow-stamp hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-stamp-hover active:translate-x-[4px] active:translate-y-[4px] active:shadow-stamp-active transition-all"
                          >
                            <Sparkles className="h-5 w-5 text-spot-lime" />
                            <span>Design Your {product.shortName}</span>
                          </button>

                            {/* Secondary Direct Add to Cart, Wishlist & Share */}
              <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handleAddToCart}
                              disabled={isApparel && !sizeSplitMatches}
                              className={`flex-1 flex items-center justify-center gap-2 border-2 border-ink font-mono text-xs font-bold uppercase tracking-wider py-3 shadow-stamp-sm transition-all ${isApparel && !sizeSplitMatches
                                  ? "bg-paper text-ink/40 border-ink/40 cursor-not-allowed shadow-none"
                                  : "bg-white text-ink hover:bg-paper hover:translate-x-[1px] hover:translate-y-[1px]"
                                }`}
                            >
                              <ShoppingCart className="h-4 w-4" />
                              <span>
                                {isApparel && !sizeSplitMatches
                                  ? `Select Sizes (${totalSizeSelected}/${quantity})`
                                  : `Add Plain / Blank Order (${quantity} pcs)`}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleWishlist(product.slug)}
                              aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                            className={`h-11 w-11 shrink-0 rounded-sm border-2 border-ink flex items-center justify-center shadow-stamp-sm hover:bg-paper transition-all ${isFavorited
                                ? "bg-rose-50 text-rose-600 border-rose-600"
                                : "bg-white text-ink"
                              }`}
                >
                            <Heart className={`h-4 w-4 ${isFavorited ? "fill-rose-600" : ""}`} />
                          </button>

                        <button
                          type="button"
                          onClick={handleShare}
                          aria-label="Share product"
                          className="h-11 w-11 shrink-0 rounded-sm border-2 border-ink bg-white text-ink hover:bg-paper flex items-center justify-center shadow-stamp-sm transition-all"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>

                    {/* Size mismatch helper warning */}
                    {isApparel && !sizeSplitMatches && (
                      <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-violet font-semibold pt-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Please allocate all {quantity} pieces across sizes above before ordering</span>
                      </div>
                    )}

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

                  {/* Technical Specifications Accordion Tabs */}
                  <ProductAccordionTabs
                    specs={product.specChips.map((s) => ({ label: "Feature", value: s }))}
                    printMethod={product.printMethod}
                    minQty={product.minQty}
                  />
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
        <section className="border-t-2 border-ink bg-paper py-16 px-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <span className="font-mono text-xs uppercase font-bold text-violet tracking-wider">
                Explore More Blanks
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mt-1">
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

  {/* Sticky Mobile Bar */ }
  <StickyMobileBar
    productName={product.shortName}
    unitPrice={unitPrice}
    productSlug={product.slug}
    selectedColor={selectedColor}
    quantity={quantity}
  />
    </div >
  );
}
