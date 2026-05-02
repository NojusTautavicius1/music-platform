import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/SettingsForm";

export type Attribution = { license: string; licenseAttribution: string };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const [user, rawAttributions] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, preferences: true },
    }),
    prisma.song.findMany({
      where: {
        licenseAttribution: { not: null },
        license: { not: null },
      },
      distinct: ["licenseAttribution"],
      select: { license: true, licenseAttribution: true },
      orderBy: { licenseAttribution: "asc" },
    }),
  ]);
  if (!user) redirect("/login");

  const attributions: Attribution[] = (rawAttributions as Array<{ license: string | null; licenseAttribution: string | null }>)
    .filter((r): r is Attribution => r.license !== null && r.licenseAttribution !== null);

  const p = user.preferences;
  const preferences = {
    defaultVolume:     p?.defaultVolume     ?? 0.7,
    crossfadeSeconds:  p?.crossfadeSeconds  ?? 0,
    audioQuality:      (p?.audioQuality     ?? "auto") as "auto" | "low" | "medium" | "high",
    autoPlayEnabled:   p?.autoPlayEnabled   ?? true,
    emailNewPlaylists: p?.emailNewPlaylists ?? true,
    emailWeekly:       p?.emailWeekly       ?? true,
    profilePublic:     p?.profilePublic     ?? true,
    showActivity:      p?.showActivity      ?? true,
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-500 mt-2">Tune your playback and privacy experience.</p>
      </div>

      <SettingsForm
        name={user.name ?? ""}
        email={session.user.email}
        preferences={preferences}
        attributions={attributions}
      />
    </div>
  );
}
