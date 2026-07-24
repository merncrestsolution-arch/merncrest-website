import { setRequestLocale } from "next-intl/server";
import { Palette } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume01Branding } from "@/lib/data/price-book";

export const metadata = {
  title: "Branding & Creative Services | MernCrest",
  description:
    "Official MernCrest price book for UI/UX design, social media branding, presentations, and brand guidelines — transparent packages from LKR 8,000.",
};

export default async function BrandingServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume01Branding}
      quoteInterest="Branding & Creative"
      heroDescription="Professional branding and creative design packages with clear tiers. Every engagement includes structured deliverables, revision support, and source files on completion."
      ctaTitle="Ready to build your brand?"
      ctaDescription="Pick a package tier or tell us your scope — we'll confirm deliverables, timeline, and payment before work begins."
      ctaIcon={Palette}
    />
  );
}
