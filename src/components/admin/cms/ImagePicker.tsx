"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Upload,
  Search,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { MediaItem } from "@/server/cms/schema";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
  placeholder?: string;
}

export function ImagePicker({
  value,
  onChange,
  label = "Image",
  helpText = "Upload or select an image from the media library",
  placeholder = "/mockups/hoodie-black.png",
}: ImagePickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "url">("library");
  const [manualUrl, setManualUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
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
  };

  useEffect(() => {
    if (modalOpen) {
      fetchMedia();
    }
  }, [modalOpen]);

  useEffect(() => {
    setManualUrl(value);
  }, [value]);

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

      toast.success("Image uploaded to Media Library!");
      onChange(json.item.url);
      setModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectMedia = (url: string) => {
    onChange(url);
    setModalOpen(false);
  };

  const filteredMedia = mediaList.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return m.filename?.toLowerCase().includes(q) || m.alt?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80 block">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Preview Thumbnail */}
        <div className="relative w-20 h-20 rounded-2xl border border-pf-ink/15 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <Image
              src={value}
              alt="Selected media"
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-pf-ink/30 dark:text-white/30" />
          )}

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 p-1 rounded-full bg-pf-ink/80 text-white hover:bg-rose-600 transition-colors z-10"
              title="Remove image"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-1.5 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E1B29] border border-pf-ink/20 dark:border-white/10 text-pf-ink dark:text-white font-mono text-xs font-bold hover:bg-pf-paper-light dark:hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-pf-violet dark:text-[#CDB8FF]" />
              <span>Choose from Library</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-pf-violet/10 dark:bg-pf-violet/20 border border-pf-violet/30 text-pf-violet dark:text-[#CDB8FF] font-mono text-xs font-bold hover:bg-pf-violet/20 transition-colors flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New</span>
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

          <p className="text-[11px] font-sans text-pf-ink/60 dark:text-white/60">
            {value ? (
              <span className="truncate max-w-sm inline-block font-mono text-[10px] text-pf-ink/75 dark:text-white/75">
                {value}
              </span>
            ) : (
              helpText
            )}
          </p>
        </div>
      </div>

      {/* Media Library Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pf-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-7 max-w-3xl w-full border border-pf-ink/15 dark:border-white/10 shadow-2xl space-y-5 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-pf-ink/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pf-violet/10 text-pf-violet flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-pf-ink dark:text-white">
                    Select Media Asset
                  </h3>
                  <p className="text-[11px] font-mono text-pf-ink/60 dark:text-white/60">
                    Universal image picker for banners, tiles, blog posts, and pages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-pf-ink/5 dark:hover:bg-white/5 text-pf-ink/60 dark:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center rounded-xl bg-pf-paper-light dark:bg-white/5 p-1 border border-pf-ink/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("library")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "library"
                      ? "bg-white dark:bg-[#1E1B29] text-pf-ink dark:text-white shadow-xs"
                      : "text-pf-ink/60 dark:text-white/60"
                  }`}
                >
                  Media Library ({mediaList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "url"
                      ? "bg-white dark:bg-[#1E1B29] text-pf-ink dark:text-white shadow-xs"
                      : "text-pf-ink/60 dark:text-white/60"
                  }`}
                >
                  Custom URL
                </button>
              </div>

              {activeTab === "library" && (
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pf-ink/40 dark:text-white/40" />
                  <input
                    type="text"
                    placeholder="Search by filename or alt text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-pf-ink/15 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
                  />
                </div>
              )}
            </div>

            {/* Modal Body */}
            {activeTab === "library" ? (
              <div className="flex-1 overflow-y-auto min-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-48 gap-2 text-pf-ink/60 dark:text-white/60 font-mono text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-pf-violet" />
                    <span>Loading media assets...</span>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 p-6 border-2 border-dashed border-pf-ink/15 dark:border-white/10 rounded-2xl">
                    <ImageIcon className="w-8 h-8 text-pf-ink/30 dark:text-white/30" />
                    <p className="text-xs font-mono text-pf-ink/60 dark:text-white/60">
                      No media found matching your query
                    </p>
                    <label className="px-4 py-2 rounded-xl bg-pf-violet text-white font-mono text-xs font-bold cursor-pointer hover:bg-pf-violet-dark">
                      <span>Upload your first image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pr-1">
                    {filteredMedia.map((item) => {
                      const isSelected = value === item.url;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectMedia(item.url)}
                          className={`group relative rounded-2xl border p-2 cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-pf-violet bg-pf-violet/5 ring-2 ring-pf-violet"
                              : "border-pf-ink/15 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] hover:border-pf-ink/40 dark:hover:border-white/30"
                          }`}
                        >
                          <div className="aspect-square w-full rounded-xl overflow-hidden bg-white dark:bg-black/20 flex items-center justify-center relative mb-2">
                            <Image
                              src={item.url}
                              alt={item.alt || item.filename}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-pf-violet text-white flex items-center justify-center shadow-md z-10">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-mono font-medium truncate text-pf-ink dark:text-white">
                              {item.filename}
                            </p>
                            <p className="text-[10px] font-mono text-pf-ink/50 dark:text-white/50">
                              {(item.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                    Paste Image URL
                  </label>
                  <input
                    type="url"
                    placeholder={placeholder || "https://example.com/image.png or /mockups/hoodie-black.png"}
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualUrl.trim()) return;
                      onChange(manualUrl.trim());
                      setModalOpen(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-pf-violet text-white font-mono text-xs font-bold hover:bg-pf-violet-dark"
                  >
                    Apply Image URL
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-pf-ink/10 dark:border-white/10 flex items-center justify-between">
              <label className="px-4 py-2 rounded-xl bg-pf-paper-light dark:bg-[#1E1B29] border border-pf-ink/20 dark:border-white/10 text-pf-ink dark:text-white font-mono text-xs font-bold hover:bg-pf-ink/5 transition-colors flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? "Uploading..." : "Upload New File"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-pf-ink/20 dark:border-white/10 text-pf-ink/70 dark:text-white/70 font-mono text-xs hover:bg-pf-ink/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
