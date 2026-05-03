"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  message?: string;
};

export function SignInPromptModal({
  open,
  onClose,
  message = "Sign in to do that",
}: Props) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#18181F] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="text-center space-y-4">
          <div className="text-3xl">🎵</div>
          <h2 className="text-lg font-bold text-white">{message}</h2>
          <p className="text-sm text-zinc-400">
            Create a free account to like songs, build playlists, and get
            personalized recommendations.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => router.push("/login")}
              className="w-full h-11 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
            <button
              onClick={onClose}
              className="w-full h-11 rounded-full border border-white/10 text-zinc-400 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
