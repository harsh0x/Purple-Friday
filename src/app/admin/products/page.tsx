"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Archive,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ProductData } from "@/server/products/product-service";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [audience, setAudience] = useState("ALL");
  const [includeArchived, setIncludeArchived] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (audience !== "ALL") params.set("audience", audience);
      if (includeArchived) params.set("includeArchived", "true");

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, category, audience, includeArchived]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive or delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Product archived successfully");
        loadProducts();
      } else {
        toast.error(data.error || "Failed to remove product");
      }
    } catch {
      toast.error("Network error while archiving product");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
              Catalogue & Products
            </h1>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-1">
            Source of truth for products, print methods, COGS, and volume pricing slabs
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet text-white text-xs font-mono font-medium rounded-xl hover:bg-violet-hover transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-ink/40" />
          <input
            type="text"
            placeholder="Search by product name, slug, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-paper/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-ink/60">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
          >
            <option value="all">All Categories</option>
            <option value="magnetic-badges">Magnetic Badges</option>
            <option value="t-shirts">T-Shirts</option>
            <option value="polo-shirts">Polo Shirts</option>
            <option value="hoodies">Hoodies</option>
            <option value="caps">Caps</option>
            <option value="corporate-gifts">Corporate Gifts</option>
          </select>

          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono border border-ink/10 rounded-xl focus:outline-none focus:border-violet bg-white"
          >
            <option value="ALL">All Audiences</option>
            <option value="TEAM">Team Only</option>
            <option value="GIFTING">Gifting Only</option>
            <option value="BOTH">Both</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-ink/70 px-2.5 py-1.5 rounded-xl border border-ink/10 hover:bg-paper/50 transition-colors">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded text-violet focus:ring-violet"
            />
            <span>Show Archived</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/10 bg-paper/40 text-[11px] font-mono uppercase tracking-wider text-ink/60">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">MOQ & Step</th>
                <th className="py-3 px-3">Base Price</th>
                <th className="py-3 px-3">COGS (Paise)</th>
                <th className="py-3 px-3">Slabs & Margin</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink/40 font-mono">
                    Loading catalogue...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink/40 font-mono">
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const lowestMargin = Math.min(
                    ...(p.priceTiers || []).map((t) => t.marginPercent)
                  );
                  const highestMargin = Math.max(
                    ...(p.priceTiers || []).map((t) => t.marginPercent)
                  );

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-paper/20 transition-colors ${
                        p.archived ? "opacity-60 bg-paper/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-ink">{p.name}</span>
                          <span className="font-mono text-[11px] text-ink/50">
                            /{p.slug}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-paper border border-ink/10 text-ink/80">
                          {p.categorySlug}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-ink/80">
                        {p.minQty} pcs (step {p.qtyStep})
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-ink">
                        ₹{p.basePrice}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-ink/70">
                        ₹{(p.costPrice / 100).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-ink/5 text-ink/70">
                            {p.priceTiers.length} slabs
                          </span>
                          <span
                            className={`inline-flex items-center gap-0.5 font-bold ${
                              lowestMargin >= 25 ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            <TrendingUp className="w-3 h-3" />
                            {lowestMargin}% - {highestMargin}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {p.archived ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            Archived
                          </span>
                        ) : p.active ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${p.slug}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium bg-paper hover:bg-paper-pure text-ink border border-ink/10 rounded-lg transition-colors"
                          >
                            <span>Edit</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          {!p.archived && (
                            <button
                              type="button"
                              onClick={() => handleArchive(p.id, p.name)}
                              title="Archive product safely"
                              className="p-1 text-ink/40 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
