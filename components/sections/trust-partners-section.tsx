"use client";

import { BrandLogo } from "@/components/ui/brand-logo";
import { InfiniteMarquee } from "@/components/ui/infinite-marquee";

const partners = [
  { name: "AWS", slug: "amazonaws", color: "FF9900" },
  { name: "Microsoft", slug: "microsoft", color: "00A4EF" },
  { name: "Google Cloud", slug: "googlecloud", color: "4285F4" },
  { name: "Docker", slug: "docker", color: "2496ED" },
  { name: "Cloudflare", slug: "cloudflare", color: "F38020" },
  { name: "Android", slug: "android", color: "3DDC84" },
  { name: "iOS", slug: "ios", color: "000000" },
  { name: "Flutter", slug: "flutter", color: "02569B" },
  { name: "Linux", slug: "linux", color: "000000" },
  { name: "Android Studio", slug: "androidstudio", color: "3DDC84" },
];

export function TrustPartnersSection() {
  return (
    <section className="border-y border-stitch-outline bg-stitch-bg py-6">
      <div className="stitch-container">
        <p className="mb-4 text-center font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-stitch-muted">
          Trusted Global Infrastructure & Platform Partners
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-stitch-bg to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-stitch-bg to-transparent sm:w-28" />

        <InfiniteMarquee durationSec={14} className="py-1">
          {partners.map((item) => (
            <div
              key={item.slug}
              className="flex shrink-0 items-center gap-3 pr-10 sm:pr-14"
            >
              <BrandLogo
                slug={item.slug}
                name={item.name}
                color={item.color}
                size={38}
              />
              <span className="whitespace-nowrap text-base font-semibold text-foreground sm:text-lg">
                {item.name}
              </span>
            </div>
          ))}
        </InfiniteMarquee>
      </div>
    </section>
  );
}
