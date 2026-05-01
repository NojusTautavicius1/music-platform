import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-500 mt-2">Tune your playback and privacy experience.</p>
      </div>

      <SettingsForm
        name={session.user.name ?? ""}
        email={session.user.email}
      />
    </div>
  );
}
