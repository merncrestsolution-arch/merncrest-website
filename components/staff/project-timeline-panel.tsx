"use client";

import { formatSriLankaDateTime } from "@/lib/timezone";

type Milestone = {
  id: string;
  title: string;
  status: string;
  dueDate?: string | null;
  startDate?: string | null;
};

type Update = {
  id: string;
  title: string;
  body: string;
  processStage?: string | null;
  createdAt: string;
};

type TimelineEvent = {
  id: string;
  kind: "milestone" | "update";
  date: Date;
  title: string;
  subtitle?: string;
  status?: string;
};

export function ProjectTimelinePanel({
  milestones,
  updates,
}: {
  milestones: Milestone[];
  updates: Update[];
}) {
  const events: TimelineEvent[] = [];

  milestones.forEach((m) => {
    const date = m.dueDate || m.startDate;
    if (!date) return;
    events.push({
      id: `m-${m.id}`,
      kind: "milestone",
      date: new Date(date),
      title: m.title,
      status: m.status,
      subtitle: m.dueDate ? `Due ${formatSriLankaDateTime(m.dueDate)}` : undefined,
    });
  });

  updates.forEach((u) => {
    events.push({
      id: `u-${u.id}`,
      kind: "update",
      date: new Date(u.createdAt),
      title: u.title,
      subtitle: u.processStage || u.body.slice(0, 80),
    });
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--sp-muted)] py-6 text-center">
        No timeline events — add milestones or log updates.
      </p>
    );
  }

  return (
    <section className="stitch-section-card">
      <div className="stitch-section-head">
        <h3>Timeline</h3>
      </div>
      <div className="stitch-section-body">
        <ol className="relative border-l border-[var(--sp-outline)] ml-3 space-y-6">
          {events.map((e) => (
            <li key={e.id} className="ml-6">
              <span
                className={`absolute -left-[7px] flex h-3.5 w-3.5 rounded-full ring-4 ring-[var(--sp-surface)] ${
                  e.kind === "milestone" ? "bg-violet-500" : "bg-emerald-500"
                }`}
              />
              <time className="text-xs text-[var(--sp-muted)]">
                {formatSriLankaDateTime(e.date.toISOString())}
              </time>
              <p className="font-medium text-sm mt-0.5">
                {e.kind === "milestone" ? "Milestone: " : "Update: "}
                {e.title}
                {e.status ? (
                  <span className="stitch-chip text-[10px] ml-2">{e.status}</span>
                ) : null}
              </p>
              {e.subtitle ? (
                <p className="text-xs text-[var(--sp-muted)] mt-1 line-clamp-2">{e.subtitle}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
