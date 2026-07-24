import { setRequestLocale } from "next-intl/server";
import { Cloud } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume08Cloud } from "@/lib/data/price-book";

export const metadata = {
  title: "Cloud, DevOps & Cybersecurity | MernCrest",
  description:
    "Official MernCrest price book for AWS, Azure, GCP, DevOps, Kubernetes, cloud security, SOC, and managed infrastructure — packages from LKR 20,000.",
};

export default async function CloudInfrastructurePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume08Cloud}
      quoteInterest="Cloud Infrastructure & DevOps"
      heroDescription="Cloud deployment, DevOps pipelines, Kubernetes, backup & disaster recovery, and cybersecurity — on AWS, Azure, and GCP. MernCrest architects and operates cloud environments; we do not own datacenters."
      ctaTitle="Ready to move to the cloud?"
      ctaDescription="Choose a deployment package or describe your infrastructure — we'll confirm architecture, security, timeline, and ongoing managed options before work begins."
      ctaIcon={Cloud}
    />
  );
}
