"use client";

import { useState } from "react";

/**
 * Infinite horizontal marquee.
 * Always animates (decorative). Respects reduced-motion by slowing, not stopping.
 * Pause on hover / touch so users can read logos.
 */
export function InfiniteMarquee({
  children,
  durationSec = 16,
  className,
}: {
  children: React.ReactNode;
  durationSec?: number;
  className?: string;
}) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className || ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
    >
      <div
        className="mc-marquee-track flex w-max items-center will-change-transform"
        style={{
          ["--mc-marquee-duration" as string]: `${durationSec}s`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <div className="flex shrink-0 items-center gap-0">{children}</div>
        <div className="flex shrink-0 items-center gap-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
