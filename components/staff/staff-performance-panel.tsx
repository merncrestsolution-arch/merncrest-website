"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, X } from "lucide-react";

type Review = {
  id: string;
  periodLabel: string;
  status: string;
  selfScore: number | null;
  managerScore: number | null;
  selfNotes?: string | null;
  managerNotes?: string | null;
};

type Target = {
  id: string;
  name: string;
  metricKey: string;
  targetValue: number;
  unit?: string | null;
};

type Entry = {
  metricKey: string;
  value: number;
};

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "CLOSED" || s === "MANAGER_DONE") return "stitch-chip stitch-badge-done";
  if (s === "DRAFT") return "stitch-chip stitch-badge-pending";
  if (s === "SELF_DONE") return "stitch-chip stitch-badge-progress";
  return "stitch-chip";
}

function statusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "MANAGER_DONE" || s === "CLOSED") return "Completed";
  if (s === "SELF_DONE") return "Awaiting Manager";
  if (s === "DRAFT") return "Pending";
  return status.replace(/_/g, " ");
}

export function StaffPerformancePanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [evalReview, setEvalReview] = useState<Review | null>(null);
  const [viewReview, setViewReview] = useState<Review | null>(null);
  const [selfScore, setSelfScore] = useState(4);
  const [selfNotes, setSelfNotes] = useState("");

  const load = useCallback(() => {
    fetch("/api/staff/performance")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setReviews(d.reviews ?? []);
        setTargets(d.targets ?? []);
        setEntries(d.entries ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const completed = reviews.filter((r) =>
      ["MANAGER_DONE", "CLOSED"].includes(r.status.toUpperCase())
    );
    const scored = completed.filter((r) => r.managerScore != null || r.selfScore != null);
    const avg =
      scored.length > 0
        ? scored.reduce((s, r) => s + (r.managerScore ?? r.selfScore ?? 0), 0) / scored.length
        : 0;
    const pending = reviews.filter((r) => r.status.toUpperCase() === "DRAFT").length;
    const goalsDone = targets.filter((t) => {
      const entry = entries.find((e) => e.metricKey === t.metricKey);
      return entry && entry.value >= t.targetValue;
    }).length;
    const kpiScore =
      targets.length > 0
        ? Math.round(
            (targets.reduce((s, t) => {
              const entry = entries.find((e) => e.metricKey === t.metricKey);
              const pct = entry ? Math.min(100, (entry.value / t.targetValue) * 100) : 0;
              return s + pct;
            }, 0) /
              targets.length) *
              10
          ) / 10
        : 0;

    return {
      overall: avg ? avg.toFixed(1) : "—",
      goalsDone,
      goalsTotal: targets.length,
      pending,
      kpiScore: targets.length ? `${kpiScore}%` : "—",
    };
  }, [reviews, targets, entries]);

  const targetProgress = useMemo(() => {
    return targets.map((t) => {
      const entry = entries.find((e) => e.metricKey === t.metricKey);
      const pct = entry ? Math.min(100, Math.round((entry.value / t.targetValue) * 100)) : 0;
      return { ...t, pct, current: entry?.value ?? 0 };
    });
  }, [targets, entries]);

  async function startReview() {
    setBusy(true);
    try {
      await fetch("/api/staff/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE" }),
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function submitSelfEval(e: React.FormEvent) {
    e.preventDefault();
    if (!evalReview) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SELF",
          reviewId: evalReview.id,
          selfScore,
          selfNotes: selfNotes || "Self evaluation submitted via System ESS",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      setEvalReview(null);
      setSelfNotes("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Performance</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Performance</h1>
          <p className="stitch-page-sub">Reviews, KPI targets, and self-evaluation.</p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" disabled={busy} onClick={startReview}>
          <Plus className="h-3.5 w-3.5" />
          Start Review Cycle
        </button>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card border-[var(--stitch-primary)]">
          <div className="stitch-stat-label">Overall Rating</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-primary)" }}>
            {stats.overall}
            {stats.overall !== "—" ? <span className="text-sm font-normal text-[var(--sp-muted)]"> / 5</span> : null}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Goals Completed</div>
          <div className="stitch-stat-num">
            {stats.goalsTotal ? `${stats.goalsDone}/${stats.goalsTotal}` : "—"}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Pending Reviews</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-warning)" }}>
            {stats.pending}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">KPI Score</div>
          <div className="stitch-stat-num">{stats.kpiScore}</div>
        </div>
      </div>

      <section className="stitch-section-card mb-6">
        <div className="stitch-section-head">
          <h3>Review Cycles</h3>
        </div>
        <div className="stitch-section-body !p-0">
          {reviews.length === 0 ? (
            <p className="stitch-page-sub p-4">No reviews yet. Start a review cycle to begin.</p>
          ) : (
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Self Score</th>
                  <th>Manager Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>{r.periodLabel}</td>
                    <td>
                      <span className={statusBadge(r.status)}>{statusLabel(r.status)}</span>
                    </td>
                    <td>{r.selfScore ?? "—"}</td>
                    <td>{r.managerScore ?? "—"}</td>
                    <td className="flex gap-2">
                      <button
                        type="button"
                        className="stitch-btn-icon"
                        aria-label="View review"
                        onClick={() => setViewReview(r)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {r.status === "DRAFT" ? (
                        <button
                          type="button"
                          className="stitch-btn-sm"
                          onClick={() => {
                            setEvalReview(r);
                            setSelfScore(4);
                            setSelfNotes("");
                          }}
                        >
                          Self-evaluate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {targetProgress.length > 0 ? (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>KPI Targets</h3>
          </div>
          <div className="stitch-section-body space-y-4">
            {targetProgress.map((t) => (
              <div key={t.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-[var(--sp-muted)]">
                    {t.current}
                    {t.unit ? ` ${t.unit}` : ""} / {t.targetValue}
                    {t.unit ? ` ${t.unit}` : ""} · {t.pct}%
                  </span>
                </div>
                <div className="stitch-h-bar">
                  <div style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {evalReview ? (
        <div className="stitch-modal-backdrop" onClick={() => setEvalReview(null)}>
          <div className="stitch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Self Evaluation — {evalReview.periodLabel}</h3>
              <button type="button" className="stitch-btn-icon" onClick={() => setEvalReview(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submitSelfEval} className="stitch-modal-body space-y-4">
              <div>
                <label className="stitch-label">Score (1–5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                  value={selfScore}
                  onChange={(e) => setSelfScore(Number(e.target.value))}
                />
                <p className="text-center text-2xl font-semibold mt-2" style={{ color: "var(--stitch-primary)" }}>
                  {selfScore} / 5
                </p>
              </div>
              <div>
                <label className="stitch-label">Notes</label>
                <textarea
                  className="stitch-input min-h-[100px]"
                  placeholder="Describe your achievements and areas for growth"
                  value={selfNotes}
                  onChange={(e) => setSelfNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="stitch-btn-sm" onClick={() => setEvalReview(null)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewReview ? (
        <div className="stitch-modal-backdrop" onClick={() => setViewReview(null)}>
          <div className="stitch-modal stitch-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Review — {viewReview.periodLabel}</h3>
              <button type="button" className="stitch-btn-icon" onClick={() => setViewReview(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="stitch-modal-body space-y-3 text-sm">
              <p>
                <span className="text-[var(--sp-muted)]">Status:</span>{" "}
                <span className={statusBadge(viewReview.status)}>{statusLabel(viewReview.status)}</span>
              </p>
              <p>
                <span className="text-[var(--sp-muted)]">Self Score:</span> {viewReview.selfScore ?? "—"}
              </p>
              <p>
                <span className="text-[var(--sp-muted)]">Manager Score:</span>{" "}
                {viewReview.managerScore ?? "—"}
              </p>
              {viewReview.selfNotes ? (
                <p>
                  <span className="text-[var(--sp-muted)]">Self Notes:</span> {viewReview.selfNotes}
                </p>
              ) : null}
              {viewReview.managerNotes ? (
                <p>
                  <span className="text-[var(--sp-muted)]">Manager Notes:</span> {viewReview.managerNotes}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
