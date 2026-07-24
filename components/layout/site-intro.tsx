"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const INTRO_KEY = "mc-intro-v1";

/**
 * Animated brand intro shown once per session when merncrest.lk opens.
 * Light-theme only, decorative (aria-hidden), and respects reduced motion.
 */
export function SiteIntro() {
  const [visible, setVisible] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      seen = false;
    }

    if (seen) {
      setVisible(false);
      return;
    }

    document.body.style.overflow = "hidden";

    // Short splash — long waits felt like a slow site, especially on mobile/Sri Lanka latency.
    const MIN_MS = 1800;
    const MAX_MS = 6000;
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    let done = false;
    let dismissTimer: ReturnType<typeof setTimeout>;

    const finish = () => {
      if (done) return;
      done = true;
      setVisible(false);
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    const now = () =>
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const scheduleDismiss = () => {
      const remaining = Math.max(0, MIN_MS - (now() - start));
      dismissTimer = setTimeout(finish, remaining);
    };

    if (document.readyState === "complete") {
      scheduleDismiss();
    } else {
      window.addEventListener("load", scheduleDismiss, { once: true });
    }

    const capTimer = setTimeout(finish, MAX_MS);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(capTimer);
      window.removeEventListener("load", scheduleDismiss);
      document.body.style.overflow = "";
    };
  }, [reduce]);

  return (
    <AnimatePresence onExitComplete={() => (document.body.style.overflow = "")}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          aria-hidden
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_25%_30%,rgba(37,99,235,0.10),transparent_45%),radial-gradient(circle_at_78%_72%,rgba(219,39,119,0.10),transparent_45%)]"
          />

          <motion.div
            className="relative flex flex-col items-center gap-7 px-6"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.86, filter: "blur(8px)" }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }
            }
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src="/logo-merncrest.png"
              alt="MernCrest Solutions"
              width={420}
              height={334}
              priority
              className="h-auto w-[220px] sm:w-[280px]"
            />

            {!reduce && (
              <div className="relative h-1 w-40 overflow-hidden rounded-full bg-slate-200/80">
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-accent"
                  initial={{ x: "-120%" }}
                  animate={{ x: ["-120%", "360%"] }}
                  transition={{
                    duration: 1.4,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
