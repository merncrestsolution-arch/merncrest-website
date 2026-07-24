import { setRequestLocale } from "next-intl/server";
import { ShoppingCart } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume04Pos } from "@/lib/data/price-book";

export const metadata = {
  title: "POS Systems & Billing Solutions | MernCrest",
  description:
    "Official MernCrest price book for retail, restaurant, pharmacy, supermarket, multi-branch, and enterprise POS — packages from LKR 50,000.",
};

export default async function PosServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume04Pos}
      quoteInterest="POS Systems & Billing"
      heroDescription="Industry-specific POS and billing systems for retail, restaurants, pharmacies, supermarkets, and enterprise operations. Clear tiers, hardware integration, deployment options, and up to 5-year warranty."
      ctaTitle="Ready to modernize your billing?"
      ctaDescription="Choose a POS package for your industry or tell us your requirements — we'll confirm features, hardware, deployment, and training before go-live."
      ctaIcon={ShoppingCart}
    />
  );
}
