"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Official-style brand marks via Simple Icons CDN (layout only — no logic). */
export function BrandLogo({
  slug,
  name,
  color = "white",
  size = 28,
  className,
}: {
  slug: string;
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={`https://cdn.simpleicons.org/${slug}/${color}`}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      unoptimized
    />
  );
}

export function BrandMarkCard({
  slug,
  name,
  role,
  blurb,
  color = "white",
  className,
}: {
  slug: string;
  name: string;
  role?: string;
  blurb?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("stitch-card stitch-card-hover flex flex-col gap-4", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10">
        <BrandLogo slug={slug} name={name} color={color} size={32} />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold text-white">{name}</h2>
        {role && <p className="mt-1 text-xs font-mono text-violet-300">{role}</p>}
        {blurb && <p className="mt-2 text-sm text-muted leading-relaxed">{blurb}</p>}
      </div>
    </div>
  );
}

export function BrandStrip({
  items,
  className,
}: {
  items: { slug: string; name: string; color?: string }[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-8 gap-y-5",
        className
      )}
    >
      {items.map((item) => (
        <li
          key={item.slug}
          className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity"
        >
          <BrandLogo
            slug={item.slug}
            name={item.name}
            color={item.color ?? "white"}
            size={22}
          />
          <span className="text-sm font-medium text-muted">{item.name}</span>
        </li>
      ))}
    </ul>
  );
}
