"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  User,
  Settings,
  Menu,
  BarChart2,
  Command,
  Sparkles,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useUIStore } from "@/store/uiStore";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Props = {
  user: SessionUser | null;
  signOutAction?: () => Promise<void>;
};

export function TopBar({ user, signOutAction }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const debouncedQuery = useDebounce(query, 400);
  const mounted = useRef(false);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const initials = user
    ? (user.name ?? user.email ?? "?")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const q = debouncedQuery.trim();
    if (q) {
      startTransition(() =>
        router.push(`/search/${encodeURIComponent(q)}`)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search/${encodeURIComponent(q)}`);
  }

  return (
    <header className="h-16 shrink-0 flex items-center gap-2 md:gap-4 px-3 md:px-6 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Back / forward — desktop only */}
      <div className="hidden md:flex items-center gap-1 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => router.forward()}
          className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Go forward"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Search + Ask Sonara */}
      <form onSubmit={handleSearch} className="flex-1 flex justify-center">
        <div className="relative w-full md:max-w-100 flex items-center gap-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="flex-1 pl-9 bg-white/5 border-white/15 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/40 h-9 rounded-full"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 h-9 rounded-full border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Open command palette"
          >
            <Command size={12} />
            <span>⌘K</span>
          </button>
        </div>
      </form>

      {/* Ask Sonara pill — always visible */}
      <button
        type="button"
        onClick={() => router.push("/ask")}
        className="relative hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold text-white shrink-0 overflow-hidden"
        aria-label="Ask Sonara AI"
      >
        {/* animated gradient background */}
        <span className="absolute inset-0 bg-linear-to-r from-orange-500 via-pink-500 to-purple-500 opacity-90" />
        {/* subtle shimmer sweep */}
        <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer-slide_2.5s_ease-in-out_infinite]" />
        <Sparkles size={13} className="relative z-10 animate-pulse" />
        <span className="relative z-10">Ask Sonara</span>
      </button>

      {/* User avatar + dropdown OR guest sign-in — desktop only */}
      <div className="hidden md:block shrink-0">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                    <AvatarFallback className="bg-linear-to-br from-brand-orange to-brand-magenta text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="w-48 bg-[#18181F] border-white/10 text-zinc-100"
            >
              <div className="px-3 py-2 text-xs text-zinc-500 truncate">
                {user.email}
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={() => router.push("/profile")}
              >
                <User size={14} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={() => router.push("/stats")}
              >
                <BarChart2 size={14} />
                Stats
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={() => router.push("/settings")}
              >
                <Settings size={14} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={() => router.push("/ask")}
              >
                <Sparkles size={14} className="text-orange-400" />
                Ask Sonara
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              {signOutAction && (
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-red-400 focus:bg-white/10 focus:text-red-300"
                  onClick={() => startTransition(() => signOutAction())}
                >
                  <LogOut size={14} />
                  Sign out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="h-8 px-3 rounded-full border border-white/15 text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/30 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push("/login")}
              className="h-8 px-3 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
