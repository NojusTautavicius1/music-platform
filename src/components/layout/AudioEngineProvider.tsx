"use client";

import { useAudioEngine } from "@/hooks/useAudioEngine";

export function AudioEngineProvider() {
  useAudioEngine();
  return null;
}
