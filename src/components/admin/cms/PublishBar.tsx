"use client";

import React, { useState } from "react";
import {
  Save,
  Globe,
  Eye,
  RotateCcw,
  ExternalLink,
  History,
  X,
  Sparkles,
} from "lucide-react";

export interface CmsVersionItem {
  id: string;
  version: number;
  publishedBy: string;
  publishedAt: string;
  note?: string;
}

interface PublishBarProps {
  onSaveDraft: () => Promise<void> | void;
  onPublish: (note?: string) => Promise<void> | void;
  onRestore?: (versionId: string) => Promise<void> | void;
  isSaving: boolean;
  isPublishing: boolean;
  previewUrl: string;
  versions?: CmsVersionItem[];
  title?: string;
  badge?: string;
}

export function PublishBar({
  onSaveDraft,
  onPublish,
  onRestore,
  isSaving,
  isPublishing,
  previewUrl,
  versions = [],
  title = "Storefront Content",
  badge = "SINGLE ADMIN",
}: PublishBarProps) {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [publishNote, setPublishNote] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleConfirmPublish = async () => {
    await onPublish(publishNote.trim() || undefined);
    setShowPublishModal(false);
    setPublishNote("");
  };

  const handleRestoreClick = async (versionId: string) => {
    if (!onRestore) return;
    if (!confirm("Are you sure you want to restore this version? It will publish immediately to the live site.")) {
      return;
    }
    setRestoringId(versionId);
    try {
      await onRestore(versionId);
      setShowHistoryModal(false);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pf-ink/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pf-violet/10 dark:bg-pf-violet/20 text-pf-violet dark:text-[#CDB8FF]">
              {badge}
            </span>
            <span className="text-xs font-mono text-pf-ink/60 dark:text-white/60">
              Zero-Code Live Storefront Publishing
            </span>
          </div>
          <h1 className="font-display font-black text-2xl text-pf-ink dark:text-white mt-1">
            {title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* History Button */}
          {versions.length > 0 && onRestore && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E1B29] border border-pf-ink/15 dark:border-white/10 text-pf-ink dark:text-white text-xs font-mono font-bold hover:bg-pf-paper-light dark:hover:bg-white/5 transition-colors flex items-center gap-1.5"
              title="View last 10 versions and restore"
            >
              <History className="w-3.5 h-3.5 text-pf-ink/60 dark:text-white/60" />
              <span>Versions ({versions.length})</span>
            </button>
          )}

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving || isPublishing}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1E1B29] border border-pf-ink/15 dark:border-white/10 text-pf-ink dark:text-white text-xs font-mono font-bold hover:bg-pf-paper-light dark:hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-pf-violet dark:text-[#CDB8FF]" />
            <span>{isSaving ? "Saving Draft..." : "Save Draft"}</span>
          </button>

          {/* Live Preview Button */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-[#CDB8FF]/30 dark:bg-[#6A2CFF]/20 border border-[#6A2CFF]/30 text-[#6A2CFF] dark:text-[#CDB8FF] text-xs font-mono font-bold hover:bg-[#CDB8FF]/50 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Draft</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Publish Button */}
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            disabled={isPublishing || isSaving}
            className="px-5 py-2.5 rounded-2xl bg-pf-violet text-white text-xs font-mono font-bold hover:bg-pf-violet-dark transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            <span>{isPublishing ? "Publishing..." : "Publish Live"}</span>
          </button>
        </div>
      </div>

      {/* Publish Note Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pf-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-pf-ink/15 dark:border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pf-violet/10 text-pf-violet flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-lg text-pf-ink dark:text-white">
                  Publish to Live Storefront
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="p-1.5 rounded-xl hover:bg-pf-ink/5 dark:hover:bg-white/5 text-pf-ink/60 dark:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-sans text-pf-ink/75 dark:text-white/75 leading-relaxed">
              Publishing will update the live storefront for all customers and immediately revalidate cached pages. A snapshot of this version will be saved to history.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
                Change Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Updated holiday announcements & FAQ proofing SLA"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                maxLength={120}
                className="w-full px-4 py-2.5 rounded-xl border border-pf-ink/20 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white font-sans text-xs focus:outline-none focus:border-pf-violet"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl border border-pf-ink/20 dark:border-white/10 text-pf-ink/70 dark:text-white/70 font-mono text-xs hover:bg-pf-ink/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isPublishing}
                className="px-5 py-2 rounded-xl bg-pf-violet text-white font-mono text-xs font-bold hover:bg-pf-violet-dark transition-colors flex items-center gap-2 shadow-sm"
              >
                {isPublishing ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pf-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181524] rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-pf-ink/15 dark:border-white/10 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-pf-ink/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pf-violet/10 text-pf-violet flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-pf-ink dark:text-white">
                    Version History (Last 10)
                  </h3>
                  <p className="text-[11px] font-mono text-pf-ink/60 dark:text-white/60">
                    One-click rollback restores site content immediately
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl hover:bg-pf-ink/5 dark:hover:bg-white/5 text-pf-ink/60 dark:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className="p-4 rounded-2xl border border-pf-ink/15 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-pf-violet/15 text-pf-violet dark:text-[#CDB8FF]">
                        Version #{ver.version}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Active Live
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-sans font-medium text-pf-ink dark:text-white">
                      {ver.note || "Published CMS update"}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-pf-ink/50 dark:text-white/50">
                      <span>By {ver.publishedBy}</span>
                      <span>•</span>
                      <span>{new Date(ver.publishedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                    </div>
                  </div>

                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleRestoreClick(ver.id)}
                      disabled={restoringId === ver.id}
                      className="px-3.5 py-1.5 rounded-xl border border-pf-violet text-pf-violet dark:text-[#CDB8FF] text-xs font-mono font-bold hover:bg-pf-violet hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{restoringId === ver.id ? "Restoring..." : "Restore"}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-pf-ink/10 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-pf-ink dark:bg-white text-white dark:text-pf-ink font-mono text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
