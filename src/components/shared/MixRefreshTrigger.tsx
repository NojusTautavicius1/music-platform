"use client";

import { useEffect } from "react";
import { triggerMixRefresh } from "@/app/actions/generateMixes";

type Props = {
  needsRefresh: boolean;
  kinds?: string[];
};

export function MixRefreshTrigger({ needsRefresh, kinds }: Props) {
  useEffect(() => {
    if (needsRefresh) {
      void triggerMixRefresh(kinds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsRefresh]);

  return null;
}
