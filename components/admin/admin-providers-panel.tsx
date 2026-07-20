"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Provider = {
  id: string;
  name: string;
  code: string;
  apiUrl: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  supportedServices: string;
  status: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  defaultMarginCents: number;
  notes: string | null;
  _count?: { products: number; domains: number; hostingAccounts: number };
};

type Margin = {
  id: string;
  category: string;
  marginCents: number;
  marginPercent: number;
  marginMode?: string;
  fxBufferPercent?: number;
};

const SERVICES = ["domains", "hosting", "vps", "ssl", "email", "cloud"] as const;

export function AdminProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [margins, setMargins] = useState<Margin[]>([]);
  const [fx, setFx] = useState({ usdLkrRate: 320, defaultFxBufferPercent: 2 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    apiUrl: "",
    apiKey: "",
    apiSecret: "",
    supportedServices: ["domains", "hosting"] as string[],
    defaultMarginCents: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/admin/providers"),
        fetch("/api/admin/pricing-margins"),
      ]);
      const pData = await pRes.json();
      const mData = await mRes.json();
      if (!pRes.ok) throw new Error(pData.error || "Failed to load providers");
      if (!mRes.ok) throw new Error(mData.error || "Failed to load margins");
      setProviders(pData.providers ?? []);
      setMargins(mData.margins ?? []);
      if (mData.fx) setFx(mData.fx);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createProvider() {
    setBusy("create");
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          apiUrl: form.apiUrl || null,
          apiKey: form.apiKey || null,
          apiSecret: form.apiSecret || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setMessage(`Provider ${data.provider.name} created`);
      setForm({
        name: "",
        code: "",
        apiUrl: "",
        apiKey: "",
        apiSecret: "",
        supportedServices: ["domains", "hosting"],
        defaultMarginCents: 0,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(null);
    }
  }

  async function syncProvider(providerId: string) {
    setBusy(providerId);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setMessage(data.message || "Synced");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  async function toggleStatus(p: Provider) {
    setBusy(p.id);
    try {
      await fetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function saveMargin(
    category: string,
    marginCents: number,
    marginPercent: number,
    marginMode: string,
    fxBufferPercent: number
  ) {
    setBusy(`margin-${category}`);
    setMessage("");
    try {
      const res = await fetch("/api/admin/pricing-margins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          marginCents,
          marginPercent,
          marginMode,
          fxBufferPercent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(`Margin updated for ${category}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveFx() {
    setBusy("fx");
    setMessage("");
    try {
      const res = await fetch("/api/admin/pricing-margins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fx),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "FX save failed");
      if (data.fx) setFx(data.fx);
      setMessage("FX rate / buffer saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "FX save failed");
    } finally {
      setBusy(null);
    }
  }

  function parseServices(json: string) {
    try {
      return JSON.parse(json) as string[];
    } catch {
      return [];
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading providers…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold">Reseller Providers</h2>
        <p className="text-sm text-muted mt-1">
          Customer → MernCrest → Provider API → Service. Configure multiple providers (A/B/C) without owning infrastructure.
        </p>
      </div>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add provider</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Provider Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Code (e.g. provider-a)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="API URL"
            value={form.apiUrl}
            onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
          />
          <input
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Default margin (cents)"
            type="number"
            value={form.defaultMarginCents}
            onChange={(e) =>
              setForm({ ...form, defaultMarginCents: Number(e.target.value) || 0 })
            }
          />
          <input
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="API Key"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          />
          <input
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="API Secret"
            value={form.apiSecret}
            onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = form.supportedServices.includes(s);
            return (
              <button
                key={s}
                type="button"
                className={`text-xs rounded-full px-3 py-1 border ${
                  on ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 text-muted"
                }`}
                onClick={() =>
                  setForm({
                    ...form,
                    supportedServices: on
                      ? form.supportedServices.filter((x) => x !== s)
                      : [...form.supportedServices, s],
                  })
                }
              >
                {s}
              </button>
            );
          })}
        </div>
        <Button disabled={busy === "create" || !form.name || !form.code} onClick={createProvider}>
          {busy === "create" ? "Saving…" : "Create provider"}
        </Button>
      </div>

      <div className="space-y-3">
        {providers.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted font-mono mt-0.5">{p.code}</p>
                <p className="text-xs text-muted mt-1">
                  Status {p.status} · Sync {p.syncStatus}
                  {p.lastSyncedAt
                    ? ` · Last sync ${new Date(p.lastSyncedAt).toLocaleString()}`
                    : ""}
                </p>
                <p className="text-xs text-muted mt-1">
                  Services: {parseServices(p.supportedServices).join(", ") || "—"}
                </p>
                <p className="text-xs text-muted">
                  Products {p._count?.products ?? 0} · Domains {p._count?.domains ?? 0} · Hosting{" "}
                  {p._count?.hostingAccounts ?? 0}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy === p.id} onClick={() => syncProvider(p.id)}>
                  {busy === p.id ? "…" : "Sync products"}
                </Button>
                <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => toggleStatus(p)}>
                  {p.status === "ACTIVE" ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
            {p.apiUrl && <p className="text-xs text-muted truncate">API: {p.apiUrl}</p>}
          </div>
        ))}
        {providers.length === 0 && (
          <p className="text-sm text-muted">No providers yet. Seed or create one above.</p>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold">Pricing Engine Margins</h3>
        <p className="text-sm text-muted mt-1 mb-4">
          Selling (LKR) = FX(Provider USD→LKR + buffer) + Margin. Existing stored margin values are
          not rewritten when you change mode — only how they apply.
        </p>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-4 grid sm:grid-cols-3 gap-3 items-end">
          <label className="block text-xs text-muted">
            USD → LKR rate
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              value={fx.usdLkrRate}
              onChange={(e) => setFx({ ...fx, usdLkrRate: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="block text-xs text-muted">
            Default FX buffer %
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              value={fx.defaultFxBufferPercent}
              onChange={(e) =>
                setFx({ ...fx, defaultFxBufferPercent: Number(e.target.value) || 0 })
              }
            />
          </label>
          <Button size="sm" disabled={busy === "fx"} onClick={() => saveFx()}>
            {busy === "fx" ? "…" : "Save FX"}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {margins.map((m) => (
            <MarginCard
              key={m.id}
              margin={m}
              busy={busy === `margin-${m.category}`}
              onSave={saveMargin}
            />
          ))}
        </div>
        <p className="text-xs text-muted mt-3">
          Example LKR: Provider Rs.1,900 + Margin Rs.300 = Selling Rs.2,200
          {" · "}
          USD products default to percent margin at quote time when a percent is configured.
        </p>
      </div>
    </div>
  );
}

function MarginCard({
  margin,
  busy,
  onSave,
}: {
  margin: Margin;
  busy: boolean;
  onSave: (
    category: string,
    marginCents: number,
    marginPercent: number,
    marginMode: string,
    fxBufferPercent: number
  ) => void;
}) {
  const [cents, setCents] = useState(margin.marginCents);
  const [percent, setPercent] = useState(margin.marginPercent);
  const [mode, setMode] = useState(margin.marginMode || "FIXED");
  const [fxBuf, setFxBuf] = useState(margin.fxBufferPercent ?? 2);

  useEffect(() => {
    setCents(margin.marginCents);
    setPercent(margin.marginPercent);
    setMode(margin.marginMode || "FIXED");
    setFxBuf(margin.fxBufferPercent ?? 2);
  }, [margin.marginCents, margin.marginPercent, margin.marginMode, margin.fxBufferPercent]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
      <p className="text-sm font-semibold capitalize">{margin.category}</p>
      <label className="block text-xs text-muted">
        Margin mode
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="FIXED">Fixed (LKR cents)</option>
          <option value="PERCENT">Percent (recommended for USD)</option>
          <option value="BOTH">Both</option>
        </select>
      </label>
      <label className="block text-xs text-muted">
        Fixed margin (cents)
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={cents}
          onChange={(e) => setCents(Number(e.target.value) || 0)}
        />
      </label>
      <p className="text-xs text-muted">≈ {formatMoney(cents)}</p>
      <label className="block text-xs text-muted">
        Percent margin
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value) || 0)}
        />
      </label>
      <label className="block text-xs text-muted">
        FX buffer %
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={fxBuf}
          onChange={(e) => setFxBuf(Number(e.target.value) || 0)}
        />
      </label>
      <Button
        size="sm"
        disabled={busy}
        onClick={() => onSave(margin.category, cents, percent, mode, fxBuf)}
      >
        {busy ? "…" : "Save"}
      </Button>
    </div>
  );
}
