import { setRequestLocale } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume09Marketing } from "@/lib/data/price-book";

export const metadata = {
  title: "Digital Marketing & Creative Media | MernCrest",
  description:
    "Official MernCrest price book for SEO, Google Ads, social media, content marketing, branding, video production, and enterprise marketing — from LKR 10,000/month.",
};

export default async function MarketingServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume09Marketing}
      quoteInterest="Digital Marketing & Creative Media"
      heroDescription="SEO, paid ads, social media, content, branding, video, and full-funnel digital growth — with transparent monthly retainers and one-time creative packages. Ad platform budgets are billed separately unless quoted."
      ctaTitle="Ready to grow your brand online?"
      ctaDescription="Pick a marketing package or tell us your goals — we'll confirm channels, deliverables, KPIs, and retainer terms before launch."
      ctaIcon={Megaphone}
    />
  );
}
