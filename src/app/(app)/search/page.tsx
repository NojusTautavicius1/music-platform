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
              className={`relative h-[220px] rounded-xl overflow-hidden bg-linear-to-br ${config.gradient} hover:scale-[1.02] transition-transform duration-200`}
            >
              {/* Genre name */}
              <span className="absolute top-4 left-4 text-2xl font-extrabold text-white drop-shadow-md leading-tight">
                {config.label}
              </span>

              {/* Small rotated album cover */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${genre}-art/80/80`}
                alt=""
                aria-hidden
                className="absolute bottom-3 right-3 w-[72px] h-[72px] rounded-md object-cover rotate-[25deg] shadow-2xl"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
