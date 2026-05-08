import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
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
import { WelcomeToast } from "@/components/auth/WelcomeToast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ?? null;

  // Redirect new users to onboarding (only on first sign-in, skip /welcome itself)
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? hdrs.get("x-forwarded-uri") ?? "";
  if (user?.email && pathname !== "/welcome") {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: (await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } }))?.id ?? "" },
      select: { onboardingCompleted: true },
    }).catch(() => null);
    if (prefs && !prefs.onboardingCompleted) {
      redirect("/welcome");
    }
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="h-screen flex flex-col text-zinc-100 overflow-hidden relative isolate">
      <AmbientBackground />
      <OfflineBanner />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-orange focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <MobileSidebarSheet>
        <SidebarContent isGuest={!user} />
      </MobileSidebarSheet>

      <div className="flex-1 flex min-h-0">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-hidden">
          <TopBar user={user} signOutAction={user ? handleSignOut : undefined} />
          <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-orange">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      <AudioEngineProvider />
      {user && <CommandPalette />}
      {user && <WelcomeToast userName={user.name?.split(" ")[0] ?? "there"} />}
      <QueuePanel />
      <BottomNav user={user} signOutAction={user ? handleSignOut : undefined} />
      <PlayerBar />
    </div>
  );
}
