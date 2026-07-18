"use client";

import { motion } from "framer-motion";

/** Full-bleed cinematic ocean atmosphere — CSS/video hybrid (no external CDN required). */
export function HeroAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base navy */}
      <div className="absolute inset-0 bg-[#061018]" />

      {/* Animated mesh layers */}
      <motion.div
        className="absolute -left-1/4 top-0 h-[80%] w-[70%] rounded-full bg-teal-500/20 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-0 h-[70%] w-[60%] rounded-full bg-cyan-600/15 blur-[140px]"
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-teal-400/10 blur-[80px]"
        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Soft video-like grain / scan lines */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Horizon wave bands */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-40 md:h-56 text-teal-500/20 animate-wave-slow"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,120 C240,180 480,60 720,120 C960,180 1200,80 1440,130 L1440,200 L0,200 Z"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-[-50%] w-[200%] h-32 md:h-44 text-cyan-600/15"
        style={{ animation: "wave-slow 16s ease-in-out infinite reverse" }}
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,140 C320,80 640,160 960,110 C1120,85 1280,120 1440,100 L1440,200 L0,200 Z"
        />
      </svg>

      {/* Optional looping video if present in /public */}
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
        autoPlay
        muted
        loop
        playsInline
        poster=""
      >
        <source src="/hero-ocean.mp4" type="video/mp4" />
      </video>

      {/* Readability veil */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#061018]/70 via-[#061018]/55 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061018]/80 via-transparent to-[#061018]/40" />
    </div>
  );
}
