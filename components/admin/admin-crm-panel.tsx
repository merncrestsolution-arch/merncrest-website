"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Lead = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  stage: string;
  source: string;
  valueCents: number;
  notes?: string | null;
  activities: { id: string; type: string; body: string; createdAt: string }[];
};

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;

export function AdminCrmPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    interest: "",
  });
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setLeads(data.leads ?? []);
      setPipeline(data.pipeline ?? {});
      setSelected((prev) => prev || data.leads?.[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({ fullName: "", email: "", phone: "", company: "", interest: "" });
      setSelected(data.lead.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStage(stage: string) {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selected, stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !note.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selected,
          activity: { type: "NOTE", body: note },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const active = leads.find((l) => l.id === selected);

  if (loading) return <p className="text-sm text-muted">Loading CRM…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STAGES.map((s) => (
          <div key={s} className="rounded-lg border border-white/10 p-3 text-center">
            <p className="text-[10px] font-mono uppercase text-muted">{s}</p>
            <p className="font-display text-xl font-bold mt-1">{pipeline[s] ?? 0}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <form onSubmit={createLead} className="rounded-xl border border-white/10 p-4 space-y-2">
            <h3 className="font-display font-semibold text-sm">New lead</h3>
            <input required placeholder="Name" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
            <input required type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
            <input placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
            <input placeholder="Company" value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
            <input placeholder="Interest" value={form.interest}
              onChange={(e) => setForm({ ...form, interest: e.target.value })}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
            <Button type="submit" size="sm" disabled={busy}>Add lead</Button>
          </form>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {leads.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setSelected(l.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                    selected === l.id ? "border-accent/50 bg-accent/10" : "border-white/10"
                  }`}
                >
                  <p className="font-medium truncate">{l.fullName}</p>
                  <p className="text-xs text-muted">{l.stage} · {l.source}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {active ? (
          <div className="rounded-xl border border-white/10 p-5 space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold">{active.fullName}</h2>
              <p className="text-sm text-muted">
                {active.email}
                {active.phone ? ` · ${active.phone}` : ""}
                {active.company ? ` · ${active.company}` : ""}
              </p>
              <p className="text-sm mt-1">{active.interest || "—"} · {formatMoney(active.valueCents)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={active.stage === s ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => setStage(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <form onSubmit={addNote} className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add activity note…"
                className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
              />
              <Button type="submit" disabled={busy}>Log</Button>
            </form>
            <ul className="space-y-2 max-h-[280px] overflow-y-auto">
              {active.activities.map((a) => (
                <li key={a.id} className="text-sm border-b border-white/5 pb-2">
                  <span className="font-mono text-xs text-accent">{a.type}</span>
                  <p className="mt-0.5">{a.body}</p>
                  <p className="text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted text-sm">Select a lead</p>
        )}
      </div>
    </div>
  );
}
