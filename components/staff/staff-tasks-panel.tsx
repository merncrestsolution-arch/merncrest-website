"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KANBAN_COLUMNS, POMODORO_MINUTES, TASK_STATUS_TRANSITIONS, type TaskStatus } from "@/lib/erp/projects/constants";
import { Clock, Timer } from "lucide-react";

type Task = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  progressPct?: number;
  dueDate: string | null;
  project: { projectCode: string; name: string } | null;
  milestone?: { title: string } | null;
  children?: { id: string; title: string; status: string; progressPct: number }[];
};

const COL_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  BLOCKED: "Blocked",
  DONE: "Done",
};

function priorityBadge(priority?: string) {
  const p = (priority || "MEDIUM").toUpperCase();
  if (p === "CRITICAL" || p === "HIGH") return "stitch-chip stitch-badge-danger";
  if (p === "LOW") return "stitch-chip stitch-chip-violet";
  return "stitch-chip stitch-badge-pending";
}

function formatTracked(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function StaffTasksPanel() {
  const [byStatus, setByStatus] = useState<Record<string, Task[]>>({});
  const [stats, setStats] = useState({ open: 0, blocked: 0, trackedMinutesToday: 0 });
  const [error, setError] = useState("");
  const [pomodoroId, setPomodoroId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const load = useCallback(() => {
    fetch("/api/staff/tasks")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setByStatus(d.byStatus ?? {});
        setStats(d.stats ?? { open: 0, blocked: 0, trackedMinutesToday: 0 });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pomodoroId || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          void completePomodoro(pomodoroId);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroId]);

  const kpi = useMemo(() => {
    return {
      open: stats.open,
      inProgress: (byStatus.IN_PROGRESS ?? []).length,
      completed: (byStatus.DONE ?? []).length,
      tracked: formatTracked(stats.trackedMinutesToday),
    };
  }, [byStatus, stats]);

  async function setStatus(taskId: string, status: string) {
    const res = await fetch("/api/staff/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status, action: "status" }),
    });
    if (res.ok) load();
  }

  async function completePomodoro(taskId: string) {
    await fetch("/api/staff/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, action: "pomodoro" }),
    });
    setPomodoroId(null);
    load();
  }

  function startPomodoro(taskId: string) {
    setPomodoroId(taskId);
    setSecondsLeft(POMODORO_MINUTES * 60);
  }

  const cols = [...KANBAN_COLUMNS];

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Tasks</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">My Tasks</h1>
          <p className="stitch-page-sub">Task board, priorities, and focus time tracking.</p>
        </div>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Open Tasks</div>
          <div className="stitch-stat-num">{kpi.open}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">In Progress</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-primary)" }}>
            {kpi.inProgress}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Completed</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-success)" }}>
            {kpi.completed}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Tracked Today</div>
          <div className="stitch-stat-num">{kpi.tracked}</div>
        </div>
      </div>

      {pomodoroId && secondsLeft > 0 ? (
        <section className="stitch-pomodoro-banner mb-6">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5" style={{ color: "var(--stitch-primary)" }} />
            <div>
              <p className="font-semibold text-sm m-0">Focus session active</p>
              <p className="text-2xl font-bold m-0" style={{ color: "var(--stitch-primary)" }}>
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="stitch-btn-sm"
            onClick={() => {
              setPomodoroId(null);
              setSecondsLeft(0);
            }}
          >
            Cancel
          </button>
        </section>
      ) : null}

      <div className="stitch-kanban">
        {cols.map((col) => (
          <div key={col} className="stitch-kanban-col">
            <div className="stitch-kanban-col-head">
              <span>{COL_LABELS[col] || col}</span>
              <span className="stitch-kanban-count">{(byStatus[col] || []).length}</span>
            </div>
            <div className="stitch-kanban-col-body">
              {(byStatus[col] || []).length === 0 ? (
                <p className="stitch-kanban-empty">No tasks</p>
              ) : (
                (byStatus[col] || []).map((t) => (
                  <article key={t.id} className="stitch-kanban-card">
                    {t.project ? (
                      <span className="stitch-kanban-code">{t.project.projectCode}</span>
                    ) : null}
                    <h4 className="stitch-kanban-title">{t.title}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {t.priority ? (
                        <span className={priorityBadge(t.priority)}>{t.priority}</span>
                      ) : null}
                      {t.dueDate ? (
                        <span className="stitch-chip text-[10px]">
                          <Clock className="inline h-3 w-3 mr-0.5" />
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    {t.progressPct != null ? (
                      <div className="stitch-progress-cell mb-2">
                        <div className="stitch-progress-bar">
                          <div style={{ width: `${t.progressPct}%` }} />
                        </div>
                        <span>{t.progressPct}%</span>
                      </div>
                    ) : null}
                    {t.children && t.children.length > 0 ? (
                      <p className="text-[11px] text-[var(--sp-muted)] mb-2">
                        {t.children.length} subtask(s)
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                      <button
                        type="button"
                        className="stitch-btn-primary-sm !text-xs !py-1"
                        disabled={!!pomodoroId}
                        onClick={() => startPomodoro(t.id)}
                      >
                        <Timer className="h-3 w-3" />
                        Start Focus
                      </button>
                      {(TASK_STATUS_TRANSITIONS[col as TaskStatus] ?? []).map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="stitch-btn-sm !text-xs !py-1"
                            onClick={() => setStatus(t.id, c)}
                          >
                            → {COL_LABELS[c]}
                          </button>
                        ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
