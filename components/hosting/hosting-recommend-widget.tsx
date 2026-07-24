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

const QUICK_PROMPTS = [
  "Cheap cPanel hosting for a small WordPress site",
  "Business site with email and SSL, ~10,000 visitors/month",
  "E-commerce store needing more speed and storage",
];

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
    <div className="max-w-2xl mx-auto stitch-card shadow-glow border-violet-500/20 space-y-5">
      <div>
        <h3 className="font-display text-xl font-bold stitch-fg">AI Hosting Recommendation</h3>
        <p className="text-sm stitch-muted-fg mt-1 leading-relaxed">
          Describe your project and we&apos;ll recommend the best package from our reseller catalog.
        </p>
      </div>

      <div className="space-y-3">
        <label htmlFor="hosting-need" className="sr-only">
          Describe your hosting needs
        </label>
        <textarea
          id="hosting-need"
          className="stitch-textarea"
          placeholder="e.g. Cheap cPanel hosting for a WordPress clinic site, ~5,000 visitors/month, need email and SSL…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => setDescription(prompt)}
              className="rounded-full border border-stitch-outline bg-white px-3 py-1.5 text-xs text-stitch-muted transition hover:border-stitch-primary hover:text-stitch-primary disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <Button
        disabled={loading || description.trim().length < 3}
        onClick={recommend}
        className="rounded-full bg-gradient-accent px-8 text-white shadow-glow hover:opacity-90"
      >
        {loading ? "Analyzing…" : "Recommend a plan"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <p className="text-sm stitch-muted-fg leading-relaxed border-t border-stitch-outline pt-4">
          {summary.replace(/\*\*/g, "")}
        </p>
      )}

      {rec && (
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 space-y-3">
          <p className="text-xs uppercase tracking-wide text-violet-700 font-semibold">
            Recommended
          </p>
          <p className="font-display text-lg font-semibold stitch-fg">{rec.name}</p>
          <p className="text-sm stitch-muted-fg">{rec.description}</p>
          <p className="text-base font-semibold stitch-fg">
            {formatMoney(rec.priceCents, rec.currency)}
            <span className="text-sm font-normal stitch-muted-fg">
              {" "}
              / {rec.billingPeriod.toLowerCase()}
            </span>
          </p>
          <ul className="text-sm stitch-muted-fg list-disc pl-4 space-y-1">
            {rec.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/hosting">View hosting plans</Link>
          </Button>
        </div>
      )}

      {alts.length > 0 && (
        <div className="space-y-2 border-t border-stitch-outline pt-4">
          <p className="text-xs stitch-muted-fg uppercase tracking-wide font-medium">
            Alternatives
          </p>
          {alts.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-stitch-outline bg-white px-4 py-3 text-sm"
            >
              <span className="font-medium stitch-fg">{a.name}</span>
              <span className="stitch-muted-fg"> — {formatMoney(a.priceCents, a.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
