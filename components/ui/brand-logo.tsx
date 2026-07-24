"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Local vector marks for brands blocked on cdn.simpleicons.org (trademark policy).
 * Paths under /public/brands — used with CSS mask so brand colors still apply.
 */
const LOCAL_BRAND_ICONS: Record<string, string> = {
  amazonaws: "/brands/amazonaws.svg",
  microsoft: "/brands/microsoft.svg",
  microsoftazure: "/brands/microsoftazure.svg",
};

/** Official-style brand marks via Simple Icons CDN + local fallbacks. */
export function BrandLogo({
  slug,
  name,
  color = "white",
  size = 28,
  className,
  src,
}: {
  slug: string;
  name: string;
  color?: string;
  size?: number;
  className?: string;
  /** Optional override image URL */
  src?: string;
}) {
  const local = LOCAL_BRAND_ICONS[slug];
  const fill =
    color === "white"
      ? "var(--stitch-on)"
      : color.startsWith("#")
        ? color
        : `#${color}`;

  if (!src && local) {
    return (
      <span
        role="img"
        aria-label={`${name} logo`}
        className={cn("inline-block shrink-0", className)}
        style={{
          width: size,
          height: size,
          backgroundColor: fill,
          WebkitMaskImage: `url(${local})`,
          maskImage: `url(${local})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }

  const resolved = src ?? `https://cdn.simpleicons.org/${slug}/${color}`;

  return (
    <Image
      src={resolved}
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
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-glass border border-stitch-outline">
        <BrandLogo slug={slug} name={name} color={color} size={32} />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">{name}</h2>
        {role && <p className="mt-1 text-xs font-mono text-stitch-glow">{role}</p>}
        {blurb && <p className="mt-2 text-sm text-muted leading-relaxed">{blurb}</p>}
      </div>
    </div>
  );
}

export function BrandStrip({
  items,
  className,
}: {
  items: { slug: string; name: string; color?: string; src?: string }[];
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
          className="flex items-center gap-2.5 opacity-100 hover:opacity-100 transition-opacity"
        >
          <BrandLogo
            slug={item.slug}
            name={item.name}
            color={item.color ?? "white"}
            src={item.src}
            size={22}
          />
          <span className="text-sm font-semibold text-foreground">{item.name}</span>
        </li>
      ))}
    </ul>
  );
}
