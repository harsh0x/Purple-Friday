"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  BookOpen,
  Plus,
  Trash2,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  StorefrontCmsDocument,
  DEFAULT_CMS_DOCUMENT,
  CmsBlogPost,
} from "@/server/cms/schema";
import { PublishBar, CmsVersionItem } from "@/components/admin/cms/PublishBar";
import { MarkdownEditor } from "@/components/admin/cms/MarkdownEditor";
import { SeoPreviewCard } from "@/components/admin/cms/SeoPreviewCard";
import { ImagePicker } from "@/components/admin/cms/ImagePicker";

export default function AdminBlogPage() {
  const [document, setDocument] = useState<StorefrontCmsDocument>(DEFAULT_CMS_DOCUMENT);
  const [versions, setVersions] = useState<CmsVersionItem[]>([]);
  const [previewToken, setPreviewToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Active editing post
  const [editingPost, setEditingPost] = useState<CmsBlogPost | null>(null);
  const [tagInput, setTagInput] = useState("");

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
      toast.success("Blog draft saved safely. Storefront remains unchanged until published.");
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
      toast.success(`Version #${json.version} published! Blog posts updated on storefront.`);
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
      setEditingPost(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to restore version");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    const newPost: CmsBlogPost = {
      id: `post-${Date.now()}`,
      slug: `story-${Date.now().toString().slice(-4)}`,
      title: "New Dispatch from the Print Floor",
      coverImage: "/mockups/hoodie-black.png",
      excerpt: "Technical pre-press dispatch and print production guide for corporate managers.",
      contentMarkdown: `# New Dispatch from the Print Floor\n\nDeep dive into textile print chemistry, vector alignment, and apparel longevity.\n\n## Technical Notes\n- Precision DTF & Screen tolerances\n- Pre-press vector validation rules`,
      readingTimeMinutes: 4,
      tags: ["Prepress", "Apparel", "Dispatch"],
      published: true,
      seoTitle: "New Dispatch from the Print Floor | Purple Friday",
      seoDescription: "Technical pre-press dispatch and print production guide from Purple Friday.",
      authorName: "Purple Friday Atelier",
      publishedAt: new Date().toISOString(),
    };

    const updated = [...(document.blogPosts || []), newPost];
    setDocument({ ...document, blogPosts: updated });
    setEditingPost(newPost);
  };

  const handleDeletePost = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    const updated = (document.blogPosts || []).filter((p) => p.id !== id);
    setDocument({ ...document, blogPosts: updated });
    if (editingPost?.id === id) {
      setEditingPost(null);
    }
    toast.success("Blog post removed from draft.");
  };

  const handleUpdateCurrentPost = (updated: CmsBlogPost) => {
    const updatedPosts = (document.blogPosts || []).map((p) =>
      p.id === updated.id ? updated : p
    );
    setDocument({ ...document, blogPosts: updatedPosts });
    setEditingPost(updated);
  };

  const handleAddTag = () => {
    if (!editingPost || !tagInput.trim()) return;
    const t = tagInput.trim();
    if (!editingPost.tags.includes(t)) {
      handleUpdateCurrentPost({
        ...editingPost,
        tags: [...editingPost.tags, t],
      });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editingPost) return;
    handleUpdateCurrentPost({
      ...editingPost,
      tags: editingPost.tags.filter((t) => t !== tagToRemove),
    });
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 bg-pf-ink/10 dark:bg-white/10 rounded-xl animate-pulse" />
        <div className="h-96 w-full bg-pf-ink/5 dark:bg-white/5 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const previewUrl = editingPost
    ? `/blog/${editingPost.slug}?previewToken=${previewToken}`
    : `/blog?previewToken=${previewToken}`;

  return (
    <PageTransition>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <PublishBar
          title={editingPost ? `Edit: ${editingPost.title}` : "Blog & Press Log Studio"}
          badge="STORIES"
          isSaving={saving}
          isPublishing={publishing}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onRestore={handleRestore}
          previewUrl={previewUrl}
          versions={versions}
        />

        {editingPost ? (
          /* POST EDITOR VIEW */
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setEditingPost(null)}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pf-violet dark:text-[#CDB8FF] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all blog posts</span>
            </button>

            <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-8 border border-pf-ink/10 dark:border-white/10 shadow-xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                    Article Title
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={editingPost.title}
                    onChange={(e) =>
                      handleUpdateCurrentPost({ ...editingPost, title: e.target.value })
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
                      /blog/
                    </span>
                    <input
                      type="text"
                      maxLength={100}
                      value={editingPost.slug}
                      onChange={(e) => {
                        const cleaned = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-");
                        handleUpdateCurrentPost({ ...editingPost, slug: cleaned });
                      }}
                      className="flex-1 px-4 py-2.5 rounded-r-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-mono text-xs focus:outline-none focus:border-pf-violet"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Image Picker */}
              <ImagePicker
                label="Cover Image"
                value={editingPost.coverImage}
                onChange={(coverImage) => handleUpdateCurrentPost({ ...editingPost, coverImage })}
                helpText="Featured banner image shown in blog cards and social link previews"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                  Short Excerpt / Teaser
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={editingPost.excerpt}
                  onChange={(e) =>
                    handleUpdateCurrentPost({ ...editingPost, excerpt: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                    Author Name
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={editingPost.authorName}
                    onChange={(e) =>
                      handleUpdateCurrentPost({ ...editingPost, authorName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                    Reading Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={editingPost.readingTimeMinutes}
                    onChange={(e) =>
                      handleUpdateCurrentPost({
                        ...editingPost,
                        readingTimeMinutes: parseInt(e.target.value, 10) || 5,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-mono text-xs focus:outline-none focus:border-pf-violet"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                    Visibility
                  </label>
                  <div className="h-10 flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-bold text-pf-ink dark:text-white">
                      <input
                        type="checkbox"
                        checked={editingPost.published}
                        onChange={(e) =>
                          handleUpdateCurrentPost({
                            ...editingPost,
                            published: e.target.checked,
                          })
                        }
                        className="rounded text-pf-violet focus:ring-pf-violet"
                      />
                      <span>Published to Blog</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                  Tags & Categories
                </label>
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  {editingPost.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-pf-violet/10 text-pf-violet dark:text-[#CDB8FF] font-mono text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Add tag (e.g. Prepress, Embroidery)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3.5 py-2 rounded-xl bg-pf-ink dark:bg-white text-white dark:text-pf-ink font-mono text-xs font-bold hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Markdown Body */}
              <MarkdownEditor
                label="Article Body (Safe Markdown)"
                value={editingPost.contentMarkdown}
                onChange={(contentMarkdown) =>
                  handleUpdateCurrentPost({ ...editingPost, contentMarkdown })
                }
                minHeight="min-h-[400px]"
              />

              {/* SEO Card */}
              <SeoPreviewCard
                title={editingPost.seoTitle || editingPost.title}
                description={editingPost.seoDescription || editingPost.excerpt}
                path={`/blog/${editingPost.slug}`}
                onChangeTitle={(seoTitle) =>
                  handleUpdateCurrentPost({ ...editingPost, seoTitle })
                }
                onChangeDescription={(seoDescription) =>
                  handleUpdateCurrentPost({ ...editingPost, seoDescription })
                }
              />
            </div>
          </div>
        ) : (
          /* POST LIST VIEW */
          <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-8 border border-pf-ink/10 dark:border-white/10 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-pf-ink dark:text-white">
                  Published & Draft Articles
                </h2>
                <p className="text-xs font-mono text-pf-ink/60 dark:text-white/60 mt-0.5">
                  Manage print production dispatches, case studies, and prepress technical guides
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                className="px-4 py-2 rounded-2xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet-dark transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Story</span>
              </button>
            </div>

            {(document.blogPosts || []).length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-pf-ink/15 dark:border-white/10 text-center space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-pf-ink/30 dark:text-white/30" />
                <p className="text-xs font-mono text-pf-ink/60 dark:text-white/60">
                  No blog stories created yet.
                </p>
                <button
                  type="button"
                  onClick={handleCreatePost}
                  className="font-mono text-xs font-bold text-pf-violet dark:text-[#CDB8FF] hover:underline"
                >
                  + Create your first article
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(document.blogPosts || []).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setEditingPost(post)}
                    className="p-5 rounded-2xl border border-pf-ink/10 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] hover:border-pf-violet transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-pf-ink/50 dark:text-white/50 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-pf-violet dark:text-[#CDB8FF]" />
                          {post.readingTimeMinutes} min read
                        </span>
                        {post.published ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-base text-pf-ink dark:text-white group-hover:text-pf-violet dark:group-hover:text-[#CDB8FF] transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-xs font-sans text-pf-ink/70 dark:text-white/70 line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-pf-ink/10 dark:border-white/10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-white/5 border border-pf-ink/10 dark:border-white/10 text-[10px] font-mono text-pf-ink/60 dark:text-white/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-pf-ink/10 dark:border-white/10 text-[11px] font-mono font-bold text-pf-ink/70 dark:text-white/70 group-hover:bg-pf-violet group-hover:text-white group-hover:border-pf-violet transition-colors">
                          Edit
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
