"use client";

import { useEffect, useState } from "react";
import { X, Music2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LyricsPayload } from "@/app/api/lyrics/[songId]/route";

type Props = {
  songId: string | null;
  songTitle?: string;
  songArtist?: string;
  open: boolean;
  onClose: () => void;
};

export function LyricsDialog({ songId, songTitle, songArtist, open, onClose }: Props) {
  const [payload, setPayload] = useState<LyricsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !songId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setPayload(null);

    fetch(`/api/lyrics/${songId}`)
      .then((r) => r.json())
      .then((data: LyricsPayload) => setPayload(data))
      .catch(() => setPayload({ status: "none" }))
      .finally(() => setLoading(false));
  }, [open, songId]);

  const text =
    payload?.status === "plain"
      ? payload.text
      : payload?.status === "synced"
      ? payload.lines.map((l) => l.text).join("\n")
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col bg-[#18181F] border-white/10 text-zinc-100 p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-zinc-100 truncate">
                {songTitle ?? "Lyrics"}
              </DialogTitle>
              {songArtist && (
                <p className="text-sm text-zinc-500 truncate mt-0.5">{songArtist}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
            </div>
          )}

          {!loading && !payload && null}

          {!loading && payload?.status === "none" && (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-zinc-500">
              <Music2 size={32} />
              <p className="text-sm">No lyrics available for this song.</p>
            </div>
          )}

          {!loading && text && (
            <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-8 font-sans">
              {text}
            </pre>
          )}
        </div>

        {payload?.status === "synced" && (
          <div className="px-6 py-3 border-t border-white/10 shrink-0">
            <p className="text-xs text-zinc-600">
              Synced lyrics available — play this song to see highlighted lyrics in Now Playing.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
