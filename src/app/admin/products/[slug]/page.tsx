"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  VolumePricingMatrixEditor,
  SlabItem,
} from "@/components/admin/VolumePricingMatrixEditor";
import { ProductData } from "@/server/products/product-service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AdminProductEditPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);
  const isNew = slug === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [originalProduct, setOriginalProduct] = useState<ProductData | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("t-shirts");
  const [audience, setAudience] = useState<"TEAM" | "GIFTING" | "BOTH">("BOTH");
  const [minQty, setMinQty] = useState(5);
  const [qtyStep, setQtyStep] = useState(1);
  const [gstRate, setGstRate] = useState(0.18);
  const [active, setActive] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [costPricePaise, setCostPricePaise] = useState(15000); // ₹150 in paise
  const [basePrice, setBasePrice] = useState(285);
  const [mrp, setMrp] = useState(499);
  const [printMethod, setPrintMethod] = useState("DTF High-Density");
  const [version, setVersion] = useState(1);

  // Slabs
  const [slabs, setSlabs] = useState<SlabItem[]>([
    { minQty: 5, maxQty: 14, unitPrice: 285 },
    { minQty: 15, maxQty: 49, unitPrice: 240 },
    { minQty: 50, maxQty: 99, unitPrice: 195 },
    { minQty: 100, maxQty: null, unitPrice: 165 },
  ]);
  const [isSlabsValid, setIsSlabsValid] = useState(true);

  // Badges & Chips
  const [badgesText, setBadgesText] = useState("Best Seller, Premium Cotton");
  const [specChipsText, setSpecChipsText] = useState("180 GSM, Bio-Washed, Pre-Shrunk");

  // Load existing product
  useEffect(() => {
    if (isNew) return;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/products/${slug}`);
        const data = await res.json();
        if (data.product) {
          const p: ProductData = data.product;
          setOriginalProduct(p);
          setName(p.name);
          setCustomSlug(p.slug);
          setOriginalSlug(p.slug);
          setDescription(p.description);
          setCategorySlug(p.categorySlug);
          setAudience(p.audience);
          setMinQty(p.minQty);
          setQtyStep(p.qtyStep);
          setGstRate(p.gstRate);
          setActive(p.active);
          setIsBestSeller(p.isBestSeller);
          setSeoTitle(p.seoTitle || "");
          setSeoDescription(p.seoDescription || "");
          setCostPricePaise(p.costPrice || 0);
          setBasePrice(p.basePrice);
          setMrp(p.mrp);
          setPrintMethod(p.printMethod);
          setVersion(p.version);
          setBadgesText((p.badges || []).join(", "));
          setSpecChipsText((p.specChips || []).join(", "));
          setSlabs(
            (p.priceTiers || []).map((t) => ({
              minQty: t.minQty,
              maxQty: t.maxQty,
              unitPrice: t.unitPrice,
            }))
          );
        } else {
          toast.error("Product not found");
        }
      } catch {
        toast.error("Failed to fetch product");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug, isNew]);

  // Update first slab when MOQ changes
  const handleMinQtyChange = (val: number) => {
    const q = Math.max(1, val);
    setMinQty(q);
    setSlabs((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[0] = { ...updated[0], minQty: q };
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Please enter a product name.");
      return;
    }
    if (!isSlabsValid) {
      toast.error("Please resolve volume pricing matrix errors before saving.");
      return;
    }

    setSaving(true);
    try {
      const badges = badgesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const specChips = specChipsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        id: originalProduct?.id,
        slug: customSlug || undefined,
        name,
        categorySlug,
        description,
        audience,
        badges,
        specChips,
        minQty,
        qtyStep,
        gstRate,
        active,
        isBestSeller,
        seoTitle,
        seoDescription,
        costPrice: costPricePaise,
        basePrice,
        mrp,
        printMethod,
        priceTiers: slabs,
        expectedVersion: isNew ? undefined : version,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          isNew ? "Product created successfully!" : "Product updated with optimistic version check!"
        );
        router.push("/admin/products");
      } else {
        toast.error(data.error || "Failed to save product.");
      }
    } catch {
      toast.error("Network error saving product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-xs text-ink/40">
        Loading product details...
      </div>
    );
  }

  const isSlugChanged = !isNew && customSlug !== originalSlug && customSlug.trim() !== "";

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-ink/10 text-ink/70 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
              {isNew ? "Create New Product" : `Edit: ${name || originalProduct?.name}`}
            </h1>
            <p className="text-xs font-mono text-ink/60 mt-0.5">
              {!isNew && `Version: ${version} • Authoritative Source of Truth`}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !isSlabsValid}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet text-white text-xs font-mono font-medium rounded-xl hover:bg-violet-hover disabled:opacity-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Product & Matrix"}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Product Info (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Basic Details */}
          <div className="p-5 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink border-b border-ink/10 pb-2">
              General Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Classic Kangaroo Pocket Pullover Hoodie"
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                    Slug (Auto-generated or custom)
                  </label>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="e.g. classic-kangaroo-hoodie"
                    className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                  {isSlugChanged && (
                    <p className="text-[11px] font-mono text-amber-700 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Changing slug creates an automatic 301 redirect from /{originalSlug}.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                    Category *
                  </label>
                  <select
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
                  >
                    <option value="magnetic-badges">Magnetic Badges</option>
                    <option value="t-shirts">T-Shirts</option>
                    <option value="polo-shirts">Polo Shirts</option>
                    <option value="hoodies">Hoodies</option>
                    <option value="caps">Caps</option>
                    <option value="corporate-gifts">Corporate Gifts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product specifications, fabric weights, GSM, printing techniques..."
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as "TEAM" | "GIFTING" | "BOTH")}
                    className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
                  >
                    <option value="BOTH">Both (Team & Gifting)</option>
                    <option value="TEAM">Team Merch & Uniforms</option>
                    <option value="GIFTING">Client Gifting & Swag</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                    Default Print Method
                  </label>
                  <input
                    type="text"
                    value={printMethod}
                    onChange={(e) => setPrintMethod(e.target.value)}
                    placeholder="e.g. DTF, Sublimation, Screen Print"
                    className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Volume Pricing Matrix Editor */}
          <div className="p-5 bg-white rounded-2xl border border-ink/10 shadow-sm">
            <VolumePricingMatrixEditor
              slabs={slabs}
              costPricePaise={costPricePaise}
              moq={minQty}
              onChange={(updated, valid) => {
                setSlabs(updated);
                setIsSlabsValid(valid);
              }}
            />
          </div>

          {/* Card: Badges and Spec Chips */}
          <div className="p-5 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink border-b border-ink/10 pb-2">
              Badges & Spec Chips
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  Badges (comma-separated)
                </label>
                <input
                  type="text"
                  value={badgesText}
                  onChange={(e) => setBadgesText(e.target.value)}
                  placeholder="Best Seller, Zero Pinholes"
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  Spec Chips (comma-separated)
                </label>
                <input
                  type="text"
                  value={specChipsText}
                  onChange={(e) => setSpecChipsText(e.target.value)}
                  placeholder="58mm Diameter, Neodymium Back"
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Parameters & Settings */}
        <div className="space-y-6">
          {/* Card: MOQ & Ordering Rules */}
          <div className="p-5 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink border-b border-ink/10 pb-2">
              Order Quantities & Steps
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  Minimum Order Quantity (MOQ) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={minQty}
                  onChange={(e) => handleMinQtyChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
                <p className="text-[10px] font-mono text-ink/50 mt-1">
                  e.g. 2 for hoodies, 5 for badges, 100 for keychains
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  Quantity Step *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={qtyStep}
                  onChange={(e) => setQtyStep(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  GST Rate
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
                >
                  <option value={0.18}>18% (Standard Apparel & Custom Merchandise)</option>
                  <option value={0.12}>12% (Concessional Goods)</option>
                  <option value={0.05}>5% (Special Items)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Cost of Goods Sold (COGS) */}
          <div className="p-5 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink border-b border-ink/10 pb-2">
              Cost of Goods Sold (COGS)
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  Total Cost (Blank + Print per pc)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-ink/40">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={(costPricePaise / 100).toFixed(2)}
                    onChange={(e) => setCostPricePaise(Math.round(parseFloat(e.target.value || "0") * 100))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                  />
                </div>
                <p className="text-[10px] font-mono text-ink/50 mt-1">
                  Stored strictly as {costPricePaise} integer paise
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-ink/60 mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={mrp}
                    onChange={(e) => setMrp(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-ink/10 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-ink/60 mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-ink/10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Visibility & Badging */}
          <div className="p-5 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink border-b border-ink/10 pb-2">
              Storefront Flags
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-ink/10 hover:bg-paper/30 cursor-pointer">
                <div>
                  <span className="font-mono text-xs font-bold text-ink">Active on Storefront</span>
                  <p className="text-[10px] text-ink/50">Show product in public catalogue</p>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-violet focus:ring-violet h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-ink/10 hover:bg-paper/30 cursor-pointer">
                <div>
                  <span className="font-mono text-xs font-bold text-ink">Best Seller Badge</span>
                  <p className="text-[10px] text-ink/50">Feature product on homepage hero</p>
                </div>
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="rounded text-violet focus:ring-violet h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Card: SEO Metadata */}
          <div className="p-5 bg-white rounded-2xl border border-ink/10 shadow-sm space-y-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink border-b border-ink/10 pb-2">
              Search Engine Optimization (SEO)
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Custom Merchandise Title | Purple Friday"
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/70 mb-1">
                  SEO Meta Description
                </label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Order custom corporate merchandise..."
                  className="w-full px-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
