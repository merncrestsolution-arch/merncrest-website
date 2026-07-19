"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/** Stitch “Luminous Enterprise” layout primitives */

export function StitchSection({
  children,
  className,
  id,
  mesh = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  mesh?: boolean;
}) {
  return (
    <section id={id} className={cn("relative stitch-section", className)}>
      {mesh && <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" aria-hidden />}
      <div className="stitch-container relative z-10">{children}</div>
    </section>
  );
}

export function StitchHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "stitch-stack-md max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-violet-300/90">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
}

export function StitchCard({
  children,
  className,
  hover = true,
  as: Comp = "div",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "li";
}) {
  return (
    <Comp
      className={cn(
        "stitch-card",
        hover && "stitch-card-hover",
        className
      )}
    >
      {children}
    </Comp>
  );
}

export function StitchIconBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StitchChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StitchReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StitchGrid({
  children,
  cols = 3,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-5",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
