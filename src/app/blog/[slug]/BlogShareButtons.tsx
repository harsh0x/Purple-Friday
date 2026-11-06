"use client";

import React from "react";
import { Share2, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function BlogShareButtons({ title, slug }: { title: string; slug: string }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://purplefriday.in/blog/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${title} — ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-pf-ink/60 flex items-center gap-1 mr-1">
        <Share2 className="h-3.5 w-3.5" />
        Share:
      </span>
      <button
        type="button"
        onClick={shareWhatsApp}
        className="h-8 px-2.5 border border-pf-ink bg-white font-mono text-xs font-bold text-pf-ink hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-600 transition-colors flex items-center gap-1 shadow-sm"
      >
        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
        <span>WhatsApp</span>
      </button>
      <button
        type="button"
        onClick={handleCopyLink}
        className="h-8 px-2.5 border border-pf-ink bg-white font-mono text-xs font-bold text-pf-ink hover:bg-pf-paper transition-colors flex items-center gap-1 shadow-sm"
      >
        <Copy className="h-3.5 w-3.5" />
        <span>Copy Link</span>
      </button>
    </div>
  );
}

