"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, Search, Music, User as UserIcon, Disc3, Plus } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDuration, formatPlayCount } from "@/lib/format";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { addSongToPlaylist } from "@/app/actions/playlist";

// ─── Types ────────────────────────────────────────────────────────────────────

type SongResult = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
  waveformPeaks?: number[] | null;
  playCount?: number;
};

type PlaylistResult = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  _count: { songs: number };
  playCount?: number;
};

type UserPlaylist = {
  id: string;
  name: string;
};

type Props = {
  query: string;
  tab: string;
  songs: SongResult[];
  playlists: PlaylistResult[];
  artists: { name: string; monthlyListeners: number }[];
  userPlaylists: UserPlaylist[];
  songCount: number;
  songPage: number;
};

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",       label: "All"       },
  { key: "songs",     label: "Songs"     },
  { key: "artists",   label: "Artists"   },
  { key: "albums",    label: "Albums"    },
  { key: "playlists", label: "Playlists" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Small helpers ────────────────────────────────────────────────────────────

function CoverThumb({
  src,
  alt,
  rounded = false,
}: {
  src: string | null;
  alt: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-10 h-10 shrink-0 overflow-hidden bg-white/10",
        rounded ? "rounded-full" : "rounded"
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes="40px" className="object-cover" />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/30 to-[#EC4899]/30" />
      )}
    </div>
  );
}

function SongRow({
  song,
  index,
  queue,
  compact = false,
  userPlaylists,
  showAdd,
}: {
  song: SongResult;
  index: number;
  queue: PlayerSong[];
  compact?: boolean;
  userPlaylists: UserPlaylist[];
  showAdd?: boolean;
}) {
  const play = usePlayerStore((s) => s.play);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const [addOpen, setAddOpen] = useState(false);

  const isActive = currentSong?.id === song.id;
  const isCurrentlyPlaying = isActive && isPlaying;

  function handleClick() {
    const ps: PlayerSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: song.coverUrl,
      audioUrl: song.audioUrl,
      waveformPeaks: song.waveformPeaks,
      playCount: song.playCount,
    };
    if (isActive) {
      togglePlay();
    } else {
      play(ps, queue);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-colors",
        "hover:bg-white/5",
        isActive && "bg-white/5"
      )}
    >
      {/* Index / play icon */}
      {!compact && (
        <span className="w-5 text-center text-xs text-zinc-500 group-hover:hidden">
          {isCurrentlyPlaying ? (
            <span className="text-[#8B5CF6]">▶</span>
          ) : (
            index + 1
          )}
        </span>
      )}
      {!compact && (
        <Play
          size={12}
          fill="white"
          className="w-5 hidden group-hover:block text-white shrink-0"
        />
      )}

      <CoverThumb src={song.coverUrl} alt={song.title} />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-[#8B5CF6]" : "text-zinc-100"
          )}
        >
          {song.title}
        </p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 truncate">
            <Play size={10} className="shrink-0 text-zinc-600" fill="currentColor" />
            <span>{formatPlayCount(song.playCount ?? 0)} plays</span>
          </p>
      </div>

      {showAdd && userPlaylists.length > 0 && (
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger
            render={
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Add to playlist"
              >
                <Plus size={14} />
              </button>
            }
          />
          <PopoverContent
            sideOffset={8}
            className="w-52 p-2 bg-[#18181F] border-white/10 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-2 pb-1">
              Add to playlist
            </p>
            <div className="max-h-52 overflow-y-auto">
              {userPlaylists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={async () => {
                    const result = await addSongToPlaylist(pl.id, song.id);
                    if (result.ok) {
                      toast.success(`Added to ${result.playlistName}`);
                      setAddOpen(false);
                    } else {
                      toast.error(result.error);
                    }
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-sm text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  {pl.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      <span className="text-xs text-zinc-500 tabular-nums shrink-0">
        {formatDuration(song.duration)}
      </span>
    </div>
  );
}

// ─── Top result card ──────────────────────────────────────────────────────────

function TopResultCard({
  songs,
  playlists,
}: {
  songs: SongResult[];
  playlists: PlaylistResult[];
}) {
  const play = usePlayerStore((s) => s.play);

  if (playlists.length > 0) {
    const p = playlists[0];
    return (
      <Link
        href={`/library/playlist/${p.id}`}
        className="group flex flex-col gap-4 p-5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors w-full"
      >
        <div className="relative w-28 h-28 rounded-lg overflow-hidden shadow-2xl shrink-0">
          {p.coverUrl ? (
            <Image src={p.coverUrl} alt={p.name} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/40 to-[#EC4899]/40 flex items-center justify-center">
              <Music size={32} className="text-white/50" />
            </div>
          )}
        </div>
        <div>
          <p className="text-xl font-bold text-zinc-100 leading-tight line-clamp-2">
            {p.name}
          </p>
          <p className="text-sm text-zinc-400 mt-1">Playlist</p>
        </div>
      </Link>
    );
  }

  if (songs.length > 0) {
    const s = songs[0];
    const ps: PlayerSong = {
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: s.duration,
      coverUrl: s.coverUrl,
      audioUrl: s.audioUrl,
      waveformPeaks: s.waveformPeaks,
    };
    const queue = songs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: song.coverUrl,
      audioUrl: song.audioUrl,
      waveformPeaks: song.waveformPeaks,
    }));

    return (
      <button
        onClick={() => play(ps, queue)}
        className="group flex flex-col gap-4 p-5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors w-full text-left"
      >
        <div className="relative w-28 h-28 rounded-lg overflow-hidden shadow-2xl shrink-0">
          {s.coverUrl ? (
            <Image src={s.coverUrl} alt={s.title} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/40 to-[#EC4899]/40 flex items-center justify-center">
              <Music size={32} className="text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-lg">
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>
        <div>
          <p className="text-xl font-bold text-zinc-100 leading-tight line-clamp-2">
            {s.title}
          </p>
          <p className="text-sm text-zinc-400 mt-1">{s.artist} · Song</p>
        </div>
      </button>
    );
  }

  return null;
}

// ─── Artist card ──────────────────────────────────────────────────────────────

function ArtistCard({ name, monthlyListeners }: { name: string; monthlyListeners: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-default">
      <div className="w-24 h-24 rounded-full bg-linear-to-br from-[#8B5CF6]/50 to-[#EC4899]/50 flex items-center justify-center shadow-lg">
        <span className="text-2xl font-bold text-white">{initials}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-100 truncate max-w-[120px]">{name}</p>
        <p className="text-xs text-zinc-500">Artist</p>
        <p className="text-xs text-zinc-600 mt-1">{formatPlayCount(monthlyListeners)} monthly listeners</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SearchResultsView({
  query,
  tab,
  songs,
  playlists,
  artists,
  userPlaylists,
  songCount,
  songPage,
}: Props) {
  const pathname = usePathname();
  const activeTab: TabKey = TABS.some((t) => t.key === tab)
    ? (tab as TabKey)
    : "all";

  const hasAny = songs.length > 0 || playlists.length > 0 || artists.length > 0;

  const songQueue: PlayerSong[] = songs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.duration,
    coverUrl: s.coverUrl,
    audioUrl: s.audioUrl,
    waveformPeaks: s.waveformPeaks,
    playCount: s.playCount,
  }));

  const showLoadMore = activeTab === "songs" && songs.length < songCount;

  return (
    <div className="pb-12">
      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <div className="px-8 pt-6 flex items-center gap-1 border-b border-white/5">
        {TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={`${pathname}?tab=${key}`}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors",
              activeTab === key
                ? "text-zinc-100 border-b-2 border-[#8B5CF6] -mb-px"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="px-8 pt-6">
        {/* ── No results ──────────────────────────────────────────── */}
        {!hasAny ? (
          <EmptyState
            icon={<Search size={52} />}
            title={`No matches for "${query}"`}
            description="Try different keywords or check the spelling."
          />
        ) : activeTab === "all" ? (
          /* ── All tab ──────────────────────────────────────────── */
          <div className="space-y-10">
            {/* Top row: top result + song list */}
            {(songs.length > 0 || playlists.length > 0) && (
              <div className="flex gap-6">
                {/* Top result */}
                <div className="w-[280px] shrink-0">
                  <h2 className="text-lg font-bold text-zinc-100 mb-4">Top result</h2>
                  <TopResultCard songs={songs} playlists={playlists} />
                </div>

                {/* Songs mini-list */}
                {songs.length > 0 && (
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-zinc-100 mb-4">Songs</h2>
                    <div className="space-y-0.5">
                      {songs.slice(0, 4).map((song, i) => (
                        <SongRow
                          key={song.id}
                          song={song}
                          index={i}
                          queue={songQueue}
                          userPlaylists={userPlaylists}
                          showAdd={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Artists strip */}
            {artists.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-zinc-100 mb-4">Artists</h2>
                <div className="flex gap-2 flex-wrap">
                  {artists.slice(0, 6).map((artist) => (
                    <ArtistCard key={artist.name} name={artist.name} monthlyListeners={artist.monthlyListeners} />
                  ))}
                </div>
              </div>
            )}

            {/* Playlists strip */}
            {playlists.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-zinc-100 mb-4">Playlists</h2>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3">
                  {playlists.map((p) => (
                    <div key={p.id} className="shrink-0">
                      <PlaylistCard
                        id={p.id}
                        title={p.name}
                        subtitle={
                          p._count.songs === 0
                            ? "Empty playlist"
                            : `${p._count.songs} song${p._count.songs === 1 ? "" : "s"}`
                        }
                        coverUrl={p.coverUrl}
                        size="md"
                        playCount={p.playCount}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "songs" ? (
          /* ── Songs tab ────────────────────────────────────────── */
          songs.length === 0 ? (
            <EmptyState
              icon={<Music size={48} />}
              title="No songs found"
              description={`No songs match "${query}".`}
            />
          ) : (
            <div className="space-y-3 max-w-3xl">
              <div className="space-y-0.5">
                {songs.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={i}
                    queue={songQueue}
                    userPlaylists={userPlaylists}
                    showAdd
                  />
                ))}
              </div>
              {showLoadMore && (
                <Link
                  href={`${pathname}?tab=songs&page=${songPage + 1}`}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Load more
                </Link>
              )}
            </div>
          )
        ) : activeTab === "artists" ? (
          /* ── Artists tab ──────────────────────────────────────── */
          artists.length === 0 ? (
            <EmptyState
              icon={<UserIcon size={48} />}
              title="No artists found"
              description={`No artists match "${query}".`}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {artists.map((artist) => (
                <ArtistCard key={artist.name} name={artist.name} monthlyListeners={artist.monthlyListeners} />
              ))}
            </div>
          )
        ) : activeTab === "albums" ? (
          /* ── Albums tab ───────────────────────────────────────── */
          <EmptyState
            icon={<Disc3 size={48} />}
            title="Albums coming soon"
            description="Album browsing will be available in a future update."
          />
        ) : activeTab === "playlists" ? (
          /* ── Playlists tab ────────────────────────────────────── */
          playlists.length === 0 ? (
            <EmptyState
              icon={<Music size={48} />}
              title="No playlists found"
              description={`No public playlists match "${query}".`}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.map((p) => (
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
                  playCount={p.playCount}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
