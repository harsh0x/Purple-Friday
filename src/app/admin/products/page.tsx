"use client";

import React, { useState, useEffect } from "react";
import {
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { AdminProduct } from "@/lib/admin/admin-store";
import { validatePriceTiers } from "@/lib/admin/tier-validator";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Edit draft state
  const [draftProduct, setDraftProduct] = useState<AdminProduct | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch {
      toast.error("Failed to load product catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleStartEdit = (product: AdminProduct) => {
    setEditingSlug(product.slug);
    setDraftProduct(JSON.parse(JSON.stringify(product)));
    setValidationErrors([]);
  };

  const handleCancelEdit = () => {
    setEditingSlug(null);
    setDraftProduct(null);
    setValidationErrors([]);
  };

  const handleTierChange = (
    index: number,
    field: "minQty" | "maxQty" | "unitPrice",
    val: string
  ) => {
    if (!draftProduct) return;
    const newTiers = [...draftProduct.priceTiers];
    const num = val === "" && field === "maxQty" ? null : Number(val);

    newTiers[index] = {
      ...newTiers[index],
      [field]: num,
    };

    setDraftProduct({
      ...draftProduct,
      priceTiers: newTiers,
    });

    // Run live validation
    const result = validatePriceTiers(newTiers);
    setValidationErrors(result.errors);
  };

  const handleAddTier = () => {
    if (!draftProduct) return;
    const lastTier = draftProduct.priceTiers[draftProduct.priceTiers.length - 1];
    let newMin = 100;
    let newPrice = 100;

    if (lastTier) {
      newMin = (lastTier.maxQty || lastTier.minQty) + 1;
      newPrice = Math.max(10, lastTier.unitPrice - 20);
      // Close previous tier if it was open-ended
      lastTier.maxQty = newMin - 1;
    }

    const updatedTiers = [
      ...draftProduct.priceTiers,
      { minQty: newMin, maxQty: null, unitPrice: newPrice },
    ];

    setDraftProduct({
      ...draftProduct,
      priceTiers: updatedTiers,
    });

    const result = validatePriceTiers(updatedTiers);
    setValidationErrors(result.errors);
  };

  const handleRemoveTier = (index: number) => {
    if (!draftProduct || draftProduct.priceTiers.length <= 1) {
      toast.error("At least one price tier is required.");
      return;
    }

    const updatedTiers = draftProduct.priceTiers.filter((_, i) => i !== index);
    // Make sure the last tier is open-ended
    if (updatedTiers.length > 0) {
      updatedTiers[updatedTiers.length - 1].maxQty = null;
    }

    setDraftProduct({
      ...draftProduct,
      priceTiers: updatedTiers,
    });

    const result = validatePriceTiers(updatedTiers);
    setValidationErrors(result.errors);
  };

  const handleSaveProduct = async () => {
    if (!draftProduct) return;

    const validation = validatePriceTiers(draftProduct.priceTiers);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast.error("Cannot save: please fix price tier validation errors.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftProduct),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Product ${draftProduct.shortName} updated successfully!`);
        setProducts((prev) =>
          prev.map((p) => (p.slug === draftProduct.slug ? data.product : p))
        );
        handleCancelEdit();
      } else {
        toast.error(data.error || "Failed to update product");
      }
    } catch {
      toast.error("Network error saving product");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: AdminProduct) => {
    const updatedActive = !product.active;
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: product.slug, active: updatedActive }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `${product.shortName} is now ${updatedActive ? "Active" : "Archived"}`
        );
        setProducts((prev) =>
          prev.map((p) => (p.slug === product.slug ? { ...p, active: updatedActive } : p))
        );
      }
    } catch {
      toast.error("Error toggling product status");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="pb-6 border-b border-white/10">
        <h1 className="font-display font-black text-3xl text-white tracking-tight">
          Products & Volume Price Tiers
        </h1>
        <p className="text-xs font-mono text-white/50 mt-1">
          Adjust MOQ, base rates, and tiered volume discounts with live contiguity validation
        </p>
      </div>

      {/* Product List */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-10 text-center font-mono text-xs text-white/50">
            Loading products...
          </div>
        ) : (
          products.map((p) => {
            const isEditing = editingSlug === p.slug;
            const current = isEditing && draftProduct ? draftProduct : p;

            return (
              <div
                key={p.slug}
                className={`bg-[#181324] rounded-2xl border transition-colors ${
                  isEditing ? "border-pf-violet shadow-lg shadow-pf-violet/10" : "border-white/10"
                } p-6 space-y-6`}
              >
                {/* Product Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display font-bold text-lg text-white">
                        {current.name}
                      </h3>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-colors ${
                          current.active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {current.active ? "Active" : "Inactive"}
                      </button>
                    </div>
                    <div className="text-xs font-mono text-white/40">
                      Slug: <span className="text-white/70">{current.slug}</span> • Category:{" "}
                      <span className="text-white/70">{current.categorySlug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white flex items-center gap-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={handleSaveProduct}
                          disabled={saving || validationErrors.length > 0}
                          className="px-4 py-1.5 rounded-xl bg-pf-violet hover:bg-pf-violet/90 text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{saving ? "Saving..." : "Save Tiers"}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-pf-violet" />
                        <span>Edit Product & Tiers</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Base Product Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#110D1A] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-white/40">
                      Struck MRP (₹)
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={current.mrp}
                        onChange={(e) =>
                          setDraftProduct(
                            draftProduct ? { ...draftProduct, mrp: Number(e.target.value) } : null
                          )
                        }
                        className="w-full bg-transparent border-b border-white/30 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                      />
                    ) : (
                      <div className="text-sm font-mono font-bold text-white">₹{current.mrp}</div>
                    )}
                  </div>

                  <div className="bg-[#110D1A] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-white/40">
                      Base Single Piece (₹)
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={current.basePrice}
                        onChange={(e) =>
                          setDraftProduct(
                            draftProduct
                              ? { ...draftProduct, basePrice: Number(e.target.value) }
                              : null
                          )
                        }
                        className="w-full bg-transparent border-b border-white/30 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                      />
                    ) : (
                      <div className="text-sm font-mono font-bold text-white">
                        ₹{current.basePrice}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#110D1A] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-white/40">
                      Minimum Order (MOQ)
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={current.minQty}
                        onChange={(e) =>
                          setDraftProduct(
                            draftProduct
                              ? { ...draftProduct, minQty: Number(e.target.value) }
                              : null
                          )
                        }
                        className="w-full bg-transparent border-b border-white/30 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                      />
                    ) : (
                      <div className="text-sm font-mono font-bold text-white">
                        {current.minQty} pcs
                      </div>
                    )}
                  </div>

                  <div className="bg-[#110D1A] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-white/40">
                      Step Increment
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={current.qtyStep}
                        onChange={(e) =>
                          setDraftProduct(
                            draftProduct
                              ? { ...draftProduct, qtyStep: Number(e.target.value) }
                              : null
                          )
                        }
                        className="w-full bg-transparent border-b border-white/30 text-xs font-mono text-white focus:outline-none focus:border-pf-violet"
                      />
                    ) : (
                      <div className="text-sm font-mono font-bold text-white">
                        +{current.qtyStep}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Tiers Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-pf-violet" />
                      <span className="text-xs font-mono uppercase font-bold text-white/70">
                        Volume Pricing Tiers
                      </span>
                    </div>

                    {isEditing && (
                      <button
                        onClick={handleAddTier}
                        className="px-2.5 py-1 rounded-lg bg-pf-violet/20 hover:bg-pf-violet text-pf-violet hover:text-white border border-pf-violet/40 text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Tier</span>
                      </button>
                    )}
                  </div>

                  {/* Validation Alerts */}
                  {isEditing && validationErrors.length > 0 && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1 text-xs font-mono text-rose-300">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Price Tier Structure Invalid:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {validationErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tiers Grid / Rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {current.priceTiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="bg-[#110D1A] p-3.5 rounded-xl border border-white/10 space-y-2 relative"
                      >
                        {isEditing && current.priceTiers.length > 1 && (
                          <button
                            onClick={() => handleRemoveTier(idx)}
                            className="absolute top-2 right-2 text-white/30 hover:text-rose-400 p-1"
                            title="Remove tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="text-[10px] font-mono uppercase text-pf-lime">
                          Tier #{idx + 1}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-1.5 text-xs font-mono text-white/70">
                              <input
                                type="number"
                                value={tier.minQty}
                                onChange={(e) => handleTierChange(idx, "minQty", e.target.value)}
                                className="w-14 bg-white/5 border border-white/20 rounded px-1.5 py-0.5 text-white"
                              />
                              <span>to</span>
                              <input
                                type="number"
                                placeholder="∞"
                                value={tier.maxQty === null ? "" : tier.maxQty}
                                onChange={(e) => handleTierChange(idx, "maxQty", e.target.value)}
                                className="w-14 bg-white/5 border border-white/20 rounded px-1.5 py-0.5 text-white"
                              />
                              <span>pcs</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs font-mono text-white">
                              <span>₹</span>
                              <input
                                type="number"
                                value={tier.unitPrice}
                                onChange={(e) => handleTierChange(idx, "unitPrice", e.target.value)}
                                className="w-20 bg-white/5 border border-white/20 rounded px-1.5 py-0.5 text-white font-bold"
                              />
                              <span className="text-[10px] text-white/40">/ pc</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-mono text-white/70">
                              {tier.maxQty
                                ? `${tier.minQty} – ${tier.maxQty} pcs`
                                : `${tier.minQty}+ pcs (Bulk)`}
                            </div>
                            <div className="text-base font-mono font-bold text-white mt-1">
                              ₹{tier.unitPrice}
                              <span className="text-[10px] text-white/40 font-normal"> / pc</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
