import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/shared/PageTransition";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarContent } from "@/components/layout/SidebarContent";
import { TopBar } from "@/components/layout/TopBar";
import { PlayerBar } from "@/components/layout/PlayerBar";
import { AudioEngineProvider } from "@/components/layout/AudioEngineProvider";
import { MobileSidebarSheet } from "@/components/layout/MobileSidebarSheet";
import { BottomNav } from "@/components/layout/BottomNav";
import { QueuePanel } from "@/components/layout/QueuePanel";
import { CommandPalette } from "@/components/CommandPalette";
import { AmbientBackground } from "@/components/shared/AmbientBackground";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-zinc-100 overflow-hidden relative">
      <AmbientBackground />
      <OfflineBanner />
      {/* Skip to main content — screen readers / keyboard */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-orange focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Mobile sidebar sheet — lg+ users never see this */}
      <MobileSidebarSheet>
        <SidebarContent />
      </MobileSidebarSheet>

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar — hidden on < lg */}
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0">
          <TopBar user={session.user} signOutAction={handleSignOut} />
          <main id="main-content" className="flex-1 overflow-y-auto scrollbar-orange">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      <AudioEngineProvider />
      <CommandPalette />
      {/* QueuePanel floats over content — does not push layout */}
      <QueuePanel />
      {/* Bottom nav sits above PlayerBar on mobile */}
      <BottomNav user={session.user} signOutAction={handleSignOut} />
      <PlayerBar />
    </div>
  );
}
