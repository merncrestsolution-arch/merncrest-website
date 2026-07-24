import { setRequestLocale } from "next-intl/server";
import { Briefcase } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume06BusinessSystems } from "@/lib/data/price-book";

export const metadata = {
  title: "Business Management Systems | MernCrest",
  description:
    "Official MernCrest price book for CRM, HRM, payroll, inventory, fleet, project management, and enterprise business suites — packages from LKR 75,000.",
};

export default async function BusinessSystemsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume06BusinessSystems}
      quoteInterest="Business Management Systems"
      heroDescription="Modular business systems for CRM, HR, payroll, inventory, fleet, projects, documents, and more — or a unified enterprise suite. Clear tiers, milestone payments, and up to 5-year warranty."
      ctaTitle="Ready to streamline your business?"
      ctaDescription="Pick a system for your department or describe your full stack — we'll confirm modules, deployment, timeline, and training before go-live."
      ctaIcon={Briefcase}
    />
  );
}
