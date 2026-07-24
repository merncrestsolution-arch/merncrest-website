"use client";

import { useCallback, useEffect, useState } from "react";

export function SystemTrainingPanel({ selfMode = false }: { selfMode?: boolean }) {
  const [records, setRecords] = useState<
    {
      id: string;
      title: string;
      status: string;
      progressPct: number;
      provider?: string | null;
      user?: { fullName: string };
    }[]
  >([]);
  const [content, setContent] = useState<{ id: string; title: string; provider: string | null }[]>(
    []
  );
  const [roi, setRoi] = useState<{
    completed: number;
    costCents: number;
    hours: number;
    roiPct: number | null;
  } | null>(null);
  const [skills, setSkills] = useState<{ skillKey: string; score: number }[]>([]);
  const [enroll, setEnroll] = useState({ title: "", provider: "Internal", userId: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const url = selfMode ? "/api/erp/training" : "/api/erp/training";
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setRecords(data.records ?? []);
    setContent(data.content ?? []);
    setRoi(data.roi ?? null);
    setSkills(data.skills ?? []);
  }, [selfMode]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1 className="rlk-welcome">{selfMode ? "My training" : "Training & development"}</h1>
      <p className="text-sm text-[#666] mb-4">
        Calendar enrollments · content library · certifications · skills · PIP · ROI
      </p>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}

      {roi && !selfMode && (
        <div className="rlk-stats mb-4">
          <div className="rlk-stat">
            <div className="rlk-stat-num">{roi.completed}</div>
            <div className="rlk-stat-label">Completed</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{roi.hours}h</div>
            <div className="rlk-stat-label">Hours</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{(roi.costCents / 100).toLocaleString()}</div>
            <div className="rlk-stat-label">Cost LKR</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{roi.roiPct != null ? `${roi.roiPct}%` : "—"}</div>
            <div className="rlk-stat-label">ROI proxy</div>
          </div>
        </div>
      )}

      {!selfMode && (
        <section className="rlk-section rlk-section-accent-orange">
          <div className="rlk-section-head">
            <h2>Enroll employee</h2>
          </div>
          <div className="rlk-section-body">
            <form
              className="flex flex-wrap gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                await fetch("/api/erp/training", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "enroll",
                    title: enroll.title,
                    provider: enroll.provider,
                    userId: enroll.userId,
                    scheduledAt: new Date().toISOString(),
                  }),
                });
                setEnroll({ title: "", provider: "Internal", userId: "" });
                await load();
              }}
            >
              <input
                className="rlk-input"
                placeholder="Course title"
                required
                value={enroll.title}
                onChange={(e) => setEnroll({ ...enroll, title: e.target.value })}
              />
              <input
                className="rlk-input"
                placeholder="User id"
                required
                value={enroll.userId}
                onChange={(e) => setEnroll({ ...enroll, userId: e.target.value })}
              />
              <select
                className="rlk-input"
                value={enroll.provider}
                onChange={(e) => setEnroll({ ...enroll, provider: e.target.value })}
              >
                <option value="Internal">Internal</option>
                <option value="Udemy">Udemy</option>
                <option value="LinkedIn Learning">LinkedIn Learning</option>
              </select>
              <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4">
                Enroll
              </button>
            </form>
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rlk-section rlk-section-accent-teal">
          <div className="rlk-section-head">
            <h2>Training records</h2>
          </div>
          <div className="rlk-section-body">
            {records.length === 0 ? (
              <p className="rlk-empty">No enrollments.</p>
            ) : (
              records.map((r) => (
                <div key={r.id} className="rlk-row !flex-col !items-stretch !gap-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-[13px]">
                      {r.title}
                      {r.user ? ` · ${r.user.fullName}` : ""}
                    </span>
                    <span className="rlk-badge">{r.status}</span>
                  </div>
                  <div className="h-2 bg-[#eee] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#28a745]"
                      style={{ width: `${r.progressPct || 0}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    className="rlk-btn-sm !self-start"
                    onClick={async () => {
                      const next = Math.min(100, (r.progressPct || 0) + 25);
                      await fetch("/api/erp/training", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "progress",
                          recordId: r.id,
                          progressPct: next,
                        }),
                      });
                      await load();
                    }}
                  >
                    +25% progress
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rlk-section rlk-section-accent-green">
          <div className="rlk-section-head">
            <h2>Content library</h2>
          </div>
          <div className="rlk-section-body">
            {content.length === 0 ? (
              <p className="rlk-empty">
                Add via API action=content (Udemy / LinkedIn / Internal URLs).
              </p>
            ) : (
              content.map((c) => (
                <div key={c.id} className="rlk-row">
                  <span>{c.title}</span>
                  <span className="text-xs text-[#666]">{c.provider}</span>
                </div>
              ))
            )}
            {skills.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-[#666] mb-1">Competency map</p>
                {skills.map((s) => (
                  <div key={s.skillKey} className="rlk-row">
                    <span>{s.skillKey}</span>
                    <span>{s.score}/5</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
