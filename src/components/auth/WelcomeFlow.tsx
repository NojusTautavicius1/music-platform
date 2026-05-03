"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FEATURED_GENRES } from "@/lib/genreColors";
import { markOnboardingComplete } from "@/app/actions/settings";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { userName: string };

const SLIDES = [
  {
    emoji: "🎵",
    title: "Your music library",
    body: "Build playlists, like songs, and keep everything in Your Library on the left.",
  },
  {
    emoji: "▶️",
    title: "The player",
    body: "Play anything from the bottom bar. Shuffle, repeat, and explore the queue panel.",
  },
  {
    emoji: "✨",
    title: "Ask Sonara AI",
    body: 'Hit the "Ask Sonara" button or press ⌘K to find music by mood, vibe, or any description.',
  },
];

export function WelcomeFlow({ userName }: Props) {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [showGenres, setShowGenres] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function handleNext() {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      setShowGenres(true);
    }
  }

  function toggleGenre(g: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  }

  function handleFinish() {
    startTransition(async () => {
      await markOnboardingComplete();
      router.push("/");
    });
  }

  if (showGenres) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Pick your top genres</h1>
            <p className="text-zinc-400 text-sm">We'll seed your first personalized mixes.</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {FEATURED_GENRES.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-semibold border transition-all",
                  selected.has(g)
                    ? "bg-brand-orange border-brand-orange text-white"
                    : "border-white/15 text-zinc-300 hover:border-white/30 hover:text-white"
                )}
              >
                {selected.has(g) && <Check size={12} className="inline mr-1.5" />}
                {g}
              </button>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleFinish}
              className="h-12 px-8 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Start exploring
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#18181F] border border-white/10 rounded-2xl p-10 text-center space-y-6">
        <p className="text-zinc-500 text-sm">Welcome, {userName} 👋</p>

        <div className="text-5xl">{current.emoji}</div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">{current.title}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{current.body}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === slide ? "bg-brand-orange w-4" : "bg-white/20"
              )}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleFinish}
            className="flex-1 h-10 rounded-full border border-white/10 text-zinc-400 text-sm hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 h-10 rounded-full bg-brand-orange text-white text-sm font-semibold flex items-center justify-center gap-1 hover:bg-brand-orange/90 transition-colors"
          >
            {slide < SLIDES.length - 1 ? (
              <>Next <ChevronRight size={14} /></>
            ) : (
              "Got it"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
