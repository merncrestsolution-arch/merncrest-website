"use client";

import { useCallback, useEffect, useState } from "react";

type Call = {
  id: string;
  callNumber: string;
  phone: string;
  language: string;
  department: string;
  status: string;
  useCase?: string | null;
  severity?: string | null;
  queueStatus?: string | null;
  durationSec?: number;
  holdSec?: number;
  surveyScore?: number | null;
  agentName?: string | null;
  recordingUrl?: string | null;
  dtmfPath?: string | null;
  createdAt: string;
  events?: { id: string; type: string; digit?: string | null; detail?: string | null }[];
};

type Analytics = {
  totals: {
    calls: number;
    answered: number;
    missed: number;
    queued: number;
    answerRate: number;
    avgDurationSec: number;
    avgHoldSec: number;
    avgSurvey: number | null;
    surveyCount: number;
  };
  byDepartment: { department: string; count: number; avgDurationSec: number }[];
  byUseCase: { useCase: string; count: number }[];
};

type Tab = "queue" | "calls" | "analytics";

export function SystemIvrPanel() {
  const [tab, setTab] = useState<Tab>("queue");
  const [calls, setCalls] = useState<Call[]>([]);
  const [queue, setQueue] = useState<Call[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const [cRes, qRes, aRes] = await Promise.all([
        fetch("/api/ivr"),
        fetch("/api/ivr?view=queue"),
        fetch("/api/ivr?view=analytics&days=30"),
      ]);
      const cData = await cRes.json();
      const qData = await qRes.json();
      const aData = await aRes.json();
      if (!cRes.ok) throw new Error(cData.error || "Failed to load calls");
      setCalls(cData.calls ?? []);
      if (qRes.ok) setQueue(qData.queue ?? []);
      if (aRes.ok) setAnalytics(aData.analytics ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function claim(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/ivr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "claim" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  async function complete(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/ivr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "complete", surveyScore: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Complete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Complete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="rlk-welcome">IVR &amp; Call Queue</h1>
      <p className="text-sm text-[#666] mb-4">
        Recorded-voice IVR · DTMF menus · missed-call WhatsApp alerts · agent queue. Linked to CRM.
      </p>

      {error && (
        <p className="rlk-login-error mb-3" role="alert">
          {error}
        </p>
      )}

      {analytics && (
        <div className="rlk-stats mb-4">
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.totals.calls}</div>
            <div className="rlk-stat-label">Calls (30d)</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.totals.answerRate}%</div>
            <div className="rlk-stat-label">Answer rate</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.totals.missed}</div>
            <div className="rlk-stat-label">Missed / VM</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.totals.avgDurationSec}s</div>
            <div className="rlk-stat-label">Avg duration</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.totals.queued}</div>
            <div className="rlk-stat-label">In queue</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">
              {analytics.totals.avgSurvey != null ? analytics.totals.avgSurvey : "—"}
            </div>
            <div className="rlk-stat-label">Avg CSAT</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(["queue", "calls", "analytics"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2" : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"}
            onClick={() => setTab(t)}
          >
            {t === "queue" ? "Call queue" : t === "calls" ? "Call log" : "Analytics"}
          </button>
        ))}
        <button
          type="button"
          className="rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2 ml-auto"
          onClick={() => load()}
          disabled={busy}
        >
          Refresh
        </button>
      </div>

      {tab === "queue" && (
        <section className="rlk-section rlk-section-accent-orange">
          <div className="rlk-section-head">
            <h2>Agent queue</h2>
          </div>
          <div className="rlk-section-body">
            {queue.length === 0 && (
              <p className="rlk-empty">No calls waiting. Missed/voicemail callbacks appear here.</p>
            )}
            {queue.map((c) => (
              <div key={c.id} className="rlk-row">
                <div>
                  <p className="font-medium text-[#333]">
                    {c.callNumber} · {c.phone}
                  </p>
                  <p className="text-xs text-[#666] mt-0.5">
                    {c.department}
                    {c.severity ? ` · ${c.severity}` : ""}
                    {c.useCase ? ` · ${c.useCase}` : ""} · {c.status}
                    {c.dtmfPath ? ` · DTMF ${c.dtmfPath}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="rlk-btn-green !w-auto !mt-0 !px-3 !py-1.5 text-sm"
                    disabled={busy}
                    onClick={() => claim(c.id)}
                  >
                    Claim
                  </button>
                  <button
                    type="button"
                    className="rlk-btn-ghost !w-auto !mt-0 !px-3 !py-1.5 text-sm"
                    disabled={busy}
                    onClick={() => complete(c.id)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "calls" && (
        <section className="rlk-section rlk-section-accent-teal">
          <div className="rlk-section-head">
            <h2>Call log</h2>
          </div>
          <div className="rlk-section-body">
            {calls.length === 0 && <p className="rlk-empty">No call records yet.</p>}
            {calls.map((c) => (
              <div key={c.id} className="rlk-row">
                <div>
                  <p className="font-medium text-[#333]">
                    <span className="text-[#17a2b8]">{c.callNumber}</span> · {c.phone}
                  </p>
                  <p className="text-xs text-[#666] mt-0.5">
                    {c.language} · {c.department} · {c.status}
                    {c.useCase ? ` · ${c.useCase}` : ""}
                    {c.agentName ? ` · ${c.agentName}` : ""}
                    {c.durationSec != null ? ` · ${c.durationSec}s` : ""}
                    {c.surveyScore != null ? ` · CSAT ${c.surveyScore}` : ""}
                  </p>
                  {c.events && c.events.length > 0 && (
                    <p className="text-xs text-[#999] mt-1">
                      {c.events.map((e) => e.type).join(" → ")}
                    </p>
                  )}
                  {c.recordingUrl && (
                    <a href={c.recordingUrl} className="rlk-link text-xs" target="_blank" rel="noreferrer">
                      Recording
                    </a>
                  )}
                </div>
                <span className="rlk-badge text-xs">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "analytics" && analytics && (
        <div className="space-y-4">
          <section className="rlk-section rlk-section-accent-green">
            <div className="rlk-section-head">
              <h2>By department</h2>
            </div>
            <div className="rlk-section-body">
              {analytics.byDepartment.length === 0 && <p className="rlk-empty">No data.</p>}
              {analytics.byDepartment.map((d) => (
                <div key={d.department} className="rlk-row">
                  <span>{d.department}</span>
                  <span className="text-sm text-[#666]">
                    {d.count} calls · avg {d.avgDurationSec}s
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="rlk-section rlk-section-accent-gray">
            <div className="rlk-section-head">
              <h2>By use-case</h2>
            </div>
            <div className="rlk-section-body">
              {analytics.byUseCase.length === 0 && <p className="rlk-empty">No use-case data.</p>}
              {analytics.byUseCase.map((u) => (
                <div key={u.useCase} className="rlk-row">
                  <span>{u.useCase}</span>
                  <span className="text-sm text-[#666]">{u.count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
