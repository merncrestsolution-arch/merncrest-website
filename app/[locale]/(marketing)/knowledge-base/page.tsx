"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { kbArticles, kbCategories } from "@/lib/data/knowledge-base";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/ui/page-hero";
import { Search } from "lucide-react";
import { useCommandSearch } from "@/components/layout/command-search";

export default function KnowledgeBasePage() {
  const [q, setQ] = useState("");
  const { setOpen } = useCommandSearch();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return kbArticles;
    return kbArticles.filter((a) =>
      [a.title, a.summary, a.category].join(" ").toLowerCase().includes(query)
    );
  }, [q]);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Resources"
        title="Knowledge Base"
        description="Tutorials, documentation, FAQs, and troubleshooting for the MernCrest platform."
      >
        <div className="w-full max-w-xl mx-auto space-y-3">
          <label className="flex items-center gap-3 rounded-2xl border border-violet-500/25 bg-white/[0.05] px-4 py-3 shadow-glow focus-within:border-violet-400/50">
            <Search className="h-5 w-5 text-violet-300 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search guides, DNS, billing, tickets…"
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/40"
            />
          </label>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-violet-300/80 hover:text-violet-200"
          >
            Or press ⌘K for site-wide search
          </button>
        </div>
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <div className="flex flex-wrap gap-2 justify-center">
          {kbCategories.map((c) => (
            <span
              key={c}
              className="text-xs font-mono border border-white/10 bg-white/[0.02] px-3 py-1.5 rounded-full text-muted"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((article, i) => (
            <Reveal key={article.slug} delay={i * 0.04}>
              <Link
                href={`/knowledge-base/${article.slug}`}
                className="group block h-full stitch-card stitch-card-hover"
              >
                <p className="text-xs font-mono text-violet-300">{article.category}</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white group-hover:text-violet-200 transition-colors">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm text-muted leading-relaxed">{article.summary}</p>
              </Link>
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted py-16">No articles match “{q}”.</p>
        )}
      </div>
    </div>
  );
}
