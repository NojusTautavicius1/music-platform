"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Music2, RefreshCw, ChevronLeft } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PlaylistError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <Music2 size={28} className="text-zinc-500" />
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          Couldn&apos;t load this playlist
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          It might be private or deleted.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={14} />
            Try again
          </button>
          <button
            onClick={() => router.push("/library")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={14} />
            Back to library
          </button>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-zinc-600">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
