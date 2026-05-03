"use client";

import { useState, useTransition } from "react";
import { Share2, Copy, Check, Globe, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { shareablePlaylist, unpublishPlaylist } from "@/app/actions/playlist";
import { toast } from "sonner";

type Props = {
  playlistId: string;
  isPublic: boolean;
  existingSlug?: string | null;
};

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonara.vercel.app";

export function SharePopover({ playlistId, isPublic, existingSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    isPublic && existingSlug ? `${BASE}/p/${existingSlug}` : null
  );
  const [copied, setCopied] = useState(false);
  const [isPublicState, setIsPublicState] = useState(isPublic);
  const [, startTransition] = useTransition();

  function handleMakePublic() {
    startTransition(async () => {
      const res = await shareablePlaylist(playlistId);
      if (res.ok) {
        setShareUrl(res.url);
        setIsPublicState(true);
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleMakePrivate() {
    startTransition(async () => {
      const res = await unpublishPlaylist(playlistId);
      if (res.ok) {
        setIsPublicState(false);
        setShareUrl(null);
        toast("Playlist is now private.");
      } else {
        toast.error(res.error);
      }
    });
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            className="flex items-center gap-2 px-4 h-9 rounded-full border border-white/15 text-sm text-zinc-300 hover:text-white hover:border-white/30 transition-colors"
            aria-label="Share playlist"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Share</span>
          </button>
        }
      />

      <PopoverContent className="w-76 p-4 space-y-4">
        <h3 className="font-semibold text-sm">Share playlist</h3>

        {!isPublicState ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              This playlist is private. Make it public to share with anyone.
            </p>
            <button
              onClick={handleMakePublic}
              className="flex items-center gap-2 w-full h-9 rounded-lg bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-sm font-medium hover:bg-brand-orange/25 transition-colors px-3"
            >
              <Globe size={14} />
              Make public &amp; get link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {shareUrl && (
              <>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 h-10">
                  <span className="flex-1 text-xs text-zinc-300 truncate">{shareUrl}</span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 text-zinc-400 hover:text-white transition-colors"
                    aria-label="Copy link"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out this playlist on Sonara 🎵")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors"
                  >
                    Twitter / X
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-colors"
                  >
                    Facebook
                  </a>
                </div>
              </>
            )}

            <button
              onClick={handleMakePrivate}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Lock size={12} />
              Make private again
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
