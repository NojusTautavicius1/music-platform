import Link from "next/link";
import { GENRE_COLORS, BROWSE_GENRES } from "@/lib/genreColors";

export default function SearchPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-zinc-100 mb-8">Browse all</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {BROWSE_GENRES.map((genre) => {
          const config = GENRE_COLORS[genre];
          if (!config) return null;

          return (
            <Link
              key={genre}
              href={`/search/${encodeURIComponent(genre)}`}
              className="relative h-45 rounded-xl overflow-hidden bg-bg-surface border border-white/10 hover:border-[#FF5500]/50 hover:scale-[1.02] transition-all duration-200 group"
            >
              {/* Subtle orange glow on hover */}
              <div className="absolute inset-0 bg-linear-to-br from-[#FF5500]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-linear-to-b from-[#FF5500] to-[#FF5500]/20" />

              {/* Genre name */}
              <span className="absolute top-5 left-6 text-xl font-extrabold text-zinc-100 leading-tight group-hover:text-white transition-colors">
                {config.label}
              </span>

              {/* Small rotated album cover */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${genre}-art/80/80`}
                alt=""
                aria-hidden
                className="absolute bottom-3 right-3 w-16 h-16 rounded-md object-cover rotate-20 shadow-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-200"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
