"use client";

import { useEffect, useRef } from "react";
import { Howl } from "howler";
import { toast } from "sonner";
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
          onseek() {
            // HTML5 seek is async: howl.playing() briefly returns false while
            // the browser buffers, which kills the RAF tick. Restart it here,
            // after the seeked event confirms the position is set.
            cancelAnimationFrame(rafRef.current);
            if (usePlayerStore.getState().isPlaying) {
              startRaf(howl);
            }
          },
          onplay() {
            startRaf(howl);
          },
          onpause() {
            cancelAnimationFrame(rafRef.current);
          },
          onstop() {
            cancelAnimationFrame(rafRef.current);
          },
          onend() {
            cancelAnimationFrame(rafRef.current);
            // Record play on song completion (not on start) — guard against
            // repeat-one double-fires by checking lastPlayRef.
            if (song?.id) {
              const now = Date.now();
              const last = lastPlayRef.current;
              if (!last || last.songId !== song.id || now - last.time > 30_000) {
                lastPlayRef.current = { songId: song.id, time: now };
                recordPlay(song.id).catch(() => {});
              }
            }
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
            toast.error("Couldn't load this song");
            usePlayerStore.getState().next();
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
          // RAF restart is handled by the onseek callback once seek completes
          howl.seek(seekRequest);
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
