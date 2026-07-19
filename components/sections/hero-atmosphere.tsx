"use client";

import { motion } from "framer-motion";

/** Full-bleed brand atmosphere — purple/indigo glow matching MernCrest visual identity. */
export function HeroAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#050508]" />

      <motion.div
        className="absolute -left-1/4 top-0 h-[80%] w-[70%] rounded-full bg-violet-600/25 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-0 h-[70%] w-[60%] rounded-full bg-indigo-500/15 blur-[140px]"
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[80px]"
        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/30" />
    </div>
  );
}
