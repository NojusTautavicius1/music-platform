import { AmbientBackground } from "@/components/shared/AmbientBackground";
import { PlayerBar } from "@/components/layout/PlayerBar";
import { AudioEngineProvider } from "@/components/layout/AudioEngineProvider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-zinc-100 relative">
      <AmbientBackground />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-orange focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <AudioEngineProvider />
      <PlayerBar />
    </div>
  );
}
