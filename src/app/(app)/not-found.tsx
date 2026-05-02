import Link from "next/link";
import { Search } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-6">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="nfAppGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            <rect x="14" y="22" width="76" height="76" rx="8" stroke="url(#nfAppGrad)" strokeWidth="2.5" fill="none" />
            <path d="M36 28 L46 58 L36 80" stroke="url(#nfAppGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.6" />
            <path d="M62 32 L54 55 L64 70 L58 92" stroke="url(#nfAppGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.6" />
            <circle cx="88" cy="36" r="18" fill="#0A0A0F" stroke="url(#nfAppGrad)" strokeWidth="2.5" />
            <circle cx="88" cy="36" r="10" stroke="url(#nfAppGrad)" strokeWidth="2" fill="none" strokeOpacity="0.4" />
            <line x1="95" y1="43" x2="106" y2="54" stroke="url(#nfAppGrad)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">We can&apos;t find that</h2>
        <p className="text-zinc-400 text-sm mb-6">
          The page or playlist you&apos;re looking for doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Search size={14} />
            Search
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
