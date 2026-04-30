import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { PlayerBar } from "@/components/layout/PlayerBar";
import { AudioEngineProvider } from "@/components/layout/AudioEngineProvider";

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
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <TopBar user={session.user} signOutAction={handleSignOut} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <AudioEngineProvider />
      <PlayerBar />
    </div>
  );
}
