import Link from "next/link";
import { Home, Search, Library, LayoutGrid, Plus, Heart, LogIn, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlaylistPlayCounts } from "@/lib/playCounts";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";
import { NavItem } from "./NavItem";
import { SidebarPlaylistList } from "./SidebarPlaylistList";

export async function SidebarContent({ isGuest = false }: { isGuest?: boolean }) {
  const session = isGuest ? null : await auth();
  const email = session?.user?.email;

  const [playlists, likedCount] = await Promise.all([
    email
      ? prisma.playlist.findMany({
          where: { user: { email } },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, name: true, coverUrl: true },
        })
      : [],
    email
      ? prisma.likedSong.count({ where: { user: { email } } })
      : 0,
  ]);

  const playCountMap = await getPlaylistPlayCounts(playlists.map((p) => p.id));
  const playlistsWithCounts = playlists.map((p) => ({
    ...p,
    playCount: playCountMap.get(p.id) ?? 0,
  }));

  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 shrink-0">
        <Link href="/">
          <span className="text-2xl font-bold bg-linear-to-r from-brand-orange to-brand-magenta bg-clip-text text-transparent">
            Sonara
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="px-3 space-y-1 shrink-0">
        <NavItem href="/" icon={<Home size={20} />}>Home</NavItem>
        <NavItem href="/search" icon={<Search size={20} />}>Search</NavItem>
        <NavItem href="/browse" icon={<LayoutGrid size={20} />}>Browse</NavItem>
        {!isGuest && (
          <NavItem href="/library" icon={<Library size={20} />}>Your Library</NavItem>
        )}
        {!isGuest && (
          <NavItem href="/upload" icon={<Upload size={20} />}>Upload Music</NavItem>
        )}
      </nav>

      {!isGuest && (
        <>
          <div className="mx-6 my-4 border-t border-white/5 shrink-0" />

          <div className="px-3 space-y-1 shrink-0">
            <CreatePlaylistDialog>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left text-sm font-medium">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <Plus size={16} />
                </div>
                Create Playlist
              </button>
            </CreatePlaylistDialog>

            <Link
              href="/library/liked"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <div className="w-8 h-8 rounded bg-linear-to-br from-brand-orange to-brand-magenta flex items-center justify-center shrink-0">
                <Heart size={14} fill="white" className="text-white" />
              </div>
              <span className="flex-1 min-w-0 truncate">Liked Songs</span>
              {likedCount > 0 && (
                <span className="text-xs text-zinc-600 shrink-0">{likedCount}</span>
              )}
            </Link>
          </div>

          <div className="mx-6 my-4 border-t border-white/5 shrink-0" />

          <ScrollArea className="flex-1 px-3 pb-4">
            <SidebarPlaylistList playlists={playlistsWithCounts} />
          </ScrollArea>
        </>
      )}

      {isGuest && (
        <div className="mt-auto px-4 pb-6 shrink-0">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-sm text-zinc-300 font-medium">Create your library</p>
            <p className="text-xs text-zinc-500">Sign in to save songs, build playlists, and get personalized mixes.</p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full h-9 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <LogIn size={14} />
              Sign in
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
