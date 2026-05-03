"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AuthError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-orange-400" />
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">Login failed</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Something went wrong during sign-in. Please try again.
        </p>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={14} />
            Try again
          </button>
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to login
          </Link>
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
