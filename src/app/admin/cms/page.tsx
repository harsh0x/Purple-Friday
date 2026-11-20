"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageTransition } from "@/components/admin/PageTransition";
import {
  Sparkles,
  Save,
  Globe,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  Check,
  AlertCircle,
  HelpCircle,
  Layout,
  Megaphone,
  Search,
  ExternalLink,
  Layers,
} from "lucide-react";
import {
  StorefrontCmsDocument,
  DEFAULT_CMS_DOCUMENT,
  AnnouncementMessage,
  FaqEntry,
} from "@/server/cms/schema";

interface CmsVersionItem {
  id: string;
  version: number;
  publishedBy: string;
  publishedAt: string;
  note?: string;
}

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<
    "hero" | "announcements" | "sections" | "faqs" | "footer" | "coupons" | "seo" | "versions"
  >("hero");

  const [document, setDocument] = useState<StorefrontCmsDocument>(DEFAULT_CMS_DOCUMENT);
  const [versions, setVersions] = useState<CmsVersionItem[]>([]);
  const [previewToken, setPreviewToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishNote, setPublishNote] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
      // fallback to default
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

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
      showToast("success", "Draft saved safely. Storefront remains unchanged until published.");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", content: document, note: publishNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish");
      showToast("success", `Version #${json.version} published! Storefront cache revalidated.`);
      setShowPublishModal(false);
      setPublishNote("");
      fetchData();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this version? It will publish immediately.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", versionId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to restore version");
      showToast("success", `Successfully restored Version #${json.version}!`);
      fetchData();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to restore version");
    } finally {
      setLoading(false);
    }
  };

  // Section Ordering Helpers
  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...document.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    // Re-assign sortOrder
    newSections.forEach((s, idx) => {
      s.sortOrder = idx + 1;
    });
    setDocument({ ...document, sections: newSections });
  };

  // Announcement Helpers
  const addAnnouncement = () => {
    const newAnn: AnnouncementMessage = {
      id: `ann-${Date.now()}`,
      text: "New limited-time corporate dispatch announcement",
      code: "",
      link: "",
      active: true,
      sortOrder: document.announcements.length + 1,
    };
    setDocument({ ...document, announcements: [...document.announcements, newAnn] });
  };

  const removeAnnouncement = (id: string) => {
    setDocument({ ...document, announcements: document.announcements.filter((a) => a.id !== id) });
  };

  // FAQ Helpers
  const addFaq = () => {
    const newFaq: FaqEntry = {
      id: `faq-${Date.now()}`,
      category: "General",
      question: "How do we approve our branded proofs?",
      answer: "Proofs are approved 100% online through your secure digital proof link.",
      sortOrder: document.faqs.length + 1,
      active: true,
    };
    setDocument({ ...document, faqs: [...document.faqs, newFaq] });
  };

  const removeFaq = (id: string) => {
    setDocument({ ...document, faqs: document.faqs.filter((f) => f.id !== id) });
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 bg-[#15101F]/10 rounded-xl animate-pulse" />
        <div className="h-96 w-full bg-[#15101F]/5 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-mono font-bold transition-all shadow-md ${
              notification.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Page Header & Publish Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#15101F]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6A2CFF]/10 text-[#6A2CFF]">
                SUPER ADMIN
              </span>
              <span className="text-xs font-mono text-[#15101F]/50">Zero-Code Storefront Content</span>
            </div>
            <h1 className="font-display font-black text-2xl text-[#15101F] mt-1">
              Storefront CMS Studio
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#15101F]/15 text-[#15101F] text-xs font-mono font-bold hover:bg-[#FAF7F2] transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Draft"}</span>
            </button>

            <a
              href={`/?previewToken=${previewToken}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-[#CDB8FF]/40 border border-[#6A2CFF]/20 text-[#6A2CFF] text-xs font-mono font-bold hover:bg-[#CDB8FF]/60 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Live</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <button
              onClick={() => setShowPublishModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#6A2CFF] text-white text-xs font-mono font-bold hover:bg-[#5822db] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Globe className="w-4 h-4" />
              <span>Publish to Storefront</span>
            </button>
          </div>
        </div>

        {/* CMS Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#15101F]/10 pb-3">
          {[
            { id: "hero", label: "Hero Banner", icon: Layout },
            { id: "announcements", label: "Announcement Bar", icon: Megaphone },
            { id: "sections", label: "Page Sections Order", icon: Layers },
            { id: "faqs", label: "FAQ Entries", icon: HelpCircle },
            { id: "footer", label: "Footer Links", icon: ExternalLink },
            { id: "coupons", label: "Coupon Banners", icon: Sparkles },
            { id: "seo", label: "SEO & Social", icon: Search },
            { id: "versions", label: `History (${versions.length})`, icon: RotateCcw },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-[#15101F] text-white shadow-sm"
                    : "bg-white border border-[#15101F]/10 text-[#15101F]/70 hover:bg-[#FAF7F2]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: HERO */}
        {activeTab === "hero" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F]">Homepage Hero Section</h2>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Controls the primary above-the-fold banner and call-to-action buttons
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Top Atelier Badge</label>
                <input
                  type="text"
                  maxLength={60}
                  value={document.hero.badgeText}
                  onChange={(e) =>
                    setDocument({ ...document, hero: { ...document.hero, badgeText: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Primary Headline</label>
                <input
                  type="text"
                  maxLength={100}
                  value={document.hero.headline}
                  onChange={(e) =>
                    setDocument({ ...document, hero: { ...document.hero, headline: e.target.value } })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-[#15101F]/15 font-display font-bold text-base focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Sub-headline Copy</label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={document.hero.subtext}
                  onChange={(e) =>
                    setDocument({ ...document, hero: { ...document.hero, subtext: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-sans text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Primary Button Label</label>
                <input
                  type="text"
                  maxLength={40}
                  value={document.hero.primaryButtonText}
                  onChange={(e) =>
                    setDocument({ ...document, hero: { ...document.hero, primaryButtonText: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Primary Button Link</label>
                <input
                  type="text"
                  maxLength={200}
                  value={document.hero.primaryButtonUrl}
                  onChange={(e) =>
                    setDocument({ ...document, hero: { ...document.hero, primaryButtonUrl: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Secondary Button Label</label>
                <input
                  type="text"
                  maxLength={40}
                  value={document.hero.secondaryButtonText}
                  onChange={(e) =>
                    setDocument({ ...document, hero: { ...document.hero, secondaryButtonText: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Secondary Button Link</label>
                <input
                  type="text"
                  maxLength={200}
                  value={document.hero.secondaryButtonUrl}
                  onChange={(e) =>
                    setDocument({ ...document, hero: { ...document.hero, secondaryButtonUrl: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-[#15101F]">Top Announcement Messages</h2>
                <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                  Rotating ticker on the very top bar with coupon copy and scheduling
                </p>
              </div>
              <button
                onClick={addAnnouncement}
                className="px-4 py-2 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 text-xs font-mono font-bold hover:bg-[#15101F] hover:text-white transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Message</span>
              </button>
            </div>

            <div className="space-y-4">
              {document.announcements.map((ann, idx) => (
                <div
                  key={ann.id}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#6A2CFF]">
                      Message #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ann.active}
                          onChange={(e) => {
                            const updated = [...document.announcements];
                            updated[idx].active = e.target.checked;
                            setDocument({ ...document, announcements: updated });
                          }}
                          className="rounded text-[#6A2CFF]"
                        />
                        <span>Active</span>
                      </label>
                      <button
                        onClick={() => removeAnnouncement(ann.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Announcement Text</label>
                      <input
                        type="text"
                        maxLength={150}
                        value={ann.text}
                        onChange={(e) => {
                          const updated = [...document.announcements];
                          updated[idx].text = e.target.value;
                          setDocument({ ...document, announcements: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Coupon Code (optional)</label>
                      <input
                        type="text"
                        maxLength={30}
                        placeholder="e.g. FIRSTORDER"
                        value={ann.code || ""}
                        onChange={(e) => {
                          const updated = [...document.announcements];
                          updated[idx].code = e.target.value || null;
                          setDocument({ ...document, announcements: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-mono text-xs uppercase focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SECTIONS ORDER */}
        {activeTab === "sections" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F]">Homepage Sections Order & Visibility</h2>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Toggle section visibility and adjust presentation sequence
              </p>
            </div>

            <div className="space-y-2">
              {document.sections.map((section, idx) => (
                <div
                  key={section.id}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-[#15101F] text-white flex items-center justify-center font-mono text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-sans font-bold text-sm text-[#15101F]">
                        {section.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#15101F]/50">
                        Identifier: {section.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer mr-3">
                      <input
                        type="checkbox"
                        checked={section.visible}
                        onChange={(e) => {
                          const updated = [...document.sections];
                          updated[idx].visible = e.target.checked;
                          setDocument({ ...document, sections: updated });
                        }}
                        className="rounded text-[#6A2CFF]"
                      />
                      <span>Visible</span>
                    </label>

                    <button
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, "up")}
                      className="p-1.5 rounded-lg border border-[#15101F]/10 hover:bg-white disabled:opacity-30 transition-all"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={idx === document.sections.length - 1}
                      onClick={() => moveSection(idx, "down")}
                      className="p-1.5 rounded-lg border border-[#15101F]/10 hover:bg-white disabled:opacity-30 transition-all"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FAQS */}
        {activeTab === "faqs" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-[#15101F]">Storefront FAQ Entries</h2>
                <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                  Update prepress, proofing, delivery, and GST invoicing customer guidance
                </p>
              </div>
              <button
                onClick={addFaq}
                className="px-4 py-2 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 text-xs font-mono font-bold hover:bg-[#15101F] hover:text-white transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-4">
              {document.faqs.map((faq, idx) => (
                <div
                  key={faq.id}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#6A2CFF]">
                      FAQ #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeFaq(faq.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Category</label>
                      <input
                        type="text"
                        value={faq.category}
                        onChange={(e) => {
                          const updated = [...document.faqs];
                          updated[idx].category = e.target.value;
                          setDocument({ ...document, faqs: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>

                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Question</label>
                      <input
                        type="text"
                        maxLength={200}
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...document.faqs];
                          updated[idx].question = e.target.value;
                          setDocument({ ...document, faqs: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-sans font-bold text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Answer</label>
                      <textarea
                        rows={3}
                        maxLength={1200}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...document.faqs];
                          updated[idx].answer = e.target.value;
                          setDocument({ ...document, faqs: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-sans text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FOOTER */}
        {activeTab === "footer" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F]">Storefront Footer & Contact</h2>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Brand narrative, contact phone, support email, and legal disclosures
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Brand Statement</label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={document.footer.brandStatement}
                  onChange={(e) =>
                    setDocument({ ...document, footer: { ...document.footer, brandStatement: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-sans text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Support Email</label>
                <input
                  type="email"
                  value={document.footer.contactEmail}
                  onChange={(e) =>
                    setDocument({ ...document, footer: { ...document.footer, contactEmail: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Contact Phone</label>
                <input
                  type="text"
                  value={document.footer.contactPhone}
                  onChange={(e) =>
                    setDocument({ ...document, footer: { ...document.footer, contactPhone: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">Copyright Line</label>
                <input
                  type="text"
                  value={document.footer.copyrightText}
                  onChange={(e) =>
                    setDocument({ ...document, footer: { ...document.footer, copyrightText: e.target.value } })
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COUPONS */}
        {activeTab === "coupons" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F]">Promotional Coupon Banners</h2>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Highlight special seasonal incentives or corporate bulk incentives
              </p>
            </div>

            <div className="space-y-4">
              {document.couponBanners.map((cb, idx) => (
                <div key={cb.id} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Banner Title</label>
                      <input
                        type="text"
                        value={cb.title}
                        onChange={(e) => {
                          const updated = [...document.couponBanners];
                          updated[idx].title = e.target.value;
                          setDocument({ ...document, couponBanners: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-sans font-bold text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Coupon Code</label>
                      <input
                        type="text"
                        value={cb.code}
                        onChange={(e) => {
                          const updated = [...document.couponBanners];
                          updated[idx].code = e.target.value.toUpperCase();
                          setDocument({ ...document, couponBanners: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-mono text-xs uppercase focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#15101F]/60">Subtitle / Discount Info</label>
                      <input
                        type="text"
                        value={cb.subtitle}
                        onChange={(e) => {
                          const updated = [...document.couponBanners];
                          updated[idx].subtitle = e.target.value;
                          setDocument({ ...document, couponBanners: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SEO */}
        {activeTab === "seo" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F]">Page SEO & Social Sharing</h2>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Set meta titles, descriptions, and OpenGraph social preview images
              </p>
            </div>

            <div className="space-y-4">
              {document.seo.map((s, idx) => (
                <div key={s.path} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#6A2CFF]">{s.path}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-mono text-[#15101F]/60">Meta Title</label>
                      <input
                        type="text"
                        maxLength={80}
                        value={s.title}
                        onChange={(e) => {
                          const updated = [...document.seo];
                          updated[idx].title = e.target.value;
                          setDocument({ ...document, seo: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-sans font-bold text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#15101F]/60">Meta Description</label>
                      <textarea
                        rows={2}
                        maxLength={250}
                        value={s.description}
                        onChange={(e) => {
                          const updated = [...document.seo];
                          updated[idx].description = e.target.value;
                          setDocument({ ...document, seo: updated });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#15101F]/15 font-sans text-xs focus:outline-none focus:border-[#6A2CFF]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: VERSIONS & RESTORE */}
        {activeTab === "versions" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#15101F]/10 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-lg text-[#15101F]">Version History & 1-Click Restore</h2>
              <p className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                Last 10 published versions are preserved with full rollback capabilities
              </p>
            </div>

            <div className="space-y-3">
              {versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#15101F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#15101F]">
                        Version #{ver.version}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          LIVE ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-[#15101F]/60 mt-0.5">
                      Published by {ver.publishedBy} • {new Date(ver.publishedAt).toLocaleString("en-IN")}
                    </div>
                    {ver.note && (
                      <div className="text-xs font-sans text-[#15101F]/80 italic mt-1">
                        &quot;{ver.note}&quot;
                      </div>
                    )}
                  </div>

                  {idx !== 0 && (
                    <button
                      onClick={() => handleRestore(ver.id)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-[#15101F]/15 text-[#15101F] text-xs font-mono font-bold hover:bg-[#6A2CFF] hover:text-white transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Version</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Publish Confirmation */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 bg-[#15101F]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#15101F]/15 shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#6A2CFF]" />
                <h3 className="font-display font-bold text-lg text-[#15101F]">
                  Publish to Live Storefront
                </h3>
              </div>

              <p className="text-xs font-sans text-[#15101F]/70">
                This will immediately update the live customer storefront, revalidate Next.js cache tags, and snapshot the previous version in history.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-[#15101F]/70">
                  Release Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwali festive hero update"
                  value={publishNote}
                  onChange={(e) => setPublishNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#15101F]/15 font-mono text-xs focus:outline-none focus:border-[#6A2CFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-[#15101F]/15 text-xs font-mono font-bold hover:bg-[#FAF7F2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={publishing}
                  onClick={handlePublish}
                  className="px-5 py-2.5 rounded-2xl bg-[#6A2CFF] text-white text-xs font-mono font-bold hover:bg-[#5822db] transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{publishing ? "Publishing..." : "Confirm Publish"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
