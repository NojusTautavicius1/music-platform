"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Command } from "cmdk";
import {
  Plus,
  Moon,
  LogOut,
  Settings,
  Home,
  Search,
  Library,
  Heart,
  LayoutGrid,
  BarChart2,
  User,
  Music2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";
import { Title as RadixDialogTitle } from "@radix-ui/react-dialog";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";
import { globalSearch, getRecentPlays } from "@/app/actions/search";
import { useUIStore } from "@/store/uiStore";

const SESSION_KEY = "command-palette:last-query";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string | null;
  coverUrl?: string | null;
  audioUrl?: string | null;
  duration?: number | null;
  album?: string | null;
};

type SearchPayload = {
  songs: SearchResult[];
  playlists: SearchResult[];
  artists: SearchResult[];
  ownPlaylists: SearchResult[];
};

export function CommandPalette() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [results, setResults] = useState<SearchPayload>({
    songs: [],
    playlists: [],
    artists: [],
    ownPlaylists: [],
  });
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const quickActions = useMemo(
    () => [
      {
        id: "create-playlist",
        label: "Create new playlist",
        icon: Plus,
        action: () => {
          setOpen(false);
          setCreateOpen(true);
        },
      },
      {
        id: "toggle-theme",
        label: "Toggle theme",
        icon: Moon,
        action: () => {
          toast.message("Theme toggle coming soon");
          setOpen(false);
        },
      },
      {
        id: "sign-out",
        label: "Sign out",
        icon: LogOut,
        action: () => {
          signOut();
          setOpen(false);
        },
      },
      {
        id: "settings",
        label: "Go to settings",
        icon: Settings,
        action: () => {
          router.push("/settings");
          setOpen(false);
        },
      },
    ],
    [router, setOpen]
  );

  const filteredQuickActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    const lower = query.toLowerCase();
    return quickActions.filter((action) => action.label.toLowerCase().includes(lower));
  }, [query, quickActions]);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setQuery(stored);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, query);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    if (query.trim()) return;

    getRecentPlays()
      .then((rows) => setRecent(rows))
      .catch(() => setRecent([]));
  }, [open, query]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const isMod = isMac ? event.metaKey : event.ctrlKey;
      if (event.key.toLowerCase() === "k" && isMod) {
        const target = event.target as HTMLElement | null;
        const isEditable =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;
        if (isEditable) return;
        event.preventDefault();
        setOpen(!useUIStore.getState().commandPaletteOpen);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ songs: [], playlists: [], artists: [], ownPlaylists: [] });
      return;
    }

    setLoading(true);
    const handle = window.setTimeout(() => {
      globalSearch(trimmed)
        .then((data) => setResults(data))
        .catch(() =>
          setResults({ songs: [], playlists: [], artists: [], ownPlaylists: [] })
        )
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [open, query]);

  function handlePlaySong(song: SearchResult) {
    if (!song.audioUrl || !song.duration) return;
    const playerSong: PlayerSong = {
      id: song.id,
      title: song.title,
      artist: song.subtitle ?? "Unknown",
      album: song.album ?? null,
      duration: song.duration,
      coverUrl: song.coverUrl ?? null,
      audioUrl: song.audioUrl,
    };

    usePlayerStore.getState().play(playerSong, [playerSong], "command-palette");
    setOpen(false);
  }

  return (
    <>
      <CreatePlaylistDialog open={createOpen} onOpenChange={setCreateOpen} />
      <Command.Dialog open={open} onOpenChange={setOpen} label="Command palette">
        <RadixDialogTitle className="sr-only">Command palette</RadixDialogTitle>
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Command
          className="fixed left-1/2 top-24 z-50 w-[90vw] max-w-[640px] -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1C] shadow-2xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <Command.Input
              placeholder="Search songs, playlists, artists..."
              value={query}
              onValueChange={setQuery}
              className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto px-2 py-2">
            {filteredQuickActions.length > 0 && (
              <Command.Group heading="Quick actions" className="px-2 py-1 text-xs text-zinc-500">
                {filteredQuickActions.map((action) => (
                  <Command.Item
                    key={action.id}
                    onSelect={action.action}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 aria-selected:bg-orange-500/10 aria-selected:text-white cursor-pointer transition-colors"
                  >
                    <action.icon size={18} className="text-zinc-400" />
                    <span className="flex-1">{action.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Action</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation" className="px-2 py-1 text-xs text-zinc-500">
              {[
                { label: "Home", icon: Home, href: "/" },
                { label: "Search", icon: Search, href: "/search" },
                { label: "Your Library", icon: Library, href: "/library" },
                { label: "Liked Songs", icon: Heart, href: "/library/liked" },
                { label: "Browse", icon: LayoutGrid, href: "/browse" },
                { label: "Stats", icon: BarChart2, href: "/stats" },
                { label: "Profile", icon: User, href: "/profile" },
              ].map((item) => (
                <Command.Item
                  key={item.label}
                  onSelect={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 aria-selected:bg-orange-500/10 aria-selected:text-white cursor-pointer transition-colors"
                >
                  <item.icon size={18} className="text-zinc-400" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Page</span>
                </Command.Item>
              ))}
            </Command.Group>

            {!query.trim() && recent.length > 0 && (
              <Command.Group heading="Recent" className="px-2 py-1 text-xs text-zinc-500">
                {recent.map((song) => (
                  <Command.Item
                    key={song.id}
                    onSelect={() => handlePlaySong(song)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 aria-selected:bg-orange-500/10 aria-selected:text-white cursor-pointer transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                      {song.coverUrl ? (
                        <Image src={song.coverUrl} alt="" width={24} height={24} className="w-full h-full object-cover" />
                      ) : (
                        <Music2 size={14} className="text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{song.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{song.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Song</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query.trim() && (
              <>
                {loading && (
                  <div className="px-3 py-2 text-xs text-zinc-500">Searching...</div>
                )}

                {results.songs.length > 0 && (
                  <Command.Group heading="Songs" className="px-2 py-1 text-xs text-zinc-500">
                    {results.songs.map((song) => (
                      <Command.Item
                        key={song.id}
                        onSelect={() => handlePlaySong(song)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 aria-selected:bg-orange-500/10 aria-selected:text-white cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                          {song.coverUrl ? (
                            <Image src={song.coverUrl} alt="" width={24} height={24} className="w-full h-full object-cover" />
                          ) : (
                            <Music2 size={14} className="text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{song.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{song.subtitle}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Song</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.playlists.length > 0 && (
                  <Command.Group heading="Playlists" className="px-2 py-1 text-xs text-zinc-500">
                    {results.playlists.map((playlist) => (
                      <Command.Item
                        key={playlist.id}
                        onSelect={() => {
                          router.push(`/library/playlist/${playlist.id}`);
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 aria-selected:bg-orange-500/10 aria-selected:text-white cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                          {playlist.coverUrl ? (
                            <Image src={playlist.coverUrl} alt="" width={24} height={24} className="w-full h-full object-cover" />
                          ) : (
                            <Music2 size={14} className="text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{playlist.title}</p>
                          {playlist.subtitle && (
                            <p className="text-xs text-zinc-500 truncate">{playlist.subtitle}</p>
                          )}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Playlist</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.ownPlaylists.length > 0 && (
                  <Command.Group heading="Your playlists" className="px-2 py-1 text-xs text-zinc-500">
                    {results.ownPlaylists.map((playlist) => (
                      <Command.Item
                        key={playlist.id}
                        onSelect={() => {
                          router.push(`/library/playlist/${playlist.id}`);
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 aria-selected:bg-orange-500/10 aria-selected:text-white cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                          {playlist.coverUrl ? (
                            <Image src={playlist.coverUrl} alt="" width={24} height={24} className="w-full h-full object-cover" />
                          ) : (
                            <Music2 size={14} className="text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{playlist.title}</p>
                          {playlist.subtitle && (
                            <p className="text-xs text-zinc-500 truncate">{playlist.subtitle}</p>
                          )}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Yours</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.artists.length > 0 && (
                  <Command.Group heading="Artists" className="px-2 py-1 text-xs text-zinc-500">
                    {results.artists.map((artist) => (
                      <Command.Item
                        key={artist.id}
                        onSelect={() => {
                          router.push(`/search/${encodeURIComponent(artist.title)}`);
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 aria-selected:bg-orange-500/10 aria-selected:text-white cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                          <User size={14} className="text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{artist.title}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Artist</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {!loading &&
                  results.songs.length === 0 &&
                  results.playlists.length === 0 &&
                  results.artists.length === 0 &&
                  results.ownPlaylists.length === 0 && (
                    <Command.Empty className="px-3 py-2 text-xs text-zinc-500">
                      No results found.
                    </Command.Empty>
                  )}
              </>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-zinc-500">
            <span>↑↓ navigate · ↵ select · esc close</span>
            <span className="text-zinc-600">Cmd/Ctrl + K</span>
          </div>
        </Command>
      </Command.Dialog>
    </>
  );
}
