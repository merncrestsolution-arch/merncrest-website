"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";
import { Link } from "@/i18n/routing";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  billingPeriod: string;
  reasons: string[];
};

export function HostingRecommendWidget() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [rec, setRec] = useState<Plan | null>(null);
  const [alts, setAlts] = useState<Plan[]>([]);

  async function recommend() {
    setLoading(true);
    setError("");
    setSummary("");
    setRec(null);
    setAlts([]);
    try {
      const res = await fetch("/api/hosting/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSummary(data.summary || "");
      setRec(data.recommendation);
      setAlts(data.alternatives || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold">AI Hosting Recommendation</h3>
        <p className="text-sm text-muted mt-1">
          Describe your project and we&apos;ll recommend the best package from our reseller catalog.
        </p>
      </div>
      <textarea
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm min-h-[100px]"
        placeholder="e.g. WordPress blog for a clinic, ~5,000 visitors/month, need email and SSL…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button disabled={loading || description.trim().length < 3} onClick={recommend}>
        {loading ? "Analyzing…" : "Recommend a plan"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {summary && <p className="text-sm text-foreground/90">{summary.replace(/\*\*/g, "")}</p>}
      {rec && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-violet-300">Recommended</p>
          <p className="font-semibold">{rec.name}</p>
          <p className="text-sm text-muted">{rec.description}</p>
          <p className="text-sm">
            {formatMoney(rec.priceCents, rec.currency)} / {rec.billingPeriod.toLowerCase()}
          </p>
          <ul className="text-xs text-muted list-disc pl-4">
            {rec.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <Button asChild size="sm">
            <Link href="/hosting">View hosting plans</Link>
          </Button>
        </div>
      )}
      {alts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted uppercase tracking-wide">Alternatives</p>
          {alts.map((a) => (
            <div key={a.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
              <span className="font-medium">{a.name}</span>
              <span className="text-muted">
                {" "}
                — {formatMoney(a.priceCents, a.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
