"use client";

import { useEffect, useState } from "react";

// The one breakpoint the app forks mobile/desktop layouts on — same lg
// (1024px) tier the dashboard's Sidebar, AvailabilityPanel, and the
// pre-approval wizard all use, so "desktop" means the same thing
// everywhere it's checked.
const DESKTOP_BREAKPOINT_PX = 1024;

/**
 * null until the first effect runs (avoids a server/client mismatch on
 * first paint) — callers should treat null as "not decided yet" and render
 * nothing (or a neutral placeholder) rather than guessing.
 */
export function useIsDesktopViewport(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT_PX);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isDesktop;
}
