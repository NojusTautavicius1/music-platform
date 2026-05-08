"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getColorSync } from "colorthief";

const DEFAULT_FALLBACK = "rgb(124, 58, 237)";

type Props = {
  coverUrl: string;
  fallback?: string;
  children?: ReactNode;
  className?: string;
};

export function CoverGradient({ coverUrl, fallback, children, className }: Props) {
  const [color, setColor] = useState<string>(fallback ?? DEFAULT_FALLBACK);
  const mountedRef = useRef(false);

  const cacheKey = useMemo(() => `cover-color:${coverUrl}`, [coverUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!coverUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColor(fallback ?? DEFAULT_FALLBACK);
      return;
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setColor(cached);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;

    const handleLoad = () => {
      try {
        const color = getColorSync(img);
        if (!color) throw new Error("No color extracted");
        const { r, g, b } = color.rgb();
        const rgb = `rgb(${r}, ${g}, ${b})`;
        localStorage.setItem(cacheKey, rgb);
        if (mountedRef.current) setColor(rgb);
      } catch {
        if (mountedRef.current) setColor(fallback ?? DEFAULT_FALLBACK);
      }
    };

    const handleError = () => {
      if (mountedRef.current) setColor(fallback ?? DEFAULT_FALLBACK);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [coverUrl, cacheKey, fallback]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        "--cover-gradient": color,
      } as CSSProperties}
    >
      <div
        className="absolute inset-x-0 top-0 pointer-events-none h-80"
        style={{
          background: "linear-gradient(180deg, var(--cover-gradient) 0%, transparent 100%)",
          mixBlendMode: "screen",
          opacity: 0.4,
        }}
      />
      {children}
    </div>
  );
}
