"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Home } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

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
                id="vinylGrad"
                x1="0"
                y1="0"
                x2="160"
                y2="160"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            {/* Grooves */}
            <circle cx="80" cy="80" r="72" stroke="url(#vinylGrad)" strokeWidth="4" fill="none" />
            <circle cx="80" cy="80" r="60" stroke="url(#vinylGrad)" strokeWidth="1.5" fill="none" strokeOpacity="0.3" />
            <circle cx="80" cy="80" r="50" stroke="url(#vinylGrad)" strokeWidth="1.5" fill="none" strokeOpacity="0.3" />
            <circle cx="80" cy="80" r="40" stroke="url(#vinylGrad)" strokeWidth="1.5" fill="none" strokeOpacity="0.3" />
            {/* Label */}
            <circle cx="80" cy="80" r="22" stroke="url(#vinylGrad)" strokeWidth="2.5" fill="#0A0A0F" />
            {/* Center hole */}
            <circle cx="80" cy="80" r="4" fill="url(#vinylGrad)" />
            {/* Crack across the record */}
            <path
              d="M80 10 L73 46 L86 68 L70 90 L78 140"
              stroke="url(#vinylGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M110 32 L98 58 L88 72"
              stroke="url(#vinylGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeOpacity="0.6"
            />
            <path
              d="M45 105 L60 95 L68 90"
              stroke="url(#vinylGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeOpacity="0.6"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Something hit a wrong note
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          We&apos;re working on it. Try again, or head back home.
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
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-zinc-300 text-sm hover:bg-white/5 transition-colors"
          >
            <Home size={14} />
            Go home
          </button>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-zinc-600">
            Reference:{" "}
            <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
