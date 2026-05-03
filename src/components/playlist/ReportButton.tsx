"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { reportPlaylist } from "@/app/actions/playlist";
import { toast } from "sonner";

type Props = { playlistId: string };

export function ReportButton({ playlistId }: Props) {
  const [reported, setReported] = useState(false);
  const [, startTransition] = useTransition();

  function handleReport() {
    if (reported) return;
    startTransition(async () => {
      const res = await reportPlaylist(playlistId);
      if (res.ok) {
        setReported(true);
        toast(res.unpublished ? "Playlist removed for violating our guidelines." : "Thanks for the report. We'll review it.");
      }
    });
  }

  return (
    <button
      onClick={handleReport}
      disabled={reported}
      className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Report playlist"
    >
      <Flag size={12} />
      {reported ? "Reported" : "Report"}
    </button>
  );
}
