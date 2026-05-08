"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { isDisposableEmail } from "@/lib/disposableEmails";
import { Mail } from "lucide-react";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (isDisposableEmail(trimmed)) {
      setError("Please use a real email address.");
      return;
    }
    setError("");
    sessionStorage.setItem("magic-link-email", trimmed);
    startTransition(() => {
      signIn("resend", { email: trimmed, redirectTo: "/" });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="magic-email" className="block text-sm font-medium mb-2 text-gray-400">
          Email
        </label>
        <input
          id="magic-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
          className="w-full h-12 px-4 bg-[#25252E] border border-white/10 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 transition-colors"
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={!email.trim()}
        className="w-full h-12 flex items-center justify-center gap-2 bg-linear-to-r from-brand-orange to-brand-magenta rounded-full font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        <Mail size={16} />
        Send magic link
      </button>
    </form>
  );
}
