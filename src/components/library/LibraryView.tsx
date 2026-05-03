"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";
import { Plus, LayoutGrid, List, ChevronDown, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LibraryPlaylist = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { songs: number };
  playCount?: number;
};

type SortMode = "recent" | "alpha";
type FilterMode = "all" | "playlists";
type ViewMode = "grid" | "list";


// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
  disabled,
  disabledTitle,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  const chip = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 py-1 rounded-full text-sm font-medium transition-colors",
        active
          ? "bg-white text-[#0A0A0F]"
          : "bg-white/10 text-zinc-300 hover:bg-white/15",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );

  if (disabled && disabledTitle) {
    return <div title={disabledTitle}>{chip}</div>;
  }
  return chip;
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { playlists: LibraryPlaylist[] };

export function LibraryView({ playlists }: Props) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [view, setView] = useState<ViewMode>("grid");

  const sortLabel = sort === "recent" ? "Recently added" : "Alphabetical";

  const sorted = useMemo(() => {
    const arr = [...playlists];
    if (sort === "alpha") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return arr;
  }, [playlists, sort]);

  // filter is effectively always 'playlists' since albums/artists are disabled
  const displayed = filter === "all" || filter === "playlists" ? sorted : [];

  return (
    <div className="pb-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-zinc-100">Your Library</h1>
          <CreatePlaylistDialog>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Create playlist"
            >
              <Plus size={18} />
            </button>
          </CreatePlaylistDialog>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sm text-zinc-300 hover:text-zinc-100 transition-colors">
                  {sortLabel}
                  <ChevronDown size={14} />
                </button>
              }
            />
            <DropdownMenuContent
              side="bottom"
              align="end"
              className="w-44 bg-[#18181F] border-white/10 text-zinc-100"
            >
              <DropdownMenuItem
                className="cursor-pointer focus:bg-white/10 focus:text-white"
                onClick={() => setSort("recent")}
              >
                Recently added
                {sort === "recent" && (
                  <span className="ml-auto text-brand-orange">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-white/10 focus:text-white"
                onClick={() => setSort("alpha")}
              >
                Alphabetical
                {sort === "alpha" && (
                  <span className="ml-auto text-brand-orange">✓</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center rounded-full bg-white/5 p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                view === "grid"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                view === "list"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter chips ────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 pt-4 flex items-center gap-2">
        <FilterChip
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterChip
          label="Playlists"
          active={filter === "playlists"}
          onClick={() => setFilter("playlists")}
        />
        <FilterChip
          label="Albums"
          disabled
          disabledTitle="Coming soon"
        />
        <FilterChip
          label="Artists"
          disabled
          disabledTitle="Coming soon"
        />
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <EmptyState
          icon={<Music2 size={56} />}
          title="Your library is quiet"
          description="Create your first playlist to start curating"
          action={
            <CreatePlaylistDialog>
              <button className="px-5 py-2.5 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                Create Playlist
              </button>
            </CreatePlaylistDialog>
          }
        />
      ) : view === "grid" ? (
        <div className="px-4 md:px-8 pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
          {displayed.map((p) => (
            <PlaylistCard
              key={p.id}
              id={p.id}
              title={p.name}
              subtitle={
                p._count.songs === 0
                  ? "Empty playlist"
                  : `${p._count.songs} song${p._count.songs === 1 ? "" : "s"}`
              }
              coverUrl={p.coverUrl}
              size="md"
              fluid
              playCount={p.playCount}
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="px-8 pt-6 space-y-1">
          {displayed.map((p) => (
            <a
              key={p.id}
              href={`/library/playlist/${p.id}`}
              className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="relative w-12 h-12 rounded shrink-0 overflow-hidden">
                {p.coverUrl ? (
                  <Image
                    src={p.coverUrl}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0A0A0F] border border-white/5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                  {p.name}
                </p>
                <p className="text-xs text-zinc-500">
                  Playlist ·{" "}
                  {p._count.songs === 0
                    ? "Empty"
                    : `${p._count.songs} song${p._count.songs === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-0.5 shrink-0 text-right">
                {typeof p.playCount === "number" && p.playCount > 0 && (
                  <span className="text-xs text-zinc-600">▶ {p.playCount.toLocaleString()}</span>
                )}
                {p.isPublic && (
                  <span className="text-xs text-zinc-600">Public</span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

    </div>
  );
}
