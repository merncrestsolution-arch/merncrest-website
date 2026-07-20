"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";
import { CRM_KANBAN_STAGES, CRM_STAGE_LABELS, type CrmStage } from "@/lib/crm/stages";

type Lead = {
  id: string;
  leadNumber?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  stage: string;
  source: string;
  valueCents: number;
  budgetCents?: number;
  priority?: string;
  leadScore?: number;
  notes?: string | null;
  timeline?: string | null;
  followUpAt?: string | null;
  owner?: { fullName: string } | null;
  activities: { id: string; type: string; body: string; createdAt: string }[];
  followUps?: { id: string; title: string; type: string; dueAt: string; status: string }[];
  meetings?: { id: string; title: string; scheduledAt: string; status: string }[];
};

type HubFeedItem = {
  id: string;
  channel: string;
  title: string;
  body: string;
  at: string;
};

export function AdminCrmPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"kanban" | "list" | "hub">("kanban");
  const [hubFeed, setHubFeed] = useState<HubFeedItem[]>([]);
  const [hubStats, setHubStats] = useState<Record<string, number | null>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    interest: "",
  });
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState({
    title: "",
    type: "CALL",
    dueAt: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [crmRes, hubRes] = await Promise.all([
        fetch("/api/crm"),
        fetch("/api/admin/communication-hub?limit=30"),
      ]);
      const crm = await crmRes.json();
      const hub = await hubRes.json();
      if (!crmRes.ok) throw new Error(crm.error || "Failed");
      setLeads(crm.leads ?? []);
      setPipeline(crm.pipeline ?? {});
      setKpis(crm.kpis ?? {});
      setSelected((prev) => prev || crm.leads?.[0]?.id || null);
      if (hubRes.ok) {
        setHubFeed(hub.feed ?? []);
        setHubStats(hub.stats ?? {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedLead = leads.find((l) => l.id === selected) || null;

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

  async function setStage(leadId: string, stage: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
      setDragId(null);
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
          activity: { type: "NOTE", body: note.trim() },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function scheduleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !followUp.title || !followUp.dueAt) return;
    setBusy(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "followup",
          leadId: selected,
          ...followUp,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setFollowUp({ title: "", type: "CALL", dueAt: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function quickQuote() {
    if (!selectedLead) return;
    setBusy(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          customerName: selectedLead.fullName,
          customerEmail: selectedLead.email,
          company: selectedLead.company,
          items: [
            {
              description: selectedLead.interest || "MernCrest services",
              quantity: 1,
              unitPriceCents: selectedLead.valueCents || 5000000,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error("Quote failed");
      await setStage(selectedLead.id, "QUOTATION");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading CRM…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Sales CRM</h2>
          <p className="text-sm text-muted">
            Omnichannel leads — every WhatsApp, chat, IVR, and form lands here.
          </p>
        </div>
        <div className="flex gap-2">
          {(["kanban", "list", "hub"] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? "default" : "outline"}
              onClick={() => setView(v)}
            >
              {v === "kanban" ? "Kanban" : v === "list" ? "List" : "Comm Hub"}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Leads", value: kpis.totalLeads ?? leads.length },
          { label: "Won", value: kpis.won ?? pipeline.WON ?? 0 },
          { label: "Conversion %", value: kpis.conversionRate ?? 0 },
          { label: "Avg score", value: kpis.avgLeadScore ?? 0 },
          { label: "Overdue follow-ups", value: kpis.overdueFollowUps ?? 0 },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-muted uppercase font-mono">{k.label}</p>
            <p className="font-display text-2xl font-bold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {view === "hub" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-4 gap-3 text-sm">
            <Stat label="Open chats" value={hubStats.openChats} />
            <Stat label="Open tickets" value={hubStats.openTickets} />
            <Stat label="Missed calls" value={hubStats.missedCalls} />
            <Stat label="Avg CSAT" value={hubStats.avgCsat ?? "—"} />
          </div>
          <ul className="space-y-2 max-h-[480px] overflow-y-auto">
            {hubFeed.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-mono text-violet-300 uppercase">{f.channel}</span>
                  <span className="text-xs text-muted">
                    {new Date(f.at).toLocaleString()}
                  </span>
                </div>
                <p className="font-medium mt-1">{f.title}</p>
                <p className="text-muted text-xs mt-0.5">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-2 min-h-[420px]">
          {CRM_KANBAN_STAGES.map((stage) => {
            const col = leads.filter((l) => l.stage === stage);
            return (
              <div
                key={stage}
                className="w-64 shrink-0 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) void setStage(dragId, stage);
                }}
              >
                <div className="px-3 py-2 border-b border-white/10 flex justify-between">
                  <span className="text-xs font-semibold">
                    {CRM_STAGE_LABELS[stage as CrmStage] || stage}
                  </span>
                  <span className="text-xs text-muted">{col.length}</span>
                </div>
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[520px]">
                  {col.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onClick={() => setSelected(l.id)}
                      className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                        selected === l.id
                          ? "border-violet-400/50 bg-violet-500/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <p className="font-medium truncate">{l.fullName}</p>
                      <p className="text-xs text-muted truncate">{l.company || l.email}</p>
                      <div className="flex justify-between mt-2 text-xs text-muted">
                        <span>Score {l.leadScore ?? 0}</span>
                        <span>{formatMoney(l.valueCents)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <ul className="space-y-2 max-h-[480px] overflow-y-auto">
            {leads.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setSelected(l.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                    selected === l.id
                      ? "border-violet-400/50 bg-violet-500/10"
                      : "border-white/10"
                  }`}
                >
                  <span className="font-mono text-xs text-accent">{l.leadNumber || l.id.slice(0, 8)}</span>
                  <p className="font-medium">{l.fullName}</p>
                  <p className="text-xs text-muted">
                    {l.stage} · {l.source} · score {l.leadScore ?? 0}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={createLead} className="rounded-xl border border-white/10 p-4 space-y-3">
          <h3 className="font-semibold text-sm">New lead</h3>
          {(
            [
              ["fullName", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["company", "Company"],
              ["interest", "Interest"],
            ] as const
          ).map(([key, label]) => (
            <input
              key={key}
              required={key === "fullName" || key === "email"}
              placeholder={label}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <Button type="submit" disabled={busy} size="sm">
            Create lead
          </Button>
        </form>

        {selectedLead && (
          <div className="rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-display font-bold">{selectedLead.fullName}</p>
                <p className="text-xs text-muted font-mono">
                  {selectedLead.leadNumber} · {selectedLead.email}
                </p>
                <p className="text-xs text-muted mt-1">
                  {selectedLead.company || "—"} · {selectedLead.source} · Priority{" "}
                  {selectedLead.priority || "MEDIUM"}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>Score {selectedLead.leadScore ?? 0}</p>
                <p>{formatMoney(selectedLead.valueCents)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {CRM_KANBAN_STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => setStage(selectedLead.id, s)}
                  className={`text-[10px] px-2 py-1 rounded border ${
                    selectedLead.stage === s
                      ? "border-violet-400 bg-violet-500/20"
                      : "border-white/10 text-muted"
                  }`}
                >
                  {CRM_STAGE_LABELS[s]}
                </button>
              ))}
            </div>

            <form onSubmit={addNote} className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Add note / call log…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={busy}>
                Log
              </Button>
            </form>

            <form onSubmit={scheduleFollowUp} className="grid sm:grid-cols-3 gap-2">
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm sm:col-span-3"
                placeholder="Follow-up title"
                value={followUp.title}
                onChange={(e) => setFollowUp({ ...followUp, title: e.target.value })}
              />
              <select
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                value={followUp.type}
                onChange={(e) => setFollowUp({ ...followUp, type: e.target.value })}
              >
                {["CALL", "WHATSAPP", "EMAIL", "MEETING", "DEMO", "REMINDER", "ESCALATION"].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
              <input
                type="datetime-local"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                value={followUp.dueAt}
                onChange={(e) => setFollowUp({ ...followUp, dueAt: e.target.value })}
              />
              <Button type="submit" size="sm" disabled={busy}>
                Schedule
              </Button>
            </form>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={quickQuote}>
                Generate quotation
              </Button>
            </div>

            {(selectedLead.followUps?.length || 0) > 0 && (
              <div>
                <p className="text-xs text-muted uppercase mb-1">Follow-ups</p>
                <ul className="text-xs space-y-1">
                  {selectedLead.followUps?.map((f) => (
                    <li key={f.id}>
                      {f.type} · {f.title} · {f.status} ·{" "}
                      {new Date(f.dueAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs text-muted uppercase mb-1">Activity</p>
              <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                {selectedLead.activities.map((a) => (
                  <li key={a.id} className="border-b border-white/5 py-1">
                    <span className="text-violet-300">{a.type}</span> · {a.body}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold mt-1">{value ?? "—"}</p>
    </div>
  );
}
