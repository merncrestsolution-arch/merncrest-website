"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, GraduationCap } from "lucide-react";

type TrainingRecord = {
  id: string;
  title: string;
  status: string;
  progressPct: number;
  provider?: string | null;
};

type Content = {
  id: string;
  title: string;
  provider: string | null;
  durationMinutes?: number | null;
};

type Cert = {
  id: string;
  name: string;
  issuer?: string | null;
  issuedAt?: string | null;
};

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETED" || s === "DONE") return "stitch-chip stitch-badge-done";
  if (s.includes("PROGRESS")) return "stitch-chip stitch-badge-progress";
  return "stitch-chip stitch-badge-pending";
}

export function StaffTrainingPanel() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [skills, setSkills] = useState<{ skillKey: string; score: number }[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/erp/training")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setRecords(d.records ?? []);
        setContent(d.content ?? []);
        setCerts(d.certs ?? []);
        setSkills(d.skills ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const completed = records.filter((r) =>
      ["COMPLETED", "DONE"].includes(r.status.toUpperCase())
    ).length;
    const inProgress = records.filter((r) =>
      ["IN_PROGRESS", "ENROLLED", "ACTIVE"].includes(r.status.toUpperCase())
    ).length;
    return {
      enrolled: records.length,
      completed,
      inProgress,
      certs: certs.length,
    };
  }, [records, certs]);

  async function updateProgress(recordId: string, current: number) {
    const next = Math.min(100, current + 25);
    await fetch("/api/erp/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "progress", recordId, progressPct: next }),
    });
    load();
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Training</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Training & Development</h1>
          <p className="stitch-page-sub">Courses, certifications, and skill development.</p>
        </div>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Enrolled Courses</div>
          <div className="stitch-stat-num">{stats.enrolled}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Completed</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-success)" }}>
            {stats.completed}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">In Progress</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-primary)" }}>
            {stats.inProgress}
          </div>
        </div>
        <div className="stitch-stat-card border-[var(--stitch-primary)]">
          <div className="stitch-stat-label">Certifications</div>
          <div className="stitch-stat-num">{stats.certs}</div>
        </div>
      </div>

      <div className="stitch-dash-grid-2 mb-6">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <GraduationCap className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              My Courses
            </h3>
          </div>
          <div className="stitch-section-body !p-0">
            {records.length === 0 ? (
              <p className="stitch-page-sub p-4">No enrollments yet.</p>
            ) : (
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Provider</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.title}</td>
                      <td className="text-[var(--sp-muted)]">{r.provider || "Internal"}</td>
                      <td>
                        <div className="stitch-progress-cell">
                          <div className="stitch-progress-bar">
                            <div style={{ width: `${r.progressPct || 0}%` }} />
                          </div>
                          <span>{r.progressPct || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={statusBadge(r.status)}>{r.status}</span>
                      </td>
                      <td>
                        {(r.progressPct || 0) < 100 ? (
                          <button
                            type="button"
                            className="stitch-btn-sm"
                            onClick={() => updateProgress(r.id, r.progressPct || 0)}
                          >
                            +25%
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Skills Competency</h3>
          </div>
          <div className="stitch-section-body space-y-4">
            {skills.length === 0 ? (
              <p className="stitch-page-sub !mb-0">No competency data yet.</p>
            ) : (
              skills.map((s) => (
                <div key={s.skillKey}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.skillKey.replace(/_/g, " ")}</span>
                    <span className="text-[var(--sp-muted)]">{s.score}/5</span>
                  </div>
                  <div className="stitch-h-bar">
                    <div style={{ width: `${(s.score / 5) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
            {certs.length > 0 ? (
              <div className="pt-3 border-t border-[var(--sp-outline)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] mb-2">
                  Certifications
                </p>
                {certs.map((c) => (
                  <div key={c.id} className="stitch-profile-row !py-2">
                    <span>{c.name}</span>
                    <span className="text-[var(--sp-muted)] text-xs">
                      {c.issuer || "—"}
                      {c.issuedAt ? ` · ${new Date(c.issuedAt).getFullYear()}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>
            <BookOpen className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Content Library
          </h3>
        </div>
        <div className="stitch-section-body">
          {content.length === 0 ? (
            <p className="stitch-page-sub !mb-0">No learning content available yet.</p>
          ) : (
            <div className="stitch-content-grid">
              {content.map((c) => (
                <article key={c.id} className="stitch-content-card">
                  <div className="stitch-content-thumb" />
                  <h4 className="text-sm font-semibold m-0">{c.title}</h4>
                  <p className="text-xs text-[var(--sp-muted)] mt-1 mb-3">
                    {c.provider || "Internal"}
                    {c.durationMinutes ? ` · ${c.durationMinutes} min` : ""}
                  </p>
                  <button type="button" className="stitch-btn-primary-sm w-full justify-center">
                    Start Learning
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
