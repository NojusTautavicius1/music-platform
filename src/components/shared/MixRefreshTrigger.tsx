"use client";

import { useEffect } from "react";
import { triggerMixRefresh } from "@/app/actions/generateMixes";

type Props = {
  needsRefresh: boolean;
};

export function MixRefreshTrigger({ needsRefresh }: Props) {
  useEffect(() => {
    if (needsRefresh) {
      void triggerMixRefresh();
    }
  }, [needsRefresh]);

  return null;
}
