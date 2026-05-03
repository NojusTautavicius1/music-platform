"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "sonara.guestBannerDismissed";

export function GuestBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
      <div className="flex items-center gap-3 bg-[#18181F] border border-white/15 rounded-xl px-4 py-3 shadow-xl">
        <p className="flex-1 text-sm text-zinc-300">
          <span className="text-white font-semibold">Like what you hear?</span>{" "}
          Sign in to save and create your own playlists.
        </p>
        <Link
          href="/login"
          className="shrink-0 h-8 px-4 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
        <button onClick={dismiss} className="shrink-0 text-zinc-500 hover:text-white transition-colors" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
