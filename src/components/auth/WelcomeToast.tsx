"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const KEY = "sonara.welcomed";

type Props = { userName: string };

export function WelcomeToast({ userName }: Props) {
  useEffect(() => {
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, "1");
      toast(`Welcome to Sonara, ${userName}! 🎵`);
    }
  }, [userName]);

  return null;
}
