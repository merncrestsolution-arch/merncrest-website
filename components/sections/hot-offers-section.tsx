import { StitchHeader, StitchReveal, StitchSection } from "@/components/ui/stitch";
import { getPublishedHomepageOffers } from "@/lib/offers";
import { HotOffersCarouselClient } from "./hot-offers-carousel-client";

/** Homepage: Hot Offers & Featured Solutions — immediately after Hero */
export async function HotOffersSection() {
  const offers = await getPublishedHomepageOffers();
  if (offers.length === 0) return null;

  return (
    <StitchSection mesh className="!py-20 sm:!py-24">
      <StitchReveal>
        <StitchHeader
          eyebrow="Limited Time"
          title="Hot Offers & Featured Solutions"
          description="Exclusive packages for Sri Lankan businesses — enterprise-grade software at promotional rates."
          align="center"
          className="mb-12 sm:mb-14"
        />
      </StitchReveal>
      <HotOffersCarouselClient offers={offers} />
    </StitchSection>
  );
}
