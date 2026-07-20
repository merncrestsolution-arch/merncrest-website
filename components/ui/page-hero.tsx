"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
};

/** Stitch atmospheric page hero — consistent alignment across all marketing pages */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "center",
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-white/[0.05] pt-32 pb-14 sm:pt-36 sm:pb-16",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0" style={{ background: "var(--stitch-bg)" }} />
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-[10%] bottom-0 h-56 w-56 rounded-full bg-indigo-600/10 blur-[90px]" />
      </div>

      <div
        className={cn(
          "stitch-container relative z-10",
          align === "center" && "text-center mx-auto max-w-3xl",
          align === "left" && "max-w-3xl"
        )}
      >
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-300 mb-4"
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white text-balance"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={cn(
              "mt-4 text-base sm:text-lg text-muted leading-relaxed max-w-2xl",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className={cn("mt-8", align === "center" && "flex flex-col items-center")}
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
