"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Archive,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { ProductData } from "@/server/products/product-service";
import { formatINR } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [audience, setAudience] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("updatedAt_desc");

      // Selection for bulk actions
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      const [bulkProcessing, setBulkProcessing] = useState(false);

      // Load products
      const loadProducts = useCallback(async () => {
        try {
          setLoading(true);
          const params = new URLSearchParams();
          params.set("page", page.toString());
          params.set("limit", "15");
          if (search) params.set("search", search);
          if (category !== "all") params.set("category", category);
          if (audience !== "ALL") params.set("audience", audience);
          if (status !== "ALL") params.set("status", status);
          if (sort) params.set("sort", sort);
          params.set("includeArchived", "true");

          const res = await fetch(`/api/admin/products?${params.toString()}`);
          const data = await res.json();
          if (data.products) {
            setProducts(data.products);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
          }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, category, audience, status, sort]);

  useEffect(() => {
    loadProducts();
}, [loadProducts]);

  // Handle single item deletion or archive
  const handleArchiveOrDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive or delete "${name}"?`)) return;

    try {
        const res = await fetch(`/api/admin/products?id=${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || "Product updated successfully");
          loadProducts();
        } else {
          toast.error(data.error || "Failed to remove product");
        }
      } catch {
        toast.error("Network error while removing product");
      }
    };

    // Handle product duplication
    const handleDuplicate = async (id: string, name: string) => {
      try {
        toast.loading(`Duplicating "${name}"...`, { id: "dup-toast" });
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "duplicate", id }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Created draft copy: "${data.product.name}"`, { id: "dup-toast" });
          loadProducts();
        } else {
          toast.error(data.error || "Failed to duplicate product", { id: "dup-toast" });
        }
      } catch {
        toast.error("Network error while duplicating product", { id: "dup-toast" });
      }
    };

    // Selection Helpers
    const toggleSelectAll = () => {
      if (selectedIds.length === products.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(products.map((p) => p.id));
      }
};

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
          setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Status Update (Active or Archived)
  const handleBulkStatus = async (newStatus: "ACTIVE" | "ARCHIVED") => {
    if (selectedIds.length === 0) return;
        try {
          setBulkProcessing(true);
        const res = await fetch("/api/admin/products", {
          method: "POST",
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_status",
        ids: selectedIds,
        status: newStatus,
        }),
      });
        const data = await res.json();
        if (data.success) {
          toast.success(`Updated ${data.updatedCount} products to ${newStatus}`);
        setSelectedIds([]);
        loadProducts();
      } else {
          toast.error(data.error || "Failed bulk update");
      }
    } catch {
          toast.error("Network error during bulk update");
    } finally {
          setBulkProcessing(false);
    }
  };

        return (
        <div className="space-y-6">
          {/* Top Header */}
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
                Single authoritative source of truth for products, pricing slabs, colours, and images
              </p>
            </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-ink/15 text-ink/80 text-xs font-mono rounded-xl hover:bg-paper transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Categories
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet text-white text-xs font-mono font-medium rounded-xl hover:bg-violet-hover transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </Link>
          </div>
        </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-ink/10 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search by name, slug, or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-paper/50 border border-ink/10 rounded-xl text-xs font-mono text-ink placeholder:text-ink/40 focus:outline-none focus:border-violet focus:bg-white transition-all"
              />
            </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-paper/50 border border-ink/10 rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-violet"
                >
                  <option value="all">All Categories</option>
                  <option value="magnetic-badges">Magnetic Badges</option>
                  <option value="t-shirts">T-Shirts</option>
                  <option value="polo-shirts">Polo Shirts</option>
                  <option value="hoodies">Hoodies</option>
                  <option value="caps">Caps</option>
                  <option value="corporate-gifts">Corporate Gifts</option>
                </select>

                {/* Status Filter */}
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-paper/50 border border-ink/10 rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-violet"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

            {/* Audience Filter */}
            <select
              value={audience}
              onChange={(e) => {
                setAudience(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-paper/50 border border-ink/10 rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-violet"
            >
              <option value="ALL">All Audiences</option>
              <option value="TEAM">Team / Internal</option>
              <option value="GIFTING">Corporate Gifting</option>
              <option value="BOTH">Universal (Both)</option>
            </select>

                        {/* Sort Filter */ }
                        <select
                          value={sort}
                          onChange={(e) => {
                            setSort(e.target.value);
                            setPage(1);
                          }}
                          className="px-3 py-2 bg-paper/50 border border-ink/10 rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-violet"
                        >
                          <option value="updatedAt_desc">Newest First</option>
                          <option value="name_asc">Name (A-Z)</option>
                          <option value="name_desc">Name (Z-A)</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                          <option value="stock_asc">Stock: Low to High</option>
                        </select>
        </div>
              </div>

              {/* Bulk Actions Banner (appears when items selected) */}
              {selectedIds.length > 0 && (
                <div className="bg-violet/10 border border-violet/20 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-violet font-medium">
                    <span>{selectedIds.length} product(s) selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkStatus("ACTIVE")}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      Bulk Activate
                    </button>
                    <button
                      onClick={() => handleBulkStatus("ARCHIVED")}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      Bulk Archive
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="px-2 py-1 text-ink/60 hover:text-ink transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {/* Product List Table */}
              <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-xs font-mono text-ink/40">
                    Loading products...
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-8 h-8 text-ink/30 mx-auto mb-2" />
                    <p className="text-sm font-medium text-ink">No products found</p>
                    <p className="text-xs font-mono text-ink/50 mt-1">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-ink/10 bg-paper/50 text-[11px] font-mono uppercase tracking-wider text-ink/60">
                          <th className="py-3 px-4 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.length === products.length && products.length > 0}
                              onChange={toggleSelectAll}
                              className="rounded border-ink/20 text-violet focus:ring-violet"
                            />
                          </th>
                          <th className="py-3 px-4 w-14">Image</th>
                          <th className="py-3 px-4">Product Name & Slug</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Price From</th>
                          <th className="py-3 px-4 text-center">Stock</th>
                          <th className="py-3 px-4 text-right hidden lg:table-cell">Updated</th>
                          <th className="py-3 px-4 w-44 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/5 text-xs">
                        {products.map((p) => {
                          const lowestPrice =
                            p.priceTiers && p.priceTiers.length > 0
                              ? Math.min(...p.priceTiers.map((t) => t.unitPrice))
                              : p.basePrice;

                          const isSelected = selectedIds.includes(p.id);

                          return (
                            <tr
                              key={p.id}
                      className={`hover:bg-paper/30 transition-colors ${isSelected ? "bg-violet/5" : ""
                                }`}
                            >
                                  {/* Checkbox */}
                                  <td className="py-3 px-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelectOne(p.id)}
                                      className="rounded border-ink/20 text-violet focus:ring-violet"
                                    />
                                  </td>

                                  {/* Image Thumbnail */}
                                  <td className="py-3 px-4">
                                    <div className="w-10 h-10 rounded-lg bg-paper border border-ink/10 overflow-hidden flex items-center justify-center">
                                      {p.images && p.images[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={p.images[0].url}
                                          alt={p.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = "none";
                                          }}
                                        />
                                      ) : (
                                        <Package className="w-4 h-4 text-ink/30" />
                                      )}
                                    </div>
                                  </td>

                                    {/* Name & Slug */}
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-1.5">
                                        <Link
                                          href={`/admin/products/${p.slug}`}
                                          className="font-medium text-ink hover:text-violet transition-colors text-sm"
                                        >
                                          {p.name}
                                        </Link>
                                        {p.isBestSeller && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                                            Best Seller
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-mono text-[11px] text-ink/50">/{p.slug}</div>
                                    </td>

                                      {/* Category */}
                                      <td className="py-3 px-4">
                                        <span className="font-mono text-[11px] text-ink/80 capitalize bg-paper px-2 py-0.5 rounded border border-ink/10">
                                          {p.categorySlug.replace(/-/g, " ")}
                                        </span>
                                      </td>

                                            {/* Status Badge */}
                                            <td className="py-3 px-4 text-center">
                                              {p.status === "ACTIVE" && !p.archived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : p.status === "DRAFT" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Draft
                          </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                                  <Archive className="w-3 h-3" />
                                                  Archived
                                                </span>
                                              )}
                                            </td>

                                                  {/* Price From */}
                                                  <td className="py-3 px-4 text-right font-mono font-medium text-ink">
                                                    {formatINR(lowestPrice)}
                                                  </td>

                                                  {/* Stock */}
                                                  <td className="py-3 px-4 text-center">
                                                    {p.stock === null ? (
                                                      <span className="text-[11px] font-mono text-ink/60 bg-paper px-2 py-0.5 rounded border border-ink/10">
                                                        Unlimited
                                                      </span>
                        ) : p.stock === 0 ? (
                          <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">
                            Out of stock
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-ink font-bold">
                            {p.stock}
                          </span>
                        )}
                      </td>

                      {/* Updated Date */}
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-ink/50 hidden lg:table-cell">
                        {new Date(p.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                                    {/* Row Actions */}
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <Link
                                          href={`/admin/products/${p.slug}`}
                                          title="Edit Product"
                                          className="p-1.5 rounded-lg border border-ink/10 text-ink/70 hover:text-violet hover:bg-violet/5 transition-colors"
                                        >
                                          Edit
                                        </Link>
                                        <button
                                          onClick={() => handleDuplicate(p.id, p.name)}
                                          title="Duplicate Product"
                                          className="p-1.5 rounded-lg border border-ink/10 text-ink/70 hover:text-ink hover:bg-paper transition-colors"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <Link
                                          href={`/product/${p.slug}`}
                                          target="_blank"
                                          title="View on Store"
                                          className="p-1.5 rounded-lg border border-ink/10 text-ink/70 hover:text-ink hover:bg-paper transition-colors"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                        <button
                                          onClick={() => handleArchiveOrDelete(p.id, p.name)}
                                          title={p.archived ? "Restore / Delete" : "Archive Product"}
                                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                          {p.archived ? <Trash2 className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  );
                })}
                                </tbody>
                              </table>
                            </div>
                          )
                        }

        {/* Server Pagination Controls */ }
                          < div className = "p-4 border-t border-ink/10 bg-paper/30 flex items-center justify-between text-xs font-mono text-ink/60" >
          <div>
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink/15 bg-white text-ink disabled:opacity-30 hover:bg-paper transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="font-bold text-ink">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink/15 bg-white text-ink disabled:opacity-30 hover:bg-paper transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
                  </div>
    </div>
              );
}
