import { setRequestLocale } from "next-intl/server";
import { Smartphone } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume03Mobile } from "@/lib/data/price-book";

export const metadata = {
  title: "Mobile Application Development | MernCrest",
  description:
    "Official MernCrest price book for Android, iOS, cross-platform, business, and enterprise mobile apps — packages from LKR 80,000.",
};

export default async function MobileServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume03Mobile}
      quoteInterest="Mobile Application Development"
      heroDescription="Native Android, iOS, and cross-platform mobile applications for every industry — from business apps and e-commerce to AI-powered enterprise mobility. Clear tiers, milestone payments, and up to 3-year warranty."
      ctaTitle="Ready to build your mobile app?"
      ctaDescription="Choose a package or describe your app idea — we'll confirm features, platform, timeline, and publishing options before development starts."
      ctaIcon={Smartphone}
    />
  );
}
