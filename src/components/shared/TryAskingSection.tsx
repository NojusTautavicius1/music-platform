"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { FlowDivider } from "@/components/shared/FlowDivider";

const FEATURED_QUERIES = [
  "Give me something for late-night coding",
  "Songs for a rainy Sunday morning",
  "Uplifting tracks to start the day",
];

export function TryAskingSection() {
  const router = useRouter();

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-2xl font-bold text-zinc-100 section-heading">Try asking</h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-medium">
          <Sparkles size={10} />
          AI
        </span>
      </div>
      <FlowDivider className="mb-4" />
      <div className="flex flex-col sm:flex-row gap-3">
        {FEATURED_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => router.push(`/ask?q=${encodeURIComponent(q)}`)}
            className="flex-1 flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-orange-500/5 text-left transition-all duration-200 group"
          >
            <Sparkles size={16} className="text-orange-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors leading-snug">
              {q}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
