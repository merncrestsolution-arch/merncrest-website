import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getKbArticle, kbArticles } from "@/lib/data/knowledge-base";
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
    <article className="pt-28 section-padding">
      <div className="container-wide max-w-2xl">
        <Reveal>
          <Link href="/knowledge-base" className="text-sm text-accent hover:opacity-80">
            ← Knowledge Base
          </Link>
          <p className="mt-6 text-xs font-mono text-accent">{article.category}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold">{article.title}</h1>
          <p className="mt-4 text-muted text-lg">{article.summary}</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-10 space-y-4">
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
