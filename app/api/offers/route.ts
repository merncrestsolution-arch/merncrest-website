import { NextResponse } from "next/server";
import { getPublishedHomepageOffers, getOfferBySlug } from "@/lib/offers";
import { rateLimit, clientIp } from "@/lib/chat/rate-limit";

export const revalidate = 60;

/** Public offers API — published, non-expired offers only. */
export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit({ key: `offers:public:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const slug = new URL(request.url).searchParams.get("slug");
  if (slug) {
    const offer = await getOfferBySlug(slug);
    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ offer });
  }

  const offers = await getPublishedHomepageOffers();
  return NextResponse.json({ offers });
}
