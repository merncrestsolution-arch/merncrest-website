import { setRequestLocale } from "next-intl/server";
import { Headphones } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume10Support } from "@/lib/data/price-book";

export const metadata = {
  title: "Enterprise Support, Managed Services & AMC | MernCrest",
  description:
    "Official MernCrest price book for AMC, managed IT, remote and onsite support, monitoring, disaster recovery, training, and enterprise SLA programs.",
};

export default async function EnterpriseSupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume10Support}
      quoteInterest="Enterprise Support & AMC"
      heroDescription="Long-term support for the systems we build and the infrastructure you run — AMC contracts, managed IT, 24/7 monitoring, disaster recovery, training, and dedicated technical resources with clear SLAs."
      ctaTitle="Need enterprise-grade support?"
      ctaDescription="Choose an AMC or managed services package — we'll confirm scope, SLA targets, response times, and billing before your contract starts."
      ctaIcon={Headphones}
    />
  );
}
