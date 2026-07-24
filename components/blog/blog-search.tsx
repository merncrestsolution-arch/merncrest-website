"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Calendar, User, ArrowRight, Search } from "lucide-react";

type BlogCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  author: string | null;
  coverImageUrl: string | null;
  date: string;
};

export function BlogSearch({
  posts,
  categories,
}: {
  posts: BlogCardData[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const inCat = active === "All" || p.category === active;
      const inQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [posts, query, active]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full rounded-full border border-stitch-outline bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                active === cat
                  ? "border-accent bg-accent text-foreground"
                  : "border-stitch-outline text-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">No articles match your search.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group stitch-card stitch-card-hover !p-0 overflow-hidden flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden bg-white/5">
                {post.coverImageUrl && (
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
                <div className="absolute top-4 left-4 z-10">
                  <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-foreground">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="flex flex-grow flex-col p-6">
                <div className="mb-4 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.date}
                  </span>
                  {post.author && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {post.author}
                    </span>
                  )}
                </div>
                <h3 className="mb-3 line-clamp-2 font-display text-xl font-semibold text-foreground transition-colors group-hover:text-violet-200">
                  {post.title}
                </h3>
                <p className="mb-6 line-clamp-3 flex-grow text-sm text-muted">{post.excerpt}</p>
                <div className="flex items-center text-sm font-medium text-stitch-glow">
                  Read Full Article
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
