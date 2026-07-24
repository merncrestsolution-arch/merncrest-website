"use client";

import { useCallback, useEffect, useState } from "react";

type Snapshot = {
  sales: {
    wonLeads: number;
    conversionRate: number;
    avgDealCents: number;
    forecastWon: number;
  };
  customerService: {
    openTickets: number;
    resolutionRate: number;
    avgCsat: number | null;
  };
  operations: { onTimeAttendancePct: number; lateDays: number };
  productivity: { completionPct: number; tasksDone: number };
  financial: { revenueCents: number; expenseCents: number; profitCents: number };
  heatmap: { department: string; intensity: number; employees: number; leads: number }[];
};

export function SystemPerformancePanel() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [reportKind, setReportKind] = useState("sales");
  const [report, setReport] = useState<unknown>(null);
  const [benchmarks, setBenchmarks] = useState<
    { id: string; metricKey: string; source: string; value: number }[]
  >([]);
  const [metricName, setMetricName] = useState("");
  const [metricKey, setMetricKey] = useState("CSAT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dRes, bRes] = await Promise.all([
        fetch("/api/erp/performance?view=dashboard&days=30"),
        fetch("/api/erp/performance?view=benchmarks"),
      ]);
      const d = await dRes.json();
      const b = await bRes.json();
      if (!dRes.ok) throw new Error(d.error || "Failed");
      setSnap(d.snapshot);
      if (bRes.ok) setBenchmarks(b.benchmarks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function loadReport(kind: string) {
    setReportKind(kind);
    const res = await fetch(`/api/erp/performance?view=report&kind=${kind}&days=30`);
    const data = await res.json();
    if (res.ok) setReport(data.report);
  }

  async function addMetric(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/erp/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "custom_metric",
          name: metricName,
          formulaKey: metricKey,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setMetricName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function runAlerts() {
    await fetch("/api/erp/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run_alerts" }),
    });
    await load();
  }

  return (
    <>
      <h1 className="rlk-welcome">Performance &amp; analytics</h1>
      <p className="text-sm text-[#666] mb-4">
        KPIs · department heat map · sales / CS / ops · reports · benchmarks · underperformance alerts
      </p>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}

      {snap && (
        <div className="rlk-stats mb-4">
          <div className="rlk-stat">
            <div className="rlk-stat-num">{snap.sales.conversionRate}%</div>
            <div className="rlk-stat-label">Conversion</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">
              {(snap.sales.avgDealCents / 100).toLocaleString()}
            </div>
            <div className="rlk-stat-label">Avg deal (LKR)</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{snap.customerService.resolutionRate}%</div>
            <div className="rlk-stat-label">Resolution</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{snap.customerService.avgCsat ?? "—"}</div>
            <div className="rlk-stat-label">CSAT</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{snap.operations.onTimeAttendancePct}%</div>
            <div className="rlk-stat-label">On-time attendance</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{snap.productivity.completionPct}%</div>
            <div className="rlk-stat-label">Task productivity</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{snap.sales.forecastWon}</div>
            <div className="rlk-stat-label">Forecast wins</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rlk-section rlk-section-accent-teal">
          <div className="rlk-section-head">
            <h2>Department heat map</h2>
            <button type="button" className="rlk-btn-ghost !w-auto !mt-0 !px-3 !py-1.5" onClick={runAlerts}>
              Run alerts
            </button>
          </div>
          <div className="rlk-section-body">
            {!snap?.heatmap?.length ? (
              <p className="rlk-empty">No departments.</p>
            ) : (
              snap.heatmap.map((h) => (
                <div key={h.department} className="rlk-row !flex-col !items-stretch !gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{h.department}</span>
                    <span className="text-[#666]">
                      {h.employees} staff · {h.leads} leads
                    </span>
                  </div>
                  <div className="h-2 bg-[#eee] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#17a2b8]"
                      style={{ width: `${Math.min(100, h.intensity)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rlk-section rlk-section-accent-orange">
          <div className="rlk-section-head">
            <h2>Custom metric builder</h2>
          </div>
          <div className="rlk-section-body">
            <form onSubmit={addMetric} className="flex flex-wrap gap-2 mb-3">
              <input
                className="rlk-input flex-1"
                placeholder="Metric name"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                required
              />
              <select
                className="rlk-input"
                value={metricKey}
                onChange={(e) => setMetricKey(e.target.value)}
              >
                <option value="SALES_REVENUE">Sales revenue</option>
                <option value="CONVERSION">Conversion</option>
                <option value="CSAT">CSAT</option>
                <option value="RESPONSE_HRS">Response hours</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="PRODUCTIVITY">Productivity</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-3" disabled={busy}>
                Add
              </button>
            </form>
            <p className="text-xs text-[#666]">
              Benchmarks: {benchmarks.length} · Add via API action=benchmark (industry / internal / team)
            </p>
          </div>
        </section>
      </div>

      <section className="rlk-section rlk-section-accent-green mt-4">
        <div className="rlk-section-head">
          <h2>Reports</h2>
        </div>
        <div className="rlk-section-body">
          <div className="flex flex-wrap gap-2 mb-3">
            {["sales", "kpi", "attendance", "customer", "financial", "compliance"].map((k) => (
              <button
                key={k}
                type="button"
                className={
                  reportKind === k
                    ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-1.5"
                    : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-1.5"
                }
                onClick={() => loadReport(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <pre className="text-xs bg-[#f9f9f9] border border-[#e0e0e0] p-3 overflow-auto max-h-64">
            {report ? JSON.stringify(report, null, 2) : "Select a report type."}
          </pre>
        </div>
      </section>
    </>
  );
}
