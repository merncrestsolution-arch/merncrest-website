"use client";

import { useCallback, useEffect, useState } from "react";

type Complaint = {
  id: string;
  complaintNumber: string;
  type: string;
  severity: string;
  status: string;
  subject: string;
  category: string;
  rootCause?: string | null;
  assignee?: { fullName: string } | null;
};

export function SystemComplaintsPanel() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<{
    total: number;
    avgResolutionHrs: number | null;
    avgCsat: number | null;
    trends: { category: string; count: number; prevention: string }[];
  } | null>(null);
  const [form, setForm] = useState({
    subject: "",
    body: "",
    type: "CUSTOMER",
    severity: "MEDIUM",
    source: "WEB",
    category: "GENERAL",
  });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [c, a] = await Promise.all([
      fetch("/api/erp/complaints"),
      fetch("/api/erp/complaints?view=analytics"),
    ]);
    const cd = await c.json();
    const ad = await a.json();
    if (!c.ok) setError(cd.error || "Failed");
    else setComplaints(cd.complaints ?? []);
    if (a.ok) setAnalytics(ad.analytics);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1 className="rlk-welcome">Complaints &amp; feedback</h1>
      <p className="text-sm text-[#666] mb-4">
        Customer + internal grievance · RCA · resolution time · CSAT · prevention tips
      </p>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}

      {analytics && (
        <div className="rlk-stats mb-4">
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.total}</div>
            <div className="rlk-stat-label">Complaints (30d)</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.avgResolutionHrs ?? "—"}</div>
            <div className="rlk-stat-label">Avg resolve hrs</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.avgCsat ?? "—"}</div>
            <div className="rlk-stat-label">Post CSAT</div>
          </div>
        </div>
      )}

      <section className="rlk-section rlk-section-accent-orange">
        <div className="rlk-section-head">
          <h2>Log complaint</h2>
        </div>
        <div className="rlk-section-body">
          <form
            className="grid sm:grid-cols-2 gap-2 max-w-2xl"
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/erp/complaints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              });
              setForm({
                subject: "",
                body: "",
                type: "CUSTOMER",
                severity: "MEDIUM",
                source: "WEB",
                category: "GENERAL",
              });
              await load();
            }}
          >
            <input
              className="rlk-input sm:col-span-2"
              required
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <textarea
              className="rlk-input sm:col-span-2 min-h-[70px]"
              required
              placeholder="Details"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <select
              className="rlk-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="CUSTOMER">Customer</option>
              <option value="GRIEVANCE">Internal grievance</option>
            </select>
            <select
              className="rlk-input"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select
              className="rlk-input"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="WEB">Web</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Phone</option>
              <option value="PORTAL">Portal</option>
              <option value="INTERNAL">Internal</option>
            </select>
            <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4">
              Submit
            </button>
          </form>
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-teal">
        <div className="rlk-section-head">
          <h2>Queue</h2>
        </div>
        <div className="rlk-section-body">
          {complaints.map((c) => (
            <div key={c.id} className="rlk-row !flex-col !items-stretch !gap-1">
              <div className="flex justify-between gap-2">
                <p className="font-medium text-[13px]">
                  <span className="text-[#17a2b8]">{c.complaintNumber}</span> · {c.subject}
                </p>
                <span className="rlk-badge">{c.status}</span>
              </div>
              <p className="text-xs text-[#666]">
                {c.type} · {c.severity} · {c.category}
                {c.assignee ? ` · ${c.assignee.fullName}` : ""}
              </p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className="rlk-btn-sm"
                  onClick={async () => {
                    const rootCause = prompt("Root cause?") || "";
                    const resolution = prompt("Resolution?") || "";
                    await fetch("/api/erp/complaints", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: c.id,
                        action: "resolve",
                        rootCause,
                        resolution,
                        preventionNotes: analytics?.trends?.[0]?.prevention,
                      }),
                    });
                    await load();
                  }}
                >
                  Resolve + RCA
                </button>
                <button
                  type="button"
                  className="rlk-btn-sm"
                  onClick={async () => {
                    await fetch("/api/erp/complaints", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: c.id, action: "followup" }),
                    });
                  }}
                >
                  Follow-up
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {analytics?.trends && analytics.trends.length > 0 && (
        <section className="rlk-section rlk-section-accent-gray mt-4">
          <div className="rlk-section-head">
            <h2>Prevention recommendations</h2>
          </div>
          <div className="rlk-section-body">
            {analytics.trends.map((t) => (
              <div key={t.category} className="rlk-row">
                <span>
                  {t.category} ({t.count})
                </span>
                <span className="text-xs text-[#666] max-w-md text-right">{t.prevention}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
