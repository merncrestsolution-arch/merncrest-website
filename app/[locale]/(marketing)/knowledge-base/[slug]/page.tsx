import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getKbArticle, kbArticles } from "@/lib/data/knowledge-base";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/motion/reveal";

export function generateStaticParams() {
  return kbArticles.map((a) => ({ slug: a.slug }));
}

export default async function KbArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getKbArticle(slug);
  if (!article) notFound();

  return (
    <article className="stitch-page">
      <PageHero
        eyebrow={article.category}
        title={article.title}
        description={article.summary}
        align="left"
      >
        <Link href="/knowledge-base" className="text-sm text-violet-300 hover:text-violet-200">
          ← Knowledge Base
        </Link>
      </PageHero>

      <div className="stitch-page-body max-w-3xl">
        <Reveal className="stitch-card stitch-stack-md">
          {article.body.map((para) => (
            <p key={para} className="text-muted leading-relaxed">
              {para}
            </p>
          ))}
        </Reveal>
      </div>
    </article>
  );
}
