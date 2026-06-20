import { getTranslations, setRequestLocale } from "next-intl/server";

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
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <div className="container-wide section-padding pt-32 min-h-[60vh]">
      <h1 className="text-4xl font-bold mb-8">{t("services")}</h1>
      <p className="text-muted">Content for the main Services page will go here.</p>
    </div>
  );
}
