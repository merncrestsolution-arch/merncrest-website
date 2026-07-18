"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Result = {
  domain: string;
  sld: string;
  tld: string;
  available: boolean;
  premium?: boolean;
  priceCents: number;
  renewPriceCents?: number;
  transferPriceCents?: number;
  currency: string;
};

export function DomainSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [suggestions, setSuggestions] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results ?? []);
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function addDomain(r: Result) {
    setBusy(r.domain);
    setError("");
    setMessage("");
    try {
      const catalog = await fetch("/api/catalog?category=domains").then((x) => x.json());
      const products = catalog.products ?? [];
      const tldKey = r.tld.replace(/\./g, "-");
      const match =
        products.find((p: { slug: string }) => p.slug === `domain-${tldKey}-registration`) ||
        products.find((p: { slug: string }) => p.slug.includes(tldKey)) ||
        products.find((p: { slug: string }) => p.slug.includes("domain-lk") && r.tld.endsWith("lk")) ||
        products.find((p: { slug: string }) => p.slug.includes("domain-com")) ||
        products[0];
      if (!match) throw new Error("Domain product not in catalog — run db:seed");

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: match.id,
          quantity: 1,
          meta: { domainName: r.domain, sld: r.sld, tld: r.tld },
        }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(`${r.domain} added · ${formatMoney(r.priceCents)}/yr`);
      router.push("/portal/cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  function ResultRow({ r }: { r: Result }) {
    return (
      <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="font-mono font-medium">
            {r.domain}
            {r.premium ? <span className="ml-2 text-xs text-amber-400">Premium</span> : null}
          </p>
          <p className="text-xs text-muted">
            {r.available ? "Available" : "Unavailable"}
            {r.available && (
              <>
                {" · "}Register {formatMoney(r.priceCents)}/yr
                {r.renewPriceCents != null && <> · Renew {formatMoney(r.renewPriceCents)}</>}
                {r.transferPriceCents != null && <> · Transfer {formatMoney(r.transferPriceCents)}</>}
              </>
            )}
          </p>
        </div>
        {r.available && (
          <Button size="sm" disabled={busy === r.domain} onClick={() => addDomain(r)}>
            {busy === r.domain ? "Adding…" : "Register Now"}
          </Button>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="flex flex-col sm:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="example.lk"
          className="flex-1 h-12 rounded-lg border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-accent/50"
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-teal-400">{message}</p>}
      <ul className="space-y-3">
        {results.map((r) => (
          <ResultRow key={r.domain} r={r} />
        ))}
      </ul>
      {suggestions.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">Similar suggestions</p>
          <ul className="space-y-3">
            {suggestions.map((r) => (
              <ResultRow key={`sug-${r.domain}`} r={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
