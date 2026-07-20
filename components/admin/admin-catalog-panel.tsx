"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  providerPriceCents: number | null;
  currency: string;
  marketingTitle: string | null;
  marketingBanner: string | null;
  marketingBody: string | null;
  active: boolean;
  featured: boolean;
  provider: { name: string; code: string } | null;
};

export function AdminCatalogPanel() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    marketingTitle: "",
    marketingBanner: "",
    marketingBody: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setProducts(data.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(p: CatalogProduct) {
    setEditing(p.id);
    setDraft({
      marketingTitle: p.marketingTitle || "",
      marketingBanner: p.marketingBanner || "",
      marketingBody: p.marketingBody || "",
    });
  }

  async function save(id: string) {
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          marketingTitle: draft.marketingTitle || null,
          marketingBanner: draft.marketingBanner || null,
          marketingBody: draft.marketingBody || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Marketing content saved");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading catalog…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Product Catalog</h2>
        <p className="text-sm text-muted mt-1">
          Synced from providers. Edit marketing title, banner, and body for the public website.
          Provider cost is internal only.
        </p>
      </div>
      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-3">
        {products.map((p) => {
          const profit =
            p.providerPriceCents != null ? p.priceCents - p.providerPriceCents : null;
          return (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.marketingTitle || p.name}</p>
                  <p className="text-xs text-muted font-mono">{p.slug}</p>
                  <p className="text-xs text-muted mt-1 capitalize">
                    {p.category}
                    {p.provider ? ` · ${p.provider.name}` : ""}
                  </p>
                  <p className="text-sm mt-1">
                    Sell {formatMoney(p.priceCents, p.currency)}
                    {p.providerPriceCents != null && (
                      <span className="text-muted">
                        {" "}
                        · Cost {formatMoney(p.providerPriceCents, p.currency)}
                        {profit != null && ` · Profit ${formatMoney(profit, p.currency)}`}
                      </span>
                    )}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                  Edit marketing
                </Button>
              </div>
              {editing === p.id && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    placeholder="Marketing title"
                    value={draft.marketingTitle}
                    onChange={(e) => setDraft({ ...draft, marketingTitle: e.target.value })}
                  />
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                    placeholder="Banner URL or text"
                    value={draft.marketingBanner}
                    onChange={(e) => setDraft({ ...draft, marketingBanner: e.target.value })}
                  />
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Marketing body"
                    value={draft.marketingBody}
                    onChange={(e) => setDraft({ ...draft, marketingBody: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => save(p.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
