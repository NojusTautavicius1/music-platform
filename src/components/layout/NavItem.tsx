"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

export function NavItem({ href, icon, children }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-orange/5 text-[#FF5500] border-l-[3px] border-brand-orange"
          : "text-zinc-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
