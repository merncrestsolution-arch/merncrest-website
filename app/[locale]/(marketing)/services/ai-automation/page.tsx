import { setRequestLocale } from "next-intl/server";
import { Brain } from "lucide-react";
import { PriceBookVolumePage } from "@/components/marketing/price-book-volume-page";
import { volume07Ai } from "@/lib/data/price-book";

export const metadata = {
  title: "AI Solutions & Business Automation | MernCrest",
  description:
    "Official MernCrest price book for AI chatbots, WhatsApp automation, voice AI, OCR, predictive analytics, and enterprise AI platforms — packages from LKR 80,000.",
};

export default async function AiAutomationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PriceBookVolumePage
      volume={volume07Ai}
      quoteInterest="AI Solutions & Automation"
      heroDescription="Practical AI for your business — chatbots, WhatsApp automation, voice assistants, OCR, workflow automation, predictive analytics, and full enterprise AI transformation. Milestone payments and up to 5-year warranty."
      ctaTitle="Ready to automate with AI?"
      ctaDescription="Choose an AI package or describe your use case — we'll confirm integrations, LLM options, timeline, and ongoing API costs before build."
      ctaIcon={Brain}
    />
  );
}
