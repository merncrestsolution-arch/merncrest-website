"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  leadScore?: number;
  tagsJson?: string | null;
  wonReason?: string | null;
  lostReason?: string | null;
  owner?: { fullName: string } | null;
  activities: { id: string; type: string; body: string; createdAt: string }[];
};

type Tab = "pipeline" | "timeline" | "analytics" | "reports" | "whatsapp" | "import";

export function SystemCrmPanel() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [analytics, setAnalytics] = useState<{
    totals?: { winRate: number; wonValueCents: number; won: number; lost: number };
    bySource?: { source: string; _count: { _all: number }; _sum: { valueCents: number | null } }[];
    byStage?: { stage: string; _count: { _all: number }; _sum: { valueCents: number | null } }[];
    byCustomer?: { name: string; email: string; cents: number }[];
    byProduct?: { name: string; cents: number; qty: number }[];
    byRegion?: { region: string; cents: number; orders: number }[];
    reportPresets?: { id: string; label: string }[];
  }>({});
  const [reportId, setReportId] = useState("pipeline");
  const [reportRows, setReportRows] = useState<unknown[]>([]);
  const [designer, setDesigner] = useState({
    dimension: "stage" as "stage" | "source" | "wonReason" | "lostReason" | "priority" | "owner",
    metric: "count" as "count" | "valueCents" | "avgScore",
    chart: "bar" as "table" | "bar" | "pie",
    from: "",
    to: "",
  });
  const [chartBars, setChartBars] = useState<{ label: string; value: number; pct: number }[]>([]);
  const [waMediaUrl, setWaMediaUrl] = useState("");
  const [waMediaType, setWaMediaType] = useState<"image" | "document" | "video">("document");
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", company: "", interest: "" });
  const [closeReason, setCloseReason] = useState("");
  const [csv, setCsv] = useState("");
  const [dupes, setDupes] = useState<{ key: string; leads: Lead[] }[]>([]);
  const [wa, setWa] = useState<{
    conversations: { id: string; phone: string; customerName: string | null; status: string; unreadCount: number }[];
    messages: { id: string; phone: string; direction: string; body: string; status: string; createdAt: string }[];
    templates: { id: string; name: string; body: string; status?: string }[];
    automations: { id: string; name: string; trigger: string; bodyTemplate: string; active: boolean }[];
    business?: {
      businessNumber: string;
      clickToChat: string;
      fullAutomation: boolean;
      active: boolean;
      provider: string;
    };
    status?: {
      metaReady: boolean;
      apiVersion: string;
      qualityRating: string | null;
      checklist: { id: string; label: string; ok: boolean }[];
      counts: {
        templates: number;
        templatesApproved: number;
        automationsActive: number;
        conversations: number;
        messages24h: number;
      };
      lastInboundAt: string | null;
      webhookUrlHint: string;
    };
  }>({ conversations: [], messages: [], templates: [], automations: [] });
  const [waPhone, setWaPhone] = useState("");
  const [waReply, setWaReply] = useState("");
  const [tplForm, setTplForm] = useState({ name: "", body: "" });
  const [bulkPhones, setBulkPhones] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  const [quoteId, setQuoteId] = useState("");

  const load = useCallback(async () => {
    try {
      const [crmRes, anRes] = await Promise.all([
        fetch("/api/crm"),
        fetch("/api/crm/analytics"),
      ]);
      const crm = await crmRes.json();
      const an = await anRes.json();
      if (!crmRes.ok) throw new Error(crm.error || "CRM failed");
      setLeads(crm.leads ?? []);
      setPipeline(crm.pipeline ?? {});
      setKpis(crm.kpis ?? {});
      if (anRes.ok) setAnalytics(an);
      if (!selected && crm.leads?.[0]) setSelected(crm.leads[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, [selected]);

  const loadWa = useCallback(async (phone?: string) => {
    const res = await fetch(`/api/crm/whatsapp${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`);
    const data = await res.json();
    if (res.ok) {
      setWa({
        conversations: data.conversations ?? [],
        messages: data.messages ?? [],
        templates: data.templates ?? [],
        automations: data.automations ?? [],
        business: data.business,
        status: data.status,
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "whatsapp") loadWa(waPhone || undefined);
  }, [tab, waPhone, loadWa]);

  const active = leads.find((l) => l.id === selected);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (stageFilter && l.stage !== stageFilter) return false;
      if (tagFilter) {
        try {
          const tags = l.tagsJson ? (JSON.parse(l.tagsJson) as string[]) : [];
          if (!tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
        } catch {
          return false;
        }
      }
      if (!q) return true;
      const hay = `${l.fullName} ${l.email} ${l.phone || ""} ${l.company || ""} ${l.leadNumber || ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [leads, q, stageFilter, tagFilter]);

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
      await load();
      setSelected(data.lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStage(leadId: string, stage: CrmStage) {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { leadId, stage };
      if (stage === "WON" && closeReason) payload.wonReason = closeReason;
      if (stage === "LOST" && closeReason) payload.lostReason = closeReason;
      const res = await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      setCloseReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addTag(tag: string) {
    if (!active || !tag.trim()) return;
    let tags: string[] = [];
    try {
      tags = active.tagsJson ? JSON.parse(active.tagsJson) : [];
    } catch {
      tags = [];
    }
    if (!tags.includes(tag.trim())) tags.push(tag.trim());
    await fetch("/api/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: active.id, tags }),
    });
    await load();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "pipeline", label: "Sales pipeline" },
    { id: "timeline", label: "Communication" },
    { id: "analytics", label: "Revenue analytics" },
    { id: "reports", label: "Reports" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "import", label: "Import / merge" },
  ];

  return (
    <div>
      <h1 className="rlk-welcome">CRM</h1>
      <p className="rlk-empty !mb-4">
        Customers · pipeline · quotes · WhatsApp · System.merncrest.lk
      </p>
      {error ? <p className="rlk-login-error !mb-4">{error}</p> : null}

      <div className="rlk-stats !mb-5">
        <div className="rlk-stat">
          <div className="rlk-stat-num">{kpis.totalLeads ?? leads.length}</div>
          <div className="rlk-stat-label">Leads</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num">{kpis.won ?? 0}</div>
          <div className="rlk-stat-label">Won</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num">{kpis.conversionRate ?? 0}%</div>
          <div className="rlk-stat-label">Conversion</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num">{analytics.totals?.winRate ?? 0}%</div>
          <div className="rlk-stat-label">Win rate</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              tab === t.id
                ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && (
        <>
          <section className="rlk-section rlk-section-accent-orange">
            <div className="rlk-section-head">
              <h2>New lead</h2>
            </div>
            <div className="rlk-section-body">
              <form onSubmit={createLead} className="grid sm:grid-cols-3 gap-2">
                <input className="rlk-input" required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <input className="rlk-input" required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className="rlk-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="rlk-input" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                <input className="rlk-input" placeholder="Interest" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} />
                <button type="submit" className="rlk-btn-green !mt-0" disabled={busy}>Create lead</button>
              </form>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 mb-3">
            <input className="rlk-input !w-auto min-w-[200px]" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="rlk-input !w-auto" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {CRM_KANBAN_STAGES.map((s) => (
                <option key={s} value={s}>{CRM_STAGE_LABELS[s]}</option>
              ))}
            </select>
            <input className="rlk-input !w-auto" placeholder="Tag filter" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-4">
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {CRM_KANBAN_STAGES.map((stage) => (
                  <section key={stage} className="rlk-section rlk-section-accent-teal !mb-0 w-[220px] shrink-0">
                    <div className="rlk-section-head">
                      <h2 className="!text-[12px]">{CRM_STAGE_LABELS[stage]}</h2>
                      <span className="rlk-badge rlk-badge-hold">{pipeline[stage] || 0}</span>
                    </div>
                    <div className="rlk-section-body !py-2 max-h-[420px] overflow-y-auto">
                      {filtered.filter((l) => l.stage === stage).map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          className={`rlk-shortcut w-full text-left !flex-col !items-start ${selected === l.id ? "!text-[#17a2b8]" : ""}`}
                          onClick={() => setSelected(l.id)}
                        >
                          <span className="font-medium">{l.fullName}</span>
                          <span className="text-[11px]" style={{ color: "var(--rlk-text-muted)" }}>
                            {l.company || l.email} · {formatMoney(l.valueCents)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <section className="rlk-section rlk-section-accent-green !mb-0">
              <div className="rlk-section-head">
                <h2>Lead detail</h2>
              </div>
              <div className="rlk-section-body">
                {!active ? (
                  <p className="rlk-empty">Select a lead</p>
                ) : (
                  <>
                    <p className="rlk-mono">{active.leadNumber}</p>
                    <p className="font-medium text-[15px]">{active.fullName}</p>
                    <p className="rlk-empty">{active.email} · {active.phone || "—"}</p>
                    <p className="rlk-empty !mb-2">{active.company} · score {active.leadScore ?? 0}</p>
                    {active.wonReason ? <p className="text-[12px]" style={{ color: "var(--rlk-green)" }}>Won: {active.wonReason}</p> : null}
                    {active.lostReason ? <p className="text-[12px]" style={{ color: "#721c24" }}>Lost: {active.lostReason}</p> : null}
                    <div className="flex flex-wrap gap-1 my-2">
                      {(() => {
                        try {
                          return (active.tagsJson ? JSON.parse(active.tagsJson) : []).map((t: string) => (
                            <span key={t} className="rlk-badge rlk-badge-open">{t}</span>
                          ));
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                    <form
                      className="flex gap-1 mb-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        addTag(String(fd.get("tag") || ""));
                        e.currentTarget.reset();
                      }}
                    >
                      <input name="tag" className="rlk-input" placeholder="Add tag" />
                      <button type="submit" className="rlk-btn-ghost !w-auto !mt-0 !px-2">Tag</button>
                    </form>
                    <input
                      className="rlk-input mb-2"
                      placeholder="Win/loss reason"
                      value={closeReason}
                      onChange={(e) => setCloseReason(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1">
                      {(["QUALIFIED", "QUOTATION", "NEGOTIATION", "WON", "LOST", "ON_HOLD"] as CrmStage[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="rlk-btn-sm"
                          disabled={busy}
                          onClick={() => setStage(active.id, s)}
                        >
                          → {CRM_STAGE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      <p className="text-[12px] font-semibold mb-1">Recent activity</p>
                      {active.activities?.slice(0, 6).map((a) => (
                        <div key={a.id} className="rlk-row !flex-col !items-start">
                          <span className="rlk-badge rlk-badge-hold">{a.type}</span>
                          <span>{a.body}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {tab === "timeline" && (
        <section className="rlk-section rlk-section-accent-teal">
          <div className="rlk-section-head">
            <h2>Communication timeline</h2>
          </div>
          <div className="rlk-section-body">
            {leads.flatMap((l) =>
              (l.activities || []).map((a) => ({ ...a, lead: l.fullName }))
            )
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 40)
              .map((a) => (
                <div key={a.id} className="rlk-row">
                  <span>
                    <strong>{a.lead}</strong> · {a.body}
                  </span>
                  <span className="rlk-badge rlk-badge-hold">{a.type}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {tab === "analytics" && (
        <>
          <section className="rlk-section rlk-section-accent-green">
            <div className="rlk-section-head">
              <h2>Win / loss analysis</h2>
            </div>
            <div className="rlk-section-body">
              <div className="rlk-stats !mb-0" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="rlk-stat">
                  <div className="rlk-stat-num">{analytics.totals?.won ?? 0}</div>
                  <div className="rlk-stat-label">Won</div>
                </div>
                <div className="rlk-stat">
                  <div className="rlk-stat-num">{analytics.totals?.lost ?? 0}</div>
                  <div className="rlk-stat-label">Lost</div>
                </div>
                <div className="rlk-stat">
                  <div className="rlk-stat-num">{formatMoney(analytics.totals?.wonValueCents ?? 0)}</div>
                  <div className="rlk-stat-label">Won revenue</div>
                </div>
              </div>
              <div className="mt-4">
                {leads
                  .filter((l) => l.stage === "WON" || l.stage === "LOST")
                  .slice(0, 20)
                  .map((l) => (
                    <div key={l.id} className="rlk-row">
                      <span>
                        {l.fullName} · {l.stage}
                        {l.wonReason || l.lostReason
                          ? ` — ${l.wonReason || l.lostReason}`
                          : ""}
                      </span>
                      <span>{formatMoney(l.valueCents)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </section>
          <section className="rlk-section rlk-section-accent-teal">
            <div className="rlk-section-head">
              <h2>By customer / product / region</h2>
            </div>
            <div className="rlk-section-body grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-[12px] font-semibold mb-2">Customers</p>
                {(analytics.byCustomer || []).slice(0, 8).map((c) => (
                  <div key={c.email} className="rlk-row">
                    <span>{c.name}</span>
                    <span>{formatMoney(c.cents)}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[12px] font-semibold mb-2">Products</p>
                {(analytics.byProduct || []).slice(0, 8).map((p) => (
                  <div key={p.name} className="rlk-row">
                    <span>{p.name}</span>
                    <span>{formatMoney(p.cents)}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[12px] font-semibold mb-2">Regions</p>
                {(analytics.byRegion || []).slice(0, 8).map((r) => (
                  <div key={r.region} className="rlk-row">
                    <span>{r.region}</span>
                    <span>{formatMoney(r.cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="rlk-section rlk-section-accent-orange">
            <div className="rlk-section-head">
              <h2>By source / stage</h2>
            </div>
            <div className="rlk-section-body grid sm:grid-cols-2 gap-4">
              <div>
                {(analytics.bySource || []).map((s) => (
                  <div key={s.source} className="rlk-row">
                    <span>{s.source}</span>
                    <span>
                      {s._count._all} · {formatMoney(s._sum.valueCents ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                {(analytics.byStage || []).map((s) => (
                  <div key={s.stage} className="rlk-row">
                    <span>{s.stage}</span>
                    <span>
                      {s._count._all} · {formatMoney(s._sum.valueCents ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {tab === "reports" && (
        <section className="rlk-section rlk-section-accent-orange">
          <div className="rlk-section-head">
            <h2>Visual report designer</h2>
          </div>
          <div className="rlk-section-body">
            <p className="rlk-empty !mb-3">Presets or build a custom chart by dimension + metric.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {(analytics.reportPresets || [
                { id: "pipeline", label: "Pipeline by stage" },
                { id: "winloss", label: "Win / loss" },
                { id: "revenue_customer", label: "Revenue by customer" },
                { id: "revenue_product", label: "Revenue by product" },
                { id: "revenue_region", label: "Revenue by region" },
                { id: "source", label: "Leads by source" },
              ]).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={
                    reportId === p.id
                      ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                      : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
                  }
                  onClick={async () => {
                    setReportId(p.id);
                    const res = await fetch(`/api/crm/analytics?report=${p.id}`);
                    const data = await res.json();
                    setReportRows(data.rows ?? []);
                    setChartBars([]);
                    setAnalytics((prev) => ({ ...prev, ...data }));
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
              <select
                className="rlk-input"
                value={designer.dimension}
                onChange={(e) =>
                  setDesigner({ ...designer, dimension: e.target.value as typeof designer.dimension })
                }
              >
                {["stage", "source", "wonReason", "lostReason", "priority", "owner"].map((d) => (
                  <option key={d} value={d}>
                    Group: {d}
                  </option>
                ))}
              </select>
              <select
                className="rlk-input"
                value={designer.metric}
                onChange={(e) =>
                  setDesigner({ ...designer, metric: e.target.value as typeof designer.metric })
                }
              >
                <option value="count">Metric: count</option>
                <option value="valueCents">Metric: pipeline value</option>
                <option value="avgScore">Metric: avg score</option>
              </select>
              <select
                className="rlk-input"
                value={designer.chart}
                onChange={(e) =>
                  setDesigner({ ...designer, chart: e.target.value as typeof designer.chart })
                }
              >
                <option value="bar">Bar chart</option>
                <option value="pie">Pie (share %)</option>
                <option value="table">Table</option>
              </select>
              <input
                type="date"
                className="rlk-input"
                value={designer.from}
                onChange={(e) => setDesigner({ ...designer, from: e.target.value })}
              />
              <input
                type="date"
                className="rlk-input"
                value={designer.to}
                onChange={(e) => setDesigner({ ...designer, to: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="rlk-btn-green !w-auto !mt-0 mb-4"
              onClick={async () => {
                setBusy(true);
                const res = await fetch("/api/crm/analytics", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(designer),
                });
                const data = await res.json();
                setReportId("designer");
                setReportRows(data.rows ?? []);
                setChartBars(data.chart?.bars ?? []);
                setBusy(false);
              }}
              disabled={busy}
            >
              Run designer
            </button>

            {chartBars.length > 0 && designer.chart !== "table" && (
              <div className="mb-4 space-y-2 border border-[var(--rlk-border)] rounded p-3">
                {chartBars.slice(0, 12).map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-[12px] mb-0.5">
                      <span>{b.label}</span>
                      <span>
                        {designer.metric === "valueCents" ? formatMoney(b.value) : b.value}
                        {designer.chart === "pie" ? ` (${b.pct}%)` : ""}
                      </span>
                    </div>
                    <div className="h-2 bg-[#eef2f4] rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${Math.max(4, b.pct)}%`,
                          background: "var(--rlk-teal, #17a2b8)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-[var(--rlk-border)] rounded p-3 max-h-[420px] overflow-y-auto">
              {reportRows.length === 0 ? (
                <p className="rlk-empty">Run a preset or the designer to load rows.</p>
              ) : (
                reportRows.slice(0, 40).map((row, i) => (
                  <pre key={i} className="text-[11px] border-b border-[var(--rlk-border)] py-1 overflow-x-auto">
                    {JSON.stringify(row)}
                  </pre>
                ))
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-[11px] block mb-1">Download proposal PDF</label>
                <input
                  className="rlk-input !w-56"
                  placeholder="Quotation ID"
                  value={quoteId}
                  onChange={(e) => setQuoteId(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="rlk-btn-ghost !w-auto !mt-0 !px-3"
                disabled={!quoteId}
                onClick={() => window.open(`/api/quotations/${quoteId}/pdf`, "_blank")}
              >
                Open PDF
              </button>
            </div>
          </div>
        </section>
      )}

      {tab === "whatsapp" && (
        <>
          <section className="rlk-section rlk-section-accent-green">
            <div className="rlk-section-head">
              <h2>Business WhatsApp · 0713838638</h2>
              <button
                type="button"
                className="rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                onClick={async () => {
                  setBusy(true);
                  const res = await fetch("/api/crm/whatsapp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "ENABLE_FULL_AUTOMATION" }),
                  });
                  const d = await res.json();
                  setBusy(false);
                  alert(
                    d.ok
                      ? `Full automation ON for ${d.businessNumber}\nTemplates ${d.templates} · Automations ${d.automations}\nMeta live: ${d.metaReady ? "YES" : "stub (add WHATSAPP_TOKEN)"}`
                      : d.error || "Failed"
                  );
                  await loadWa(waPhone || undefined);
                }}
                disabled={busy}
              >
                Enable full automation
              </button>
            </div>
            <div className="rlk-section-body">
              <div className="rlk-row">
                <span>Number</span>
                <strong>{wa.business?.businessNumber || "0713838638"}</strong>
              </div>
              <div className="rlk-row">
                <span>Gateway</span>
                <span className="rlk-badge rlk-badge-open">
                  {(wa.business?.provider || "stub").toUpperCase()} ·{" "}
                  {wa.business?.active ? "ACTIVE" : "OFF"}
                  {wa.status?.apiVersion ? ` · ${wa.status.apiVersion}` : ""}
                </span>
              </div>

              <div className="mt-3 mb-3 border border-[var(--rlk-border)] rounded p-3 space-y-1">
                <p className="text-[12px] font-semibold mb-2">Meta Cloud API status</p>
                {(wa.status?.checklist || [
                  { id: "connected", label: "Connected", ok: false },
                  { id: "phone", label: "Phone Number Verified", ok: true },
                  { id: "webhook", label: "Webhook Active", ok: false },
                  { id: "automation", label: "Automation Enabled", ok: false },
                  { id: "templates", label: "Templates Synced", ok: false },
                  { id: "quality", label: "Quality Rating", ok: true },
                ]).map((c) => (
                  <div key={c.id} className="rlk-row !py-1">
                    <span>
                      {c.ok ? "✓" : "○"} {c.label}
                    </span>
                    <span
                      className={
                        c.ok ? "rlk-badge rlk-badge-open" : "rlk-badge rlk-badge-pending"
                      }
                    >
                      {c.ok ? "OK" : "PENDING"}
                    </span>
                  </div>
                ))}
                {wa.status?.qualityRating && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--rlk-text-muted)" }}>
                    Quality: {wa.status.qualityRating}
                    {wa.status.lastInboundAt
                      ? ` · Last IN ${new Date(wa.status.lastInboundAt).toLocaleString()}`
                      : ""}
                  </p>
                )}
                <p className="text-[11px] mt-1" style={{ color: "var(--rlk-text-muted)" }}>
                  Templates {wa.status?.counts.templates ?? 0} (
                  {wa.status?.counts.templatesApproved ?? 0} approved) · Automations{" "}
                  {wa.status?.counts.automationsActive ?? 0} · Msgs 24h{" "}
                  {wa.status?.counts.messages24h ?? 0}
                </p>
              </div>

              <div className="rlk-row">
                <span>Automation</span>
                <span>
                  {wa.business?.fullAutomation ? "Full ON" : "Partial"} · NLU · welcome reply ·
                  sales assign · follow-up · drips D0/D3/D7
                </span>
              </div>
              <a
                className="rlk-btn-ghost !w-auto !mt-2 !px-3 inline-block"
                href={wa.business?.clickToChat || "https://wa.me/94713838638"}
                target="_blank"
                rel="noreferrer"
              >
                Open wa.me/94713838638
              </a>
              <p className="rlk-empty !mt-2 !mb-0">
                Webhook: POST {wa.status?.webhookUrlHint || "/api/whatsapp"} · Verify token:
                merncrest-verify · Test from a <strong>different</strong> phone (not 0713838638)
              </p>
              {!wa.status?.metaReady && (
                <p className="rlk-empty !mt-2 !mb-0">
                  Add WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_WABA_ID to .env for live
                  Meta delivery (stub until then).
                </p>
              )}
            </div>
          </section>

          <section className="rlk-section rlk-section-accent-teal">
            <div className="rlk-section-head">
              <h2>Conversations</h2>
            </div>
            <div className="rlk-section-body grid lg:grid-cols-[240px_1fr] gap-3">
              <div>
                {wa.conversations.length === 0 ? (
                  <p className="rlk-empty">No threads yet</p>
                ) : (
                  wa.conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`rlk-shortcut w-full text-left ${waPhone === c.phone ? "!text-[#17a2b8]" : ""}`}
                      onClick={() => setWaPhone(c.phone)}
                    >
                      <span>{c.customerName || c.phone}</span>
                      <span className="rlk-badge rlk-badge-pending">{c.status}</span>
                    </button>
                  ))
                )}
              </div>
              <div>
                <div className="max-h-[280px] overflow-y-auto mb-3 border border-[var(--rlk-border)] rounded p-2">
                  {(waPhone
                    ? wa.messages.filter((m) => m.phone === waPhone.replace(/\D/g, "") || m.phone === waPhone)
                    : wa.messages
                  ).map((m) => (
                    <div key={m.id} className="rlk-row !flex-col !items-start">
                      <span className="text-[11px]" style={{ color: "var(--rlk-text-muted)" }}>
                        {m.direction} · {m.status} · {new Date(m.createdAt).toLocaleString()}
                      </span>
                      <span>{m.body}</span>
                    </div>
                  ))}
                </div>
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!waPhone || !waReply) return;
                    setBusy(true);
                    await fetch("/api/crm/whatsapp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "REPLY",
                        phone: waPhone,
                        body: waReply,
                        mediaUrl: waMediaUrl || undefined,
                        mediaType: waMediaUrl ? waMediaType : undefined,
                      }),
                    });
                    setWaReply("");
                    setWaMediaUrl("");
                    await loadWa(waPhone);
                    setBusy(false);
                  }}
                >
                  <input
                    className="rlk-input !w-40"
                    placeholder="Phone"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                  />
                  <input
                    className="rlk-input flex-1 min-w-[160px]"
                    placeholder="Reply…"
                    value={waReply}
                    onChange={(e) => setWaReply(e.target.value)}
                  />
                  <input
                    className="rlk-input !w-48"
                    placeholder="Media URL (optional)"
                    value={waMediaUrl}
                    onChange={(e) => setWaMediaUrl(e.target.value)}
                  />
                  <select
                    className="rlk-input !w-auto"
                    value={waMediaType}
                    onChange={(e) =>
                      setWaMediaType(e.target.value as "image" | "document" | "video")
                    }
                  >
                    <option value="image">Image</option>
                    <option value="document">PDF/Doc</option>
                    <option value="video">Video</option>
                  </select>
                  <button type="submit" className="rlk-btn-green !w-auto !mt-0" disabled={busy}>
                    Send
                  </button>
                </form>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="rlk-btn-ghost !w-auto !mt-0 !px-3"
                    onClick={async () => {
                      const res = await fetch("/api/crm/whatsapp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "FLUSH_SCHEDULED" }),
                      });
                      const d = await res.json();
                      alert(`Scheduled flush: ${d.sent}/${d.due} sent`);
                    }}
                  >
                    Flush scheduled
                  </button>
                  <button
                    type="button"
                    className="rlk-btn-ghost !w-auto !mt-0 !px-3"
                    onClick={async () => {
                      const res = await fetch("/api/crm/whatsapp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "PAYMENT_REMINDERS" }),
                      });
                      const d = await res.json();
                      alert(
                        `Payment reminders: ${d.sent}/${d.invoices} · drip enrolled ${d.dripEnrolled ?? 0} · drip sent ${d.dripProcessed?.sent ?? 0}`
                      );
                    }}
                  >
                    Run payment reminders
                  </button>
                  <button
                    type="button"
                    className="rlk-btn-ghost !w-auto !mt-0 !px-3"
                    onClick={async () => {
                      await fetch("/api/crm/whatsapp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "ENROLL_PAYMENT_DRIPS" }),
                      });
                      const res = await fetch("/api/crm/whatsapp", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "PROCESS_PAYMENT_DRIPS" }),
                      });
                      const d = await res.json();
                      alert(`Drip process: ${d.sent} sent / ${d.due} due / ${d.completed} completed`);
                    }}
                  >
                    Process payment drips (D0/D3/D7)
                  </button>
                </div>
                <div className="mt-3">
                  <p className="text-[12px] font-semibold mb-1">Rate last outbound (quality)</p>
                  {(wa.messages || [])
                    .filter((m) => m.direction === "OUT")
                    .slice(0, 3)
                    .map((m) => (
                      <div key={m.id} className="rlk-row">
                        <span className="truncate max-w-[200px]">{m.body}</span>
                        <span className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="rlk-btn-sm"
                              onClick={async () => {
                                await fetch("/api/crm/whatsapp", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    action: "RATE",
                                    messageId: m.id,
                                    qualityRating: n,
                                  }),
                                });
                                await loadWa(waPhone || undefined);
                              }}
                            >
                              {n}★
                            </button>
                          ))}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="rlk-section rlk-section-accent-orange !mb-0">
              <div className="rlk-section-head">
                <h2>Templates</h2>
                <button
                  type="button"
                  className="rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                  onClick={async () => {
                    const res = await fetch("/api/crm/whatsapp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "SYNC_TEMPLATES" }),
                    });
                    const d = await res.json();
                    alert(
                      d.ok
                        ? `Synced ${d.synced} templates${d.error ? ` (${d.error})` : ""}`
                        : d.error || "Sync failed"
                    );
                    await loadWa(waPhone || undefined);
                  }}
                >
                  Sync Meta approval
                </button>
              </div>
              <div className="rlk-section-body">
                <form
                  className="space-y-2 mb-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch("/api/crm/whatsapp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "TEMPLATE", ...tplForm }),
                    });
                    setTplForm({ name: "", body: "" });
                    await loadWa(waPhone || undefined);
                  }}
                >
                  <input className="rlk-input" placeholder="Template name" value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} required />
                  <textarea className="rlk-input" placeholder="Body with {{name}} vars" value={tplForm.body} onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })} required />
                  <button type="submit" className="rlk-btn-green !w-auto">Save template</button>
                </form>
                {wa.templates.map((t) => (
                  <div key={t.id} className="rlk-row !flex-col !items-start">
                    <strong>
                      {t.name}{" "}
                      <span className="rlk-badge rlk-badge-pending">{t.status || "LOCAL"}</span>
                    </strong>
                    <span className="text-[12px]">{t.body}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rlk-section rlk-section-accent-green !mb-0">
              <div className="rlk-section-head">
                <h2>Automations & bulk</h2>
              </div>
              <div className="rlk-section-body">
                {wa.automations.map((a) => (
                  <div key={a.id} className="rlk-row">
                    <span>
                      {a.name} · {a.trigger}
                    </span>
                    <span className="rlk-badge rlk-badge-open">{a.active ? "ON" : "OFF"}</span>
                  </div>
                ))}
                <form
                  className="space-y-2 mt-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const phones = bulkPhones.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean);
                    await fetch("/api/crm/whatsapp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "BULK", phones, body: bulkBody }),
                    });
                    setBulkBody("");
                    await loadWa();
                  }}
                >
                  <textarea className="rlk-input" placeholder="Phones (comma or newline)" value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} rows={2} />
                  <textarea className="rlk-input" placeholder="Bulk message" value={bulkBody} onChange={(e) => setBulkBody(e.target.value)} rows={2} required />
                  <button type="submit" className="rlk-btn-green !w-auto">Send bulk (max 50)</button>
                </form>
              </div>
            </section>
          </div>
        </>
      )}

      {tab === "import" && (
        <>
          <section className="rlk-section rlk-section-accent-orange">
            <div className="rlk-section-head">
              <h2>CSV / Excel (.xlsx) import</h2>
            </div>
            <div className="rlk-section-body">
              <p className="rlk-empty !mb-2">
                Columns: fullName, email, phone, company, interest, tags (tags use | )
              </p>
              <div className="mb-3">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="rlk-input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    setError("");
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/crm/import", { method: "POST", body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Import failed");
                      await load();
                      alert(`Imported ${data.created}, skipped ${data.skipped}`);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed");
                    } finally {
                      setBusy(false);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    const res = await fetch("/api/crm/import", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ csv }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Import failed");
                    setCsv("");
                    await load();
                    alert(`Imported ${data.created}, skipped ${data.skipped}`);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <textarea className="rlk-input font-mono text-[12px]" rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} required placeholder={"fullName,email,phone,company,interest,tags\nJane,jane@co.lk,+9477,Acme,Hosting,VIP|HOSTING"} />
                <button type="submit" className="rlk-btn-green !w-auto mt-2" disabled={busy}>Import CSV text</button>
              </form>
            </div>
          </section>

          <section className="rlk-section rlk-section-accent-teal">
            <div className="rlk-section-head">
              <h2>Duplicate detection & merge</h2>
              <button
                type="button"
                className="rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                onClick={async () => {
                  const res = await fetch("/api/crm/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "FIND_DUPES" }),
                  });
                  const data = await res.json();
                  setDupes(data.groups ?? []);
                }}
              >
                Scan duplicates
              </button>
            </div>
            <div className="rlk-section-body">
              {dupes.length === 0 ? (
                <p className="rlk-empty">No duplicate groups loaded — click Scan.</p>
              ) : (
                dupes.map((g) => (
                  <div key={g.key} className="mb-4 border-b border-[var(--rlk-border)] pb-3">
                    <p className="rlk-mono mb-2">{g.key}</p>
                    {g.leads.map((l, i) => (
                      <div key={l.id} className="rlk-row">
                        <span>
                          {l.fullName} · {l.email} · {l.stage}
                        </span>
                        {i > 0 ? (
                          <button
                            type="button"
                            className="rlk-btn-sm"
                            onClick={async () => {
                              await fetch("/api/crm/import", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "MERGE",
                                  keepId: g.leads[0].id,
                                  mergeId: l.id,
                                }),
                              });
                              const res = await fetch("/api/crm/import", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "FIND_DUPES" }),
                              });
                              const data = await res.json();
                              setDupes(data.groups ?? []);
                              await load();
                            }}
                          >
                            Merge into first
                          </button>
                        ) : (
                          <span className="rlk-badge rlk-badge-open">KEEP</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
