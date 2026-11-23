"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Edit3, Eye, Bold, Heading, List, Link as LinkIcon } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  label = "Content (Markdown)",
  placeholder = "Write safe markdown content...",
  maxLength = 50000,
  minHeight = "min-h-[280px]",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const insertSnippet = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("pf-markdown-textarea") as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(value + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || "text";
    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-mono font-bold text-pf-ink/80 dark:text-white/80">
          {label}
        </label>

        {/* Tab switch & Quick Toolbar */}
        <div className="flex items-center gap-1">
          {activeTab === "write" && (
            <div className="hidden sm:flex items-center gap-1 mr-2 pr-2 border-r border-pf-ink/15 dark:border-white/10">
              <button
                type="button"
                onClick={() => insertSnippet("**", "**")}
                className="p-1 rounded hover:bg-pf-ink/5 dark:hover:bg-white/5 text-pf-ink/70 dark:text-white/70"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("## ")}
                className="p-1 rounded hover:bg-pf-ink/5 dark:hover:bg-white/5 text-pf-ink/70 dark:text-white/70"
                title="Heading"
              >
                <Heading className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("- ")}
                className="p-1 rounded hover:bg-pf-ink/5 dark:hover:bg-white/5 text-pf-ink/70 dark:text-white/70"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("[", "](https://)")}
                className="p-1 rounded hover:bg-pf-ink/5 dark:hover:bg-white/5 text-pf-ink/70 dark:text-white/70"
                title="Insert Link"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center rounded-xl bg-pf-paper-light dark:bg-white/5 p-0.5 border border-pf-ink/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                activeTab === "write"
                  ? "bg-white dark:bg-[#1E1B29] text-pf-ink dark:text-white shadow-xs"
                  : "text-pf-ink/60 dark:text-white/60 hover:text-pf-ink dark:hover:text-white"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                activeTab === "preview"
                  ? "bg-white dark:bg-[#1E1B29] text-pf-ink dark:text-white shadow-xs"
                  : "text-pf-ink/60 dark:text-white/60 hover:text-pf-ink dark:hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "write" ? (
        <div className="relative">
          <textarea
            id="pf-markdown-textarea"
            rows={10}
            maxLength={maxLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full p-4 rounded-2xl border border-pf-ink/15 dark:border-white/10 bg-white dark:bg-[#110E1B] text-pf-ink dark:text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-pf-violet ${minHeight}`}
          />
          <div className="flex justify-end pt-1">
            <span className="text-[10px] font-mono text-pf-ink/50 dark:text-white/50">
              {value.length} / {maxLength} chars
            </span>
          </div>
        </div>
      ) : (
        <div
          className={`w-full p-5 rounded-2xl border border-pf-ink/15 dark:border-white/10 bg-pf-paper-light dark:bg-[#110E1B] text-pf-ink dark:text-white overflow-y-auto ${minHeight} prose prose-sm dark:prose-invert max-w-none font-sans`}
        >
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-xs font-mono text-pf-ink/40 dark:text-white/40 italic">
              (No markdown content yet. Switch to &ldquo;Write&rdquo; to draft content.)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
