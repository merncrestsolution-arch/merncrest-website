import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/cms";
import { formatBlogDate } from "@/lib/commerce-format";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/motion/reveal";

export async function generateStaticParams() {
  // DB is unreachable during the Docker image build; render on-demand instead.
  try {
    const slugs = await getAllArticleSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const summary = (article.body || "").split("\n\n")[0] || undefined;
  const title = `${article.title} | MernCrest Knowledge Base`;
  return {
    title,
    description: summary,
    alternates: { canonical: `https://merncrest.lk/knowledge-base/${article.slug}` },
    openGraph: { title, description: summary, type: "article" },
  };
}

export default async function KbArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const paragraphs = (article.body || "").split("\n\n").filter(Boolean);
  const summary = paragraphs[0] || "";
  const rest = paragraphs.slice(1);
  const updated = formatBlogDate(article.publishedAt ?? article.updatedAt);

  return (
    <article className="stitch-page">
      <PageHero eyebrow={article.category} title={article.title} description={summary} align="left">
        <Link href="/knowledge-base" className="text-sm text-stitch-glow hover:text-violet-200">
          ← Knowledge Base
        </Link>
      </PageHero>

      <div className="stitch-page-body max-w-3xl">
        <Reveal className="stitch-card stitch-stack-md">
          {updated && (
            <p className="text-xs text-muted mb-2">Last updated: {updated}</p>
          )}
          {rest.length > 0
            ? rest.map((para, i) => (
                <p key={i} className="text-muted leading-relaxed">
                  {para}
                </p>
              ))
            : (
                <p className="text-muted leading-relaxed">{summary}</p>
              )}
        </Reveal>
      </div>
    </article>
  );
}
