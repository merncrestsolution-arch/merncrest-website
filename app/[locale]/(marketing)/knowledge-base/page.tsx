import { Link } from "@/i18n/routing";
import { kbArticles, kbCategories } from "@/lib/data/knowledge-base";
import { Reveal } from "@/components/motion/reveal";

export default function KnowledgeBasePage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Resources</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Knowledge Base</h1>
          <p className="mt-4 text-lg text-muted">
            Tutorials, documentation, FAQs, and troubleshooting for the MernCrest platform.
          </p>
        </Reveal>

        <div className="flex flex-wrap gap-2 mb-12">
          {kbCategories.map((c) => (
            <span key={c} className="text-xs font-mono border border-white/10 px-3 py-1.5 rounded-full text-muted">
              {c}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {kbArticles.map((article, i) => (
            <Reveal key={article.slug} delay={i * 0.05}>
              <Link href={`/knowledge-base/${article.slug}`} className="group block space-y-2 border-b border-white/10 pb-8">
                <p className="text-xs font-mono text-accent">{article.category}</p>
                <h2 className="font-display text-xl font-semibold group-hover:text-accent transition-colors">
                  {article.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed">{article.summary}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
