"use client";

import { useEffect, useRef } from "react";
import { Howl } from "howler";
import { usePlayerStore } from "@/store/playerStore";
import { recordPlay } from "@/app/actions/playHistory";

export function useAudioEngine() {
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number>(0);
  // { songId, time } — used to throttle duplicate play records
  const lastPlayRef = useRef<{ songId: string; time: number } | null>(null);

  useEffect(() => {
    function startRaf(howl: Howl) {
      const tick = () => {
        if (howlRef.current !== howl || !howl.playing()) return;
        const dur = howl.duration();
        const pos = howl.seek() as number;
        if (dur > 0) {
          usePlayerStore.getState().setProgress(pos / dur);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    // Song change → unload old Howl, create new one
    const unsubSong = usePlayerStore.subscribe(
      (s) => s.currentSong,
      (song) => {
        cancelAnimationFrame(rafRef.current);
        if (howlRef.current) {
          howlRef.current.unload();
          howlRef.current = null;
        }

        if (!song?.audioUrl) {
          usePlayerStore.getState().setProgress(0);
          usePlayerStore.getState().setDuration(0);
          return;
        }

        const { isPlaying, volume } = usePlayerStore.getState();

        const howl = new Howl({
          src: [song.audioUrl],
          // html5: true avoids Web Audio API autoplay restrictions on most browsers.
          // If audio still refuses to start, the user must interact with the page first
          // (clicking play satisfies the browser's autoplay policy).
          html5: true,
          volume,
          autoplay: isPlaying,
          onload() {
            usePlayerStore.getState().setDuration(howl.duration());
          },
          onplay() {
            startRaf(howl);
            // Record fresh start only (position near 0 = not a resume after pause)
            const pos = howl.seek() as number;
            if (pos < 1 && song?.id) {
              const now = Date.now();
              const last = lastPlayRef.current;
              if (!last || last.songId !== song.id || now - last.time > 30_000) {
                lastPlayRef.current = { songId: song.id, time: now };
                recordPlay(song.id).catch(() => {});
              }
            }
          },
          onpause() {
            cancelAnimationFrame(rafRef.current);
          },
          onstop() {
            cancelAnimationFrame(rafRef.current);
          },
          onend() {
            cancelAnimationFrame(rafRef.current);
            const { repeatMode } = usePlayerStore.getState();
            if (repeatMode === "one") {
              howl.seek(0);
              howl.play();
            } else {
              usePlayerStore.getState().next();
            }
          },
          onloaderror(_id, err) {
            console.error("[AudioEngine] load error:", err);
          },
        });

        howlRef.current = howl;
      }
    );

    // isPlaying toggle → play or pause the current Howl
    const unsubPlaying = usePlayerStore.subscribe(
      (s) => s.isPlaying,
      (isPlaying) => {
        const howl = howlRef.current;
        if (!howl) return;
        if (isPlaying && !howl.playing()) {
          howl.play();
        } else if (!isPlaying && howl.playing()) {
          howl.pause();
        }
      }
    );

    // Volume change → update Howl volume
    const unsubVolume = usePlayerStore.subscribe(
      (s) => s.volume,
      (volume) => {
        howlRef.current?.volume(volume);
      }
    );

    // Seek request → seek the Howl and clear the request
    const unsubSeek = usePlayerStore.subscribe(
      (s) => s.seekRequest,
      (seekRequest) => {
        if (seekRequest === null) return;
        const howl = howlRef.current;
        if (howl) {
          howl.seek(seekRequest);
          // Use store's isPlaying — howl.playing() can briefly return false
          // during an async HTML5 seek, which would stop the RAF
          cancelAnimationFrame(rafRef.current);
          if (usePlayerStore.getState().isPlaying) {
            startRaf(howl);
          }
        }
        usePlayerStore.getState().clearSeekRequest();
      }
    );

    return () => {
      unsubSong();
      unsubPlaying();
      unsubVolume();
      unsubSeek();
      cancelAnimationFrame(rafRef.current);
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
  }, []);
}
