"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  StorefrontCmsDocument,
  DEFAULT_CMS_DOCUMENT,
  CorePage,
  CustomPage,
} from "@/server/cms/schema";
import { PublishBar, CmsVersionItem } from "@/components/admin/cms/PublishBar";
import { MarkdownEditor } from "@/components/admin/cms/MarkdownEditor";
import { SeoPreviewCard } from "@/components/admin/cms/SeoPreviewCard";

export default function AdminPagesPage() {
  const [document, setDocument] = useState<StorefrontCmsDocument>(DEFAULT_CMS_DOCUMENT);
  const [versions, setVersions] = useState<CmsVersionItem[]>([]);
  const [previewToken, setPreviewToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Active editing page
  const [editingPage, setEditingPage] = useState<{
    type: "core" | "custom";
    page: CorePage | CustomPage;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms");
      if (res.ok) {
        const json = await res.json();
        setDocument(json.draft || json.published || DEFAULT_CMS_DOCUMENT);
        setVersions(json.versions || []);
        setPreviewToken(json.previewToken || "");
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_draft", content: document }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save draft");
      toast.success("Pages saved to draft safely. Storefront remains unchanged until published.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (note?: string) => {
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", content: document, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish");
      toast.success(`Version #${json.version} published! Storefront pages live and cache revalidated.`);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", versionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to restore version");
      toast.success(`Successfully restored Version #${json.version}!`);
      fetchData();
      setEditingPage(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to restore version");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomPage = () => {
    const newPage: CustomPage = {
      id: `page-${Date.now()}`,
      slug: `new-page-${Date.now().toString().slice(-4)}`,
      title: "New Custom Page",
      contentMarkdown: `# New Custom Page\n\nStart writing safe markdown content here for your customers.`,
      seoTitle: "New Custom Page | Purple Friday",
      seoDescription: "Custom page information and details from Purple Friday.",
      published: true,
      showInFooter: false,
      updatedAt: new Date().toISOString(),
    };

    const updated = [...(document.customPages || []), newPage];
    setDocument({ ...document, customPages: updated });
    setEditingPage({ type: "custom", page: newPage });
  };

  const handleDeleteCustomPage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom page?")) return;
    const updated = (document.customPages || []).filter((p) => p.id !== id);
    setDocument({ ...document, customPages: updated });
    if (editingPage?.page.id === id) {
      setEditingPage(null);
    }
    toast.success("Custom page removed from draft.");
  };

  const handleUpdateCurrentPage = (updatedPage: CorePage | CustomPage) => {
    if (!editingPage) return;

    if (editingPage.type === "core") {
      const updatedCore = (document.corePages || []).map((p) =>
        p.id === updatedPage.id ? (updatedPage as CorePage) : p
      );
      setDocument({ ...document, corePages: updatedCore });
      setEditingPage({ type: "core", page: updatedPage as CorePage });
    } else {
      const updatedCustom = (document.customPages || []).map((p) =>
        p.id === updatedPage.id ? (updatedPage as CustomPage) : p
      );
      setDocument({ ...document, customPages: updatedCustom });
      setEditingPage({ type: "custom", page: updatedPage as CustomPage });
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 bg-pf-ink/10 dark:bg-white/10 rounded-xl animate-pulse" />
        <div className="h-96 w-full bg-pf-ink/5 dark:bg-white/5 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const previewUrl = editingPage
    ? editingPage.type === "core"
      ? `/${editingPage.page.slug}?previewToken=${previewToken}`
      : `/pages/${editingPage.page.slug}?previewToken=${previewToken}`
    : `/?previewToken=${previewToken}`;

  return (
    <PageTransition>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <PublishBar
          title={editingPage ? `Edit: ${editingPage.page.title}` : "Storefront Pages & Legal CMS"}
          badge="PAGES"
          isSaving={saving}
          isPublishing={publishing}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onRestore={handleRestore}
          previewUrl={previewUrl}
          versions={versions}
        />

        {editingPage ? (
          /* PAGE EDITOR VIEW */
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setEditingPage(null)}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pf-violet dark:text-[#CDB8FF] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all pages</span>
            </button>

            <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-8 border border-pf-ink/10 dark:border-white/10 shadow-xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                    Page Title
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={editingPage.page.title}
                    onChange={(e) =>
                      handleUpdateCurrentPage({ ...editingPage.page, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-sm font-bold focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                    URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-pf-ink/5 dark:bg-white/5 border border-r-0 border-pf-ink/20 dark:border-white/10 rounded-l-xl font-mono text-xs text-pf-ink/60 dark:text-white/60">
                      {editingPage.type === "core" ? "/" : "/pages/"}
                    </span>
                    <input
                      type="text"
                      disabled={editingPage.type === "core"}
                      maxLength={100}
                      value={editingPage.page.slug}
                      onChange={(e) => {
                        const cleaned = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-");
                        handleUpdateCurrentPage({ ...editingPage.page, slug: cleaned });
                      }}
                      className="flex-1 px-4 py-2.5 rounded-r-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-mono text-xs focus:outline-none focus:border-pf-violet disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {editingPage.type === "custom" && (
                <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-pf-paper-light dark:bg-[#110E1B] border border-pf-ink/10 dark:border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-pf-ink dark:text-white">
                    <input
                      type="checkbox"
                      checked={(editingPage.page as CustomPage).published}
                      onChange={(e) =>
                        handleUpdateCurrentPage({
                          ...editingPage.page,
                          published: e.target.checked,
                        } as CustomPage)
                      }
                      className="rounded text-pf-violet focus:ring-pf-violet"
                    />
                    <span>Published (accessible to public)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-pf-ink dark:text-white">
                    <input
                      type="checkbox"
                      checked={(editingPage.page as CustomPage).showInFooter}
                      onChange={(e) =>
                        handleUpdateCurrentPage({
                          ...editingPage.page,
                          showInFooter: e.target.checked,
                        } as CustomPage)
                      }
                      className="rounded text-pf-violet focus:ring-pf-violet"
                    />
                    <span>Show Link in Storefront Footer</span>
                  </label>
                </div>
              )}

              {/* Markdown Body Editor */}
              <MarkdownEditor
                label="Page Body Content (Safe Markdown)"
                value={editingPage.page.contentMarkdown}
                onChange={(contentMarkdown) =>
                  handleUpdateCurrentPage({ ...editingPage.page, contentMarkdown })
                }
                minHeight="min-h-[350px]"
              />

              {/* SEO & SERP Preview Card */}
              <SeoPreviewCard
                title={editingPage.page.seoTitle || editingPage.page.title}
                description={editingPage.page.seoDescription || ""}
                path={
                  editingPage.type === "core"
                    ? `/${editingPage.page.slug}`
                    : `/pages/${editingPage.page.slug}`
                }
                onChangeTitle={(seoTitle) =>
                  handleUpdateCurrentPage({ ...editingPage.page, seoTitle })
                }
                onChangeDescription={(seoDescription) =>
                  handleUpdateCurrentPage({ ...editingPage.page, seoDescription })
                }
              />
            </div>
          </div>
        ) : (
          /* PAGES LIST VIEW */
          <div className="space-y-8">
            {/* 1. Core Pages Section */}
            <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-8 border border-pf-ink/10 dark:border-white/10 shadow-xs space-y-4">
              <div>
                <h2 className="font-display font-bold text-lg text-pf-ink dark:text-white">
                  Core Atelier & Legal Pages
                </h2>
                <p className="text-xs font-mono text-pf-ink/60 dark:text-white/60 mt-0.5">
                  Standard store policies and informational pages. Built-in defaults render if content is unmodified.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(document.corePages || []).map((page) => (
                  <div
                    key={page.id}
                    onClick={() => setEditingPage({ type: "core", page })}
                    className="p-4 rounded-2xl border border-pf-ink/10 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] hover:border-pf-violet transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-pf-violet dark:text-[#CDB8FF]" />
                        <h4 className="font-display font-bold text-sm text-pf-ink dark:text-white group-hover:text-pf-violet dark:group-hover:text-[#CDB8FF] transition-colors">
                          {page.title}
                        </h4>
                      </div>
                      <p className="text-[11px] font-mono text-pf-ink/50 dark:text-white/50">
                        /{page.slug}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-pf-ink/10 dark:border-white/10 text-[11px] font-mono font-bold text-pf-ink/70 dark:text-white/70 group-hover:bg-pf-violet group-hover:text-white group-hover:border-pf-violet transition-colors">
                        Edit
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Custom Pages Section */}
            <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-8 border border-pf-ink/10 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-lg text-pf-ink dark:text-white">
                    Custom Storefront Pages
                  </h2>
                  <p className="text-xs font-mono text-pf-ink/60 dark:text-white/60 mt-0.5">
                    Create standalone pages at /pages/[slug] with markdown, SEO, and live proof preview
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCustomPage}
                  className="px-4 py-2 rounded-2xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet-dark transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Page</span>
                </button>
              </div>

              {(document.customPages || []).length === 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-pf-ink/15 dark:border-white/10 text-center space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-pf-ink/30 dark:text-white/30" />
                  <p className="text-xs font-mono text-pf-ink/60 dark:text-white/60">
                    No custom pages created yet.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateCustomPage}
                    className="font-mono text-xs font-bold text-pf-violet dark:text-[#CDB8FF] hover:underline"
                  >
                    + Create your first custom page
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(document.customPages || []).map((page) => (
                    <div
                      key={page.id}
                      onClick={() => setEditingPage({ type: "custom", page })}
                      className="p-4 rounded-2xl border border-pf-ink/10 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] hover:border-pf-violet transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-pf-violet dark:text-[#CDB8FF]" />
                          <h4 className="font-display font-bold text-sm text-pf-ink dark:text-white group-hover:text-pf-violet dark:group-hover:text-[#CDB8FF] transition-colors">
                            {page.title}
                          </h4>
                          {page.published ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Live
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-pf-ink/50 dark:text-white/50">
                          /pages/{page.slug}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomPage(page.id, e)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-pf-ink/10 dark:border-white/10 text-[11px] font-mono font-bold text-pf-ink/70 dark:text-white/70 group-hover:bg-pf-violet group-hover:text-white group-hover:border-pf-violet transition-colors">
                          Edit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
