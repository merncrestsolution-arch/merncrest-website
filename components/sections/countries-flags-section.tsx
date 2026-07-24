"use client";

import { InfiniteMarquee } from "@/components/ui/infinite-marquee";
import { StitchSection, StitchHeader } from "@/components/ui/stitch";

/** ISO 3166-1 alpha-2 codes for flagcdn */
const countries: { code: string; name: string }[] = [
  { code: "ca", name: "Canada" },
  { code: "ch", name: "Switzerland" },
  { code: "gb", name: "United Kingdom" },
  { code: "us", name: "United States" },
  { code: "in", name: "India" },
  { code: "bd", name: "Bangladesh" },
  { code: "pk", name: "Pakistan" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "cn", name: "China" },
  { code: "jp", name: "Japan" },
  { code: "de", name: "Germany" },
  { code: "au", name: "Australia" },
  { code: "sg", name: "Singapore" },
  { code: "lk", name: "Sri Lanka" },
];

export function CountriesFlagsSection() {
  return (
    <StitchSection className="border-y border-stitch-outline bg-stitch-surface py-10 md:py-14">
      <StitchHeader
        eyebrow="Global reach"
        title="Clients & partners worldwide"
        description="Delivering enterprise technology across continents."
        align="center"
        className="mb-8"
      />

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-stitch-surface to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-stitch-surface to-transparent sm:w-24" />

        <InfiniteMarquee durationSec={16} className="py-2">
          {countries.map((c) => (
            <div
              key={c.code}
              className="flex shrink-0 items-center justify-center px-5 sm:px-7"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w80/${c.code}.png`}
                srcSet={`https://flagcdn.com/w160/${c.code}.png 2x`}
                width={48}
                height={36}
                alt=""
                aria-label={c.name}
                title={c.name}
                className="h-9 w-12 rounded-sm object-cover shadow-sm ring-1 ring-black/5"
                loading="eager"
                decoding="async"
              />
            </div>
          ))}
        </InfiniteMarquee>
      </div>
    </StitchSection>
  );
}
