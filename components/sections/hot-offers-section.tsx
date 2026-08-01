import { StitchHeader, StitchReveal, StitchSection } from "@/components/ui/stitch";
import { getPublishedHomepageOffers } from "@/lib/offers";
import { HotOffersCarouselClient } from "./hot-offers-carousel-client";

/** Homepage: Hot Offers & Featured Solutions — Google Stitch luminous enterprise */
export async function HotOffersSection() {
  const offers = await getPublishedHomepageOffers();
  if (offers.length === 0) return null;

  return (
    <StitchSection mesh id="hot-offers" className="!py-20 sm:!py-28">
      <StitchReveal>
        <StitchHeader
          eyebrow="Limited Time · Sri Lanka"
          title="Hot Offers & Featured Solutions"
          description="Enterprise-grade software packages at promotional rates — built for Sri Lankan businesses."
          align="center"
          className="mb-10 max-w-3xl sm:mb-14"
        />
      </StitchReveal>
      <StitchReveal delay={0.08}>
        <HotOffersCarouselClient offers={offers} />
      </StitchReveal>
    </StitchSection>
  );
}
