"use client";

import Image from "next/image";
import { StitchSection, StitchHeader } from "@/components/ui/stitch";
import { InfiniteMarquee } from "@/components/ui/infinite-marquee";

type Brand = {
  name: string;
  tagline: string;
  src: string;
};

const brands: Brand[] = [
  {
    name: "MernCrest",
    tagline: "Enterprise Solutions",
    src: "/brands/merncrest.png",
  },
  {
    name: "WebxFix",
    tagline: "Software Solutions",
    src: "/brands/vxf.png",
  },
  {
    name: "Home Bite",
    tagline: "Homemade & Food Delivery",
    src: "/brands/homebite.png",
  },
  {
    name: "TITAN",
    tagline: "Electric & Electronic Products · Manufacture",
    src: "/brands/titan.png",
  },
];

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className="group flex h-full w-[200px] flex-col items-center rounded-2xl border border-stitch-outline bg-stitch-surface p-6 text-center shadow-[var(--stitch-card-shadow)] sm:w-[220px]">
      <div className="relative flex h-20 w-full items-center justify-center">
        <Image
          src={brand.src}
          alt={brand.name}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          sizes="220px"
        />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-stitch-muted">
        {brand.tagline}
      </p>
    </div>
  );
}

export function GroupsBrandsSection() {
  return (
    <StitchSection className="bg-stitch-bg py-14 md:py-20">
      <StitchHeader
        eyebrow="Our Ecosystem"
        title="Our Groups & Brands"
        description="One group, many ventures. MernCrest builds and backs a family of brands across enterprise technology, digital products, and consumer services."
        align="center"
        className="mb-10"
      />

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-stitch-bg to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-stitch-bg to-transparent sm:w-24" />

        <InfiniteMarquee durationSec={14} className="py-2">
          {brands.map((brand) => (
            <div key={brand.name} className="shrink-0 px-3 sm:px-4">
              <BrandCard brand={brand} />
            </div>
          ))}
        </InfiniteMarquee>
      </div>
    </StitchSection>
  );
}
