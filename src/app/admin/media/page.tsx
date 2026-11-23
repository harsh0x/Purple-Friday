"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  Upload,
  Search,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";
import { MediaItem } from "@/server/cms/schema";

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [altInput, setAltInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const json = await res.json();
        setMediaList(json.media || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt", file.name);

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      toast.success("Image uploaded successfully!");
      fetchMedia();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard!", { description: url });
  };

  const handleSaveAltText = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingItem.id, alt: altInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");

      toast.success("Alt text updated!");
      setEditingItem(null);
      fetchMedia();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media item? It will be checked to confirm it is not in use.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Cannot delete media asset");
      }

      toast.success("Media asset deleted.");
      fetchMedia();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete media");
    }
  };

  const filtered = mediaList.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return m.filename?.toLowerCase().includes(q) || m.alt?.toLowerCase().includes(q);
  });

  return (
    <PageTransition>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pf-ink/10 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pf-violet/10 dark:bg-pf-violet/20 text-pf-violet dark:text-[#CDB8FF]">
                ASSETS
              </span>
              <span className="text-xs font-mono text-pf-ink/60 dark:text-white/60">
                Secure Upload Pipeline & Reference Registry
              </span>
            </div>
            <h1 className="font-display font-black text-2xl text-pf-ink dark:text-white mt-1">
              Media Asset Library
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <label className="px-4 py-2.5 rounded-2xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet-dark transition-all flex items-center gap-2 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{uploading ? "Uploading..." : "Upload Asset"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#181524] p-4 rounded-2xl border border-pf-ink/10 dark:border-white/10 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search assets by filename or alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-pf-ink/15 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
            />
          </div>

          <div className="text-xs font-mono text-pf-ink/60 dark:text-white/60 flex items-center gap-2">
            <span>Total assets: {mediaList.length}</span>
            <span>•</span>
            <span>Filtered: {filtered.length}</span>
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 font-mono text-xs text-pf-ink/60 dark:text-white/60">
            <Loader2 className="w-4 h-4 animate-spin text-pf-violet" />
            <span>Loading asset registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#181524] rounded-3xl p-12 border border-pf-ink/10 dark:border-white/10 text-center space-y-3">
            <FileImage className="w-10 h-10 mx-auto text-pf-ink/30 dark:text-white/30" />
            <h3 className="font-display font-bold text-base text-pf-ink dark:text-white">
              No media files found
            </h3>
            <p className="text-xs font-mono text-pf-ink/60 dark:text-white/60 max-w-sm mx-auto">
              Upload PNG, JPG, WebP, or SVG graphics to reference across your banners, department tiles, and blog posts.
            </p>
            <label className="inline-flex px-4 py-2 rounded-xl bg-pf-violet text-white font-mono text-xs font-bold cursor-pointer hover:bg-pf-violet-dark">
              <span>Upload image now</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#181524] rounded-2xl border border-pf-ink/10 dark:border-white/10 p-3.5 space-y-3 shadow-xs hover:border-pf-violet/50 transition-all flex flex-col justify-between group"
              >
                <div className="aspect-square w-full rounded-xl bg-pf-paper-light dark:bg-[#110E1B] overflow-hidden flex items-center justify-center relative">
                  <Image
                    src={item.url}
                    alt={item.alt || item.filename}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.url)}
                      className="p-1.5 rounded-lg bg-pf-ink/80 text-white hover:bg-pf-violet shadow-sm"
                      title="Copy URL"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-pf-ink/80 text-white hover:bg-pf-violet shadow-sm"
                      title="Open full size"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-mono text-xs font-bold text-pf-ink dark:text-white truncate">
                    {item.filename}
                  </h4>
                  <p className="text-[11px] font-sans text-pf-ink/60 dark:text-white/60 truncate">
                    Alt: {item.alt || "(none set)"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-pf-ink/50 dark:text-white/50 pt-1">
                    <span>{(item.size / 1024).toFixed(0)} KB</span>
                    <span>{item.mimeType.split("/")[1]?.toUpperCase() || "IMG"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-pf-ink/10 dark:border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setAltInput(item.alt || "");
                    }}
                    className="p-1.5 rounded-lg text-pf-ink/70 dark:text-white/70 hover:bg-pf-ink/5 flex items-center gap-1 text-[11px] font-mono font-medium"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Alt Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(item.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Asset (Safe check)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Alt Text Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pf-ink/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-pf-ink/15 dark:border-white/10 shadow-2xl space-y-4">
              <h3 className="font-display font-bold text-base text-pf-ink dark:text-white">
                Edit Alt Text
              </h3>
              <p className="text-xs font-sans text-pf-ink/70 dark:text-white/70">
                Alt text describes the image for screen readers and SEO indexing.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                  Image Alt Text
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  placeholder="e.g. 380 GSM black fleece hoodie with embroidered chest badge"
                  className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-pf-ink/20 dark:border-white/10 text-pf-ink/70 dark:text-white/70 font-mono text-xs hover:bg-pf-ink/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAltText}
                  className="px-5 py-2 rounded-xl bg-pf-violet text-white font-mono text-xs font-bold hover:bg-pf-violet-dark"
                >
                  Save Alt Text
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
