"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Home, Search, Library, User, LogOut, Settings, LogIn, Upload, Sparkles, Heart, Music2, ListMusic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type UserStats = { liked: number; plays: number; playlists: number } | null;

type Props = {
  user: SessionUser | null;
  signOutAction?: () => Promise<void>;
};

const NAV_TABS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
] as const;

export function BottomNav({ user, signOutAction }: Props) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [stats, setStats] = useState<UserStats>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (profileOpen && user && !stats) {
      fetch("/api/user/stats")
        .then((r) => r.json())
        .then((d) => setStats(d))
        .catch(() => {});
    }
  }, [profileOpen, user, stats]);

  const initials = user
    ? (user.name ?? user.email ?? "?")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <nav className="max-md:flex hidden shrink-0 bg-[#18181F] border-t border-white/5 items-stretch h-14 safe-area-pb">
        {NAV_TABS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              pathname === href ? "text-[#FF5500]" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}

        {user && (
          <Link
            href="/ask"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              pathname === "/ask" ? "text-[#FF5500]" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Sparkles size={20} />
            <span>Ask</span>
          </Link>
        )}

        {user && (
          <Link
            href="/library"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              pathname === "/library" ? "text-[#FF5500]" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Library size={20} />
            <span>Library</span>
          </Link>
        )}

        {user ? (
          <button
            onClick={() => setProfileOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Profile"
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <LogIn size={20} />
            <span>Sign in</span>
          </Link>
        )}
      </nav>

      {user && (
        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
          <SheetContent
            side="bottom"
            className="bg-[#18181F] border-t border-white/10 text-zinc-100 gap-0 pb-8"
          >
            <SheetTitle className="sr-only">Profile</SheetTitle>

            <div className="flex items-center gap-3 px-2 py-4">
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-linear-to-br from-brand-orange to-brand-magenta text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 truncate">{user.name ?? "User"}</p>
                <p className="text-sm text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-2 px-2 pb-3">
                <div className="flex flex-col items-center gap-0.5 bg-white/5 rounded-xl py-2.5">
                  <Heart size={14} className="text-[#FF5500]" />
                  <span className="text-sm font-bold text-zinc-100">{stats.liked}</span>
                  <span className="text-[10px] text-zinc-500">Liked</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 bg-white/5 rounded-xl py-2.5">
                  <Music2 size={14} className="text-[#FF5500]" />
                  <span className="text-sm font-bold text-zinc-100">{stats.plays}</span>
                  <span className="text-[10px] text-zinc-500">Plays</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 bg-white/5 rounded-xl py-2.5">
                  <ListMusic size={14} className="text-[#FF5500]" />
                  <span className="text-sm font-bold text-zinc-100">{stats.playlists}</span>
                  <span className="text-[10px] text-zinc-500">Playlists</span>
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-2 space-y-1">
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 transition-colors"
              >
                <User size={18} />
                Profile
              </Link>
              <Link
                href="/upload"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Upload size={18} />
                Upload Music
              </Link>
              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg text-zinc-200 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings size={18} />
                Settings
              </Link>
              {signOutAction && (
                <button
                  onClick={() => startTransition(() => signOutAction!())}
                  className="flex items-center gap-3 w-full px-2 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
