"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  X,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  active: boolean;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDesc, setFormSeoDesc] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Open modal for add
  const handleAddNew = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormImage("/categories/default.jpg");
    setFormSeoTitle("");
    setFormSeoDesc("");
    setFormActive(true);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDesc(cat.description);
    setFormImage(cat.image || "/categories/default.jpg");
    setFormSeoTitle(cat.seoTitle || "");
    setFormSeoDesc(cat.seoDescription || "");
    setFormActive(cat.active);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: editingCategory?.id,
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDesc.trim(),
        image: formImage.trim() || undefined,
        seoTitle: formSeoTitle.trim() || undefined,
        seoDescription: formSeoDesc.trim() || undefined,
        active: formActive,
      };

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          editingCategory ? "Category updated successfully" : "Category created successfully"
        );
        setIsModalOpen(false);
        loadCategories();
      } else {
        toast.error(data.error || "Failed to save category");
      }
    } catch {
      toast.error("Network error while saving category");
    } finally {
      setSaving(false);
    }
  };

  // Reorder up or down
  const handleReorder = async (slug: string, direction: "up" | "down") => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, direction }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Category moved ${direction}`);
        loadCategories();
      } else {
        toast.error(data.error || "Failed to reorder category");
      }
    } catch {
      toast.error("Network error while reordering");
    }
  };

  // Toggle Active/Hidden
  const handleToggleActive = async (cat: CategoryItem) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cat,
          active: !cat.active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(cat.active ? "Category hidden" : "Category activated");
        loadCategories();
      } else {
        toast.error(data.error || "Failed to toggle status");
      }
    } catch {
      toast.error("Network error while updating status");
    }
  };

  // Delete category
  const handleDelete = async (cat: CategoryItem) => {
    if (cat.productCount > 0) {
      toast.error(
        `Cannot delete "${cat.name}". It contains ${cat.productCount} product(s). Move or delete them first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${cat.slug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Category deleted");
        loadCategories();
      } else {
        toast.error(data.error || "Failed to delete category");
      }
    } catch {
      toast.error("Network error while deleting category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet/10 text-violet">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
              Catalogue Categories
            </h1>
          </div>
          <p className="text-xs font-mono text-ink/60 mt-1">
            Organize products, display order, SEO metadata, and storefront visibility
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet text-white text-xs font-mono font-medium rounded-xl hover:bg-violet-hover transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Table Card */}
      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-ink/40">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-8 h-8 text-ink/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-ink">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-paper/50 text-[11px] font-mono uppercase tracking-wider text-ink/60">
                  <th className="py-3 px-4 w-20 text-center">Order</th>
                  <th className="py-3 px-4 w-16">Image</th>
                  <th className="py-3 px-4">Name & Slug</th>
                  <th className="py-3 px-4 hidden md:table-cell">Description</th>
                  <th className="py-3 px-4 w-24 text-center">Products</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 text-xs">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-paper/30 transition-colors">
                    {/* Sort Order & Reordering */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleReorder(cat.slug, "up")}
                          disabled={idx === 0}
                          title="Move Up"
                          className="p-1 text-ink/40 hover:text-ink disabled:opacity-20 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-ink/80 text-[11px] w-4 text-center">
                          {cat.sortOrder}
                        </span>
                        <button
                          onClick={() => handleReorder(cat.slug, "down")}
                          disabled={idx === categories.length - 1}
                          title="Move Down"
                          className="p-1 text-ink/40 hover:text-ink disabled:opacity-20 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Image Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-lg bg-paper border border-ink/10 overflow-hidden flex items-center justify-center">
                        {cat.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Layers className="w-4 h-4 text-ink/30" />
                        )}
                      </div>
                    </td>

                    {/* Name & Slug */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink text-sm">{cat.name}</div>
                      <div className="font-mono text-[11px] text-ink/50">/{cat.slug}</div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 hidden md:table-cell text-ink/70 max-w-xs truncate">
                      {cat.description || "—"}
                    </td>

                    {/* Products Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-paper border border-ink/10 text-ink/80 font-bold">
                        <Package className="w-3 h-3 text-ink/40" />
                        {cat.productCount}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {cat.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          title={cat.active ? "Hide category" : "Make active"}
                          className="p-1.5 rounded-lg border border-ink/10 text-ink/60 hover:text-ink hover:bg-paper transition-colors"
                        >
                          {cat.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleEdit(cat)}
                          title="Edit category"
                          className="p-1.5 rounded-lg border border-ink/10 text-ink/60 hover:text-violet hover:bg-violet/5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="Delete category"
                          className={`p-1.5 rounded-lg border transition-colors ${
                            cat.productCount > 0
                              ? "border-ink/5 text-ink/20 cursor-not-allowed"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-ink/15 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-ink/10 bg-paper/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet/10 text-violet">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="font-display font-bold text-base text-ink">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-ink/40 hover:text-ink rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-ink/75 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Magnetic Badges"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ink/15 focus:outline-none focus:border-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/75 mb-1">
                  Slug (URL Path)
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated from name if blank"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-ink/15 focus:outline-none focus:border-violet"
                />
                {editingCategory && (
                  <p className="text-[11px] font-mono text-amber-700 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Changing the slug will preserve the old URL with a 301 redirect.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/75 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Short description for storefront collection..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ink/15 focus:outline-none focus:border-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-ink/75 mb-1">
                  Image Path / URL
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="/categories/badges.jpg"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-ink/15 focus:outline-none focus:border-violet"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-ink/10">
                <div>
                  <label className="block text-xs font-mono font-medium text-ink/75 mb-1">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={formSeoTitle}
                    onChange={(e) => setFormSeoTitle(e.target.value)}
                    placeholder="Custom Badges | Purple Friday"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ink/15 focus:outline-none focus:border-violet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-ink/75 mb-1">
                    SEO Meta Description
                  </label>
                  <input
                    type="text"
                    value={formSeoDesc}
                    onChange={(e) => setFormSeoDesc(e.target.value)}
                    placeholder="Meta description for search engines..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ink/15 focus:outline-none focus:border-violet"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-ink/20 text-violet focus:ring-violet"
                />
                <label htmlFor="catActive" className="text-xs font-mono text-ink/80 select-none">
                  Active (visible on storefront)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-ink/15 text-xs font-mono rounded-xl hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-violet text-white text-xs font-mono font-medium rounded-xl hover:bg-violet-hover disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
