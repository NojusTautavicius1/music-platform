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
  user: SessionUser;
  signOutAction: () => Promise<void>;
};

export function TopBar({ user, signOutAction }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const debouncedQuery = useDebounce(query, 400);
  const mounted = useRef(false);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 flex justify-center">
        <div className="relative w-full max-w-100">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="pl-9 bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#8B5CF6]/50 h-9 rounded-full"
          />
        </div>
      </form>

      {/* User avatar + dropdown — desktop only (mobile uses BottomNav profile tab) */}
      <div className="hidden md:block shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="bg-linear-to-br from-[#8B5CF6] to-[#EC4899] text-white text-xs font-semibold">
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
            <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white">
              <User size={14} />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white">
              <Settings size={14} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-red-400 focus:bg-white/10 focus:text-red-300"
              onClick={() => startTransition(() => signOutAction())}
            >
              <LogOut size={14} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
