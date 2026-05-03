import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PlaylistNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="22" height="22" rx="3" stroke="#71717a" strokeWidth="2" fill="none" />
            <path d="M10 7 L14 17 L10 22" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M18 8 L15 16 L18 21" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          Playlist not available
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          This playlist isn&apos;t available. It may be private or removed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ChevronLeft size={14} />
            Back to library
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
