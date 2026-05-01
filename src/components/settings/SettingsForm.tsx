"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlayerStore } from "@/store/playerStore";
import { updateDisplayName, updatePreferences, deleteAccount } from "@/app/actions/settings";


type Preferences = {
  defaultVolume: number;
  crossfadeSeconds: number;
  audioQuality: "auto" | "low" | "medium" | "high";
  autoPlayEnabled: boolean;
  emailNewPlaylists: boolean;
  emailWeekly: boolean;
  profilePublic: boolean;
  showActivity: boolean;
};

type Props = {
  name: string;
  email: string;
  preferences: Preferences;
};

type TabKey = "account" | "playback" | "notifications" | "privacy" | "about";

const TAB_LABELS: Array<{ key: TabKey; label: string }> = [
  { key: "account", label: "Account" },
  { key: "playback", label: "Playback" },
  { key: "notifications", label: "Notifications" },
  { key: "privacy", label: "Privacy" },
  { key: "about", label: "About" },
];

export function SettingsForm({ name, email, preferences }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("account");
  const [displayName, setDisplayName] = useState(name);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const setVolume = usePlayerStore((s) => s.setVolume);

  const [defaultVolume, setDefaultVolume] = useState(preferences.defaultVolume);
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(preferences.crossfadeSeconds);
  const [audioQuality, setAudioQuality] = useState<"auto" | "low" | "medium" | "high">(preferences.audioQuality);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(preferences.autoPlayEnabled);
  const [emailNewPlaylists, setEmailNewPlaylists] = useState(preferences.emailNewPlaylists);
  const [emailWeekly, setEmailWeekly] = useState(preferences.emailWeekly);
  const [profilePublic, setProfilePublic] = useState(preferences.profilePublic);
  const [showActivity, setShowActivity] = useState(preferences.showActivity);

  // Sync player volume to saved preference on mount
  useEffect(() => {
    setVolume(preferences.defaultVolume);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaveName() {
    startTransition(async () => {
      const result = await updateDisplayName(displayName.trim());
      if (result.ok) {
        toast.success("Display name updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleSavePreferences() {
    setVolume(defaultVolume);

    startTransition(async () => {
      const result = await updatePreferences({
        defaultVolume,
        crossfadeSeconds,
        audioQuality,
        autoPlayEnabled,
        emailNewPlaylists,
        emailWeekly,
        profilePublic,
        showActivity,
      });

      if (result.ok) {
        toast.success("Preferences saved");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteAccount() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  const qualityOptions = useMemo(
    () =>
      [
        { value: "auto", label: "Auto" },
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ] as const,
    []
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "account" && (
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Display name</label>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-white/5 border-white/10 text-zinc-100"
              />
              <button
                onClick={handleSaveName}
                disabled={isPending}
                className="px-5 py-2 rounded-full bg-white/10 text-zinc-100 hover:bg-white/20 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Email</label>
            <Input
              value={email}
              readOnly
              className="bg-white/5 border-white/10 text-zinc-500"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={() => setConfirmOpen(true)}
              className="px-5 py-2 rounded-full border border-red-500/40 text-red-400 hover:text-red-300 hover:border-red-400 transition-colors"
            >
              Delete account
            </button>
          </div>
        </section>
      )}

      {activeTab === "playback" && (
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-300">Default volume</p>
              <span className="text-sm text-zinc-500">{Math.round(defaultVolume * 100)}%</span>
            </div>
            <Slider
              value={[Math.round(defaultVolume * 100)]}
              max={100}
              onValueChange={(v) => {
                const pct = Array.isArray(v) ? v[0] : v;
                setDefaultVolume(pct / 100);
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-300">Crossfade duration</p>
              <span className="text-sm text-zinc-500">{crossfadeSeconds}s</span>
            </div>
            <Slider
              value={[crossfadeSeconds]}
              max={12}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v;
                setCrossfadeSeconds(next);
              }}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-zinc-300">Audio quality</p>
            <div className="grid gap-2">
              {qualityOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-zinc-300"
                >
                  <input
                    type="radio"
                    name="audioQuality"
                    checked={audioQuality === option.value}
                    onChange={() => setAudioQuality(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
            <div>
              <p className="text-sm text-zinc-200">Auto-play similar songs after queue ends</p>
              <p className="text-xs text-zinc-500">Recommended for uninterrupted listening</p>
            </div>
            <Switch checked={autoPlayEnabled} onCheckedChange={setAutoPlayEnabled} />
          </div>

          <button
            onClick={handleSavePreferences}
            className="px-5 py-2 rounded-full bg-white/10 text-zinc-100 hover:bg-white/20 transition-colors"
          >
            Save changes
          </button>
        </section>
      )}

      {activeTab === "notifications" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-3">
            <div>
              <p className="text-sm text-zinc-200">Email me about new playlists from artists I like</p>
              <p className="text-xs text-zinc-500">Occasional updates, no spam</p>
            </div>
            <Switch checked={emailNewPlaylists} onCheckedChange={setEmailNewPlaylists} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-3">
            <div>
              <p className="text-sm text-zinc-200">Weekly listening summary</p>
              <p className="text-xs text-zinc-500">A recap of your stats and trends</p>
            </div>
            <Switch checked={emailWeekly} onCheckedChange={setEmailWeekly} />
          </div>

          <button
            onClick={handleSavePreferences}
            className="px-5 py-2 rounded-full bg-white/10 text-zinc-100 hover:bg-white/20 transition-colors"
          >
            Save changes
          </button>
        </section>
      )}

      {activeTab === "privacy" && (
        <section className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">Profile visibility</p>
            <div className="grid gap-2">
              {[
                { value: "public", label: "Public" },
                { value: "private", label: "Private" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-zinc-300"
                >
                  <input
                    type="radio"
                    name="profileVisibility"
                    checked={profilePublic === (option.value === "public")}
                    onChange={() => setProfilePublic(option.value === "public")}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-3">
            <div>
              <p className="text-sm text-zinc-200">Show my listening activity to followers</p>
              <p className="text-xs text-zinc-500">Controls visibility of your play history</p>
            </div>
            <Switch checked={showActivity} onCheckedChange={setShowActivity} />
          </div>

          <button
            onClick={handleSavePreferences}
            className="px-5 py-2 rounded-full bg-white/10 text-zinc-100 hover:bg-white/20 transition-colors"
          >
            Save changes
          </button>
        </section>
      )}

      {activeTab === "about" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-sm text-zinc-200">Version</p>
            <p className="text-xs text-zinc-500">v0.1.0</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-sm text-zinc-200">GitHub</p>
            <a
              className="text-xs text-purple-300 hover:text-purple-200"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              github.com
            </a>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-sm text-zinc-200">Open source credits</p>
            <p className="text-xs text-zinc-500">Next.js, Prisma, Tailwind, shadcn/ui, Howler.js</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-sm text-zinc-200">Made by</p>
            <p className="text-xs text-zinc-500">Svetaines</p>
          </div>
        </section>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-500">
            This will delete your account and sign you out. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-full bg-white/5 text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-full bg-red-500/90 text-white"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
