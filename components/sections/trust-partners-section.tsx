"use client";

import { BrandStrip } from "@/components/ui/brand-logo";
import { techBrands } from "@/lib/data/resources";

/** Stitch homepage trust bar — AWS / Microsoft / Google Cloud / Cloudflare */
export function TrustPartnersSection() {
  return (
    <section className="border-y border-[#4a4455] bg-[#0e0e12] py-10">
      <div className="stitch-container">
        <p className="font-mono text-[12px] text-center text-[#958da1] mb-8 uppercase tracking-[0.2em]">
          Trusted Global Infrastructure Partners
        </p>
        <BrandStrip
          items={techBrands.filter((b) =>
            ["amazonaws", "microsoft", "googlecloud", "docker"].includes(b.slug)
          ).concat([{ name: "Cloudflare", slug: "cloudflare", color: "F38020" }])}
          className="opacity-70"
        />
      </div>
    </section>
  );
}
