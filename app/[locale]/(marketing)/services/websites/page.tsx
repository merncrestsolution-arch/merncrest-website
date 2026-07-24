import { setRequestLocale } from "next-intl/server";
import { Globe } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume02Websites } from "@/lib/data/price-book";

export const metadata = {
  title: "Website Development & Web Solutions | MernCrest",
  description:
    "Official MernCrest price book for landing pages, business websites, e-commerce, portals, and custom web applications — packages from LKR 20,000.",
};

export default async function WebsiteServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume02Websites}
      quoteInterest="Website Development"
      heroDescription="Transparent website and web application packages — from one-page landing sites to enterprise portals, e-commerce, and custom apps. Every project includes defined deliverables, warranty, and milestone-based payments."
      ctaTitle="Ready to launch your website?"
      ctaDescription="Choose a package or describe your project — we'll confirm scope, timeline, and the right tier before development starts."
      ctaIcon={Globe}
    />
  );
}
