"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

/** Auto-logout after 30 minutes of inactivity on System surface */
export function IdleLogout({ minutes = 30 }: { minutes?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const ms = minutes * 60 * 1000;

    function reset() {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login?system=1&reason=idle");
        router.refresh();
      }, ms);
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [minutes, router]);

  return null;
}
