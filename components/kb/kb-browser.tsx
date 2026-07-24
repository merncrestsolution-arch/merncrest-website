"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Search } from "lucide-react";

type KbItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
};

export function KbBrowser({
  articles,
  categories,
  initialQuery = "",
}: {
  articles: KbItem[];
  categories: string[];
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [active, setActive] = useState("All");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return articles.filter((a) => {
      const inCat = active === "All" || a.category === active;
      const inQuery =
        !query || [a.title, a.summary, a.category].join(" ").toLowerCase().includes(query);
      return inCat && inQuery;
    });
  }, [articles, q, active]);

  return (
    <div className="stitch-stack-lg">
      <div className="w-full max-w-xl mx-auto">
        <label className="flex items-center gap-3 rounded-2xl border border-stitch-outline bg-glass px-4 py-3 shadow-glow focus-within:border-stitch-primary/50">
          <Search className="h-5 w-5 text-stitch-glow shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guides, DNS, billing, tickets…"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/40"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`text-xs font-mono border px-3 py-1.5 rounded-full transition-colors ${
              active === c
                ? "border-accent bg-accent text-foreground"
                : "border-stitch-outline bg-glass text-muted hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {filtered.map((article) => (
          <Link
            key={article.id}
            href={`/knowledge-base/${article.slug}`}
            className="group block h-full stitch-card stitch-card-hover"
          >
            <p className="text-xs font-mono text-stitch-glow">{article.category}</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-foreground group-hover:text-stitch-glow transition-colors">
              {article.title}
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3">{article.summary}</p>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-16">No articles match your search.</p>
      )}
    </div>
  );
}
