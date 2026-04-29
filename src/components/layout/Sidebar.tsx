import Link from "next/link";
import { Home, Search, Library, Plus, Heart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavItem } from "./NavItem";

export async function Sidebar() {
  const session = await auth();
  const email = session?.user?.email;

  const playlists = email
    ? await prisma.playlist.findMany({
        where: { user: { email } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, coverUrl: true },
      })
    : [];

  return (
    <aside className="w-[240px] shrink-0 bg-[#18181F] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 shrink-0">
        <Link href="/">
          <span className="text-2xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
            Sonara
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="px-3 space-y-1 shrink-0">
        <NavItem href="/" icon={<Home size={20} />}>
          Home
        </NavItem>
        <NavItem href="/search" icon={<Search size={20} />}>
          Search
        </NavItem>
        <NavItem href="/library" icon={<Library size={20} />}>
          Your Library
        </NavItem>
      </nav>

      <div className="mx-6 my-4 border-t border-white/5 shrink-0" />

      {/* Create + Liked */}
      <div className="px-3 space-y-1 shrink-0">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left text-sm font-medium">
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
            <Plus size={16} />
          </div>
          Create Playlist
        </button>

        <Link
          href="/library/liked"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shrink-0">
            <Heart size={14} fill="white" className="text-white" />
          </div>
          Liked Songs
        </Link>
      </div>

      <div className="mx-6 my-4 border-t border-white/5 shrink-0" />

      {/* Playlists */}
      <ScrollArea className="flex-1 px-3 pb-4">
        <div className="space-y-1">
          {playlists.length === 0 && (
            <p className="px-3 py-2 text-xs text-zinc-600">No playlists yet</p>
          )}
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/library/playlist/${playlist.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              {playlist.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  className="w-8 h-8 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-white/10 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                  {playlist.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">Playlist · by you</p>
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
