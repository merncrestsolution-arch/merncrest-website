import { getTranslations, setRequestLocale } from "next-intl/server";
import { ServicesSection } from "@/components/sections/services-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("services")} | MERNcrest Solutions`,
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen">
      <ServicesSection hideViewAll={true} />
    </div>
  );
}
