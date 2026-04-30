import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarContent } from "@/components/layout/SidebarContent";
import { TopBar } from "@/components/layout/TopBar";
import { PlayerBar } from "@/components/layout/PlayerBar";
import { AudioEngineProvider } from "@/components/layout/AudioEngineProvider";
import { MobileSidebarSheet } from "@/components/layout/MobileSidebarSheet";
import { BottomNav } from "@/components/layout/BottomNav";
import { QueuePanel } from "@/components/layout/QueuePanel";

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
    <div className="h-screen flex flex-col bg-[#0A0A0F] text-zinc-100 overflow-hidden">
      {/* Mobile sidebar sheet — lg+ users never see this */}
      <MobileSidebarSheet>
        <SidebarContent />
      </MobileSidebarSheet>

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar — hidden on < lg */}
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-0">
          <TopBar user={session.user} signOutAction={handleSignOut} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      <AudioEngineProvider />
      {/* QueuePanel floats over content — does not push layout */}
      <QueuePanel />
      {/* Bottom nav sits above PlayerBar on mobile */}
      <BottomNav user={session.user} signOutAction={handleSignOut} />
      <PlayerBar />
    </div>
  );
}
