import { setRequestLocale } from "next-intl/server";
import { Building2 } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume05Erp } from "@/lib/data/price-book";

export const metadata = {
  title: "ERP & Enterprise Resource Planning | MernCrest",
  description:
    "Official MernCrest price book for ERP, manufacturing, distribution, finance, HRM, and enterprise digital transformation — packages from LKR 120,000.",
};

export default async function ErpServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume05Erp}
      quoteInterest="ERP & Enterprise Solutions"
      heroDescription="End-to-end ERP platforms for sales, manufacturing, distribution, finance, HR, and multi-branch operations — plus AI-powered analytics and full digital transformation suites. Milestone payments and up to 5-year warranty."
      ctaTitle="Ready to transform your operations?"
      ctaDescription="Choose an ERP package for your industry or describe your workflows — we'll confirm modules, deployment, timeline, and training before kickoff."
      ctaIcon={Building2}
    />
  );
}
