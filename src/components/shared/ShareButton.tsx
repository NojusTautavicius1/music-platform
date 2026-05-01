"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

type Props = { url: string; label?: string };

export function ShareButton({ url, label = "Share" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm font-medium text-zinc-200 transition-colors"
      aria-label="Copy share link"
    >
      {copied ? (
        <Check size={14} className="text-green-400 shrink-0" />
      ) : (
        <Share2 size={14} className="shrink-0" />
      )}
      {copied ? "Copied!" : label}
    </button>
  );
}
