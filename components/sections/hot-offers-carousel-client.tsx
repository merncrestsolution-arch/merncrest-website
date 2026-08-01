"use client";

import type { PublicOffer } from "@/lib/offers/types";
import { OffersCarousel } from "@/components/offers/offers-carousel";

export function HotOffersCarouselClient({ offers }: { offers: PublicOffer[] }) {
  return <OffersCarousel offers={offers} />;
}
