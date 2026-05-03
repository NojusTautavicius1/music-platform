import Link from "next/link";
import { Search } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="nfGrad"
                x1="0"
                y1="0"
                x2="160"
                y2="160"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            {/* Cracked album cover */}
            <rect
              x="24"
              y="36"
              width="100"
              height="100"
              rx="10"
              stroke="url(#nfGrad)"
              strokeWidth="3"
              fill="none"
            />
            <rect
              x="36"
              y="48"
              width="76"
              height="76"
              rx="6"
              stroke="url(#nfGrad)"
              strokeWidth="1.5"
              fill="none"
              strokeOpacity="0.3"
            />
            {/* Crack lines */}
            <path
              d="M60 42 L72 80 L58 106 L65 136"
              stroke="url(#nfGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeOpacity="0.7"
            />
            <path
              d="M90 50 L82 75 L94 92 L88 120"
              stroke="url(#nfGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeOpacity="0.5"
            />
            {/* Search magnifier overlay */}
            <circle
              cx="116"
              cy="52"
              r="22"
              fill="#0A0A0F"
              stroke="url(#nfGrad)"
              strokeWidth="3"
            />
            <circle
              cx="116"
              cy="52"
              r="12"
              stroke="url(#nfGrad)"
              strokeWidth="2.5"
              fill="none"
              strokeOpacity="0.5"
            />
            <line
              x1="125"
              y1="61"
              x2="137"
              y2="73"
              stroke="url(#nfGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          We can&apos;t find that
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          The page or playlist you&apos;re looking for doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity"
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
