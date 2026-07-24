import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedArticles } from "@/lib/cms";
import { PageHero } from "@/components/ui/page-hero";
import { KbBrowser } from "@/components/kb/kb-browser";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const title = `${t("knowledgeBase")} | MernCrest Solutions`;
  const description =
    "Tutorials, documentation, FAQs, and troubleshooting for the MernCrest platform.";
  return {
    title,
    description,
    alternates: { canonical: "https://merncrest.lk/knowledge-base" },
    openGraph: { title, description, url: "https://merncrest.lk/knowledge-base", type: "website" },
  };
}

export default async function KnowledgeBasePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const articles = await getPublishedArticles();
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Resources"
        title="Knowledge Base"
        description="Tutorials, documentation, FAQs, and troubleshooting for the MernCrest platform."
      />

      <div className="stitch-page-body">
        <KbBrowser
          categories={categories}
          initialQuery={q || ""}
          articles={articles.map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            category: a.category,
            summary: (a.body || "").split("\n\n")[0] || "",
          }))}
        />
      </div>
    </div>
  );
}
