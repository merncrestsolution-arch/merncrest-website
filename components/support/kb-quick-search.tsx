"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Search } from "lucide-react";

/** Embedded knowledge-base search entry. Routes to the KB page with the query. */
export function KbQuickSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/knowledge-base?q=${encodeURIComponent(query)}` : "/knowledge-base");
  };

  return (
    <form onSubmit={submit} className="w-full max-w-2xl mx-auto">
      <label className="flex items-center gap-3 rounded-2xl border border-stitch-outline bg-glass px-4 py-3.5 shadow-glow focus-within:border-stitch-primary/50">
        <Search className="h-5 w-5 text-stitch-glow shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the knowledge base — DNS, billing, hosting, tickets…"
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/40"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-stitch-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Search
        </button>
      </label>
    </form>
  );
}
