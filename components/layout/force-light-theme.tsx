"use client";

import { useEffect } from "react";

/**
 * Marketing site is always the light MernCrest logo theme.
 * Strips any `.dark` class while a marketing page is mounted, without
 * touching next-themes state used by other surfaces (e.g. admin console).
 */
export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      if (hadDark) {
        root.classList.add("dark");
        root.style.colorScheme = "";
      }
    };
  }, []);

  return null;
}
