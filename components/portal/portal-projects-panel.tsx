"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import {
  PORTAL_PROJECT_TYPES,
  type PortalProjectType,
} from "@/lib/portal/project-types";

type PortalProject = {
  id: string;
  projectCode: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
  progressPct: number;
  clientBrief?: string | null;
  nextSteps?: string | null;
  nextProcess?: string | null;
  nextPaymentAt?: string | null;
  nextPaymentCents?: number;
  milestones: { id: string; title: string; status: string; dueDate: string | null }[];
  schedule?: {
    id: string;
    label: string;
    amountCents: number;
    dueDate: string;
    status: string;
  }[];
  updates?: {
    id: string;
    title: string;
    body: string;
    processStage?: string | null;
    createdAt: string;
  }[];
  taskSummary: { total: number; done: number; inProgress: number };
};

function badge(status: string) {
  if (status === "COMPLETED" || status === "DONE" || status === "PAID")
    return "rlk-badge rlk-badge-done";
  if (status === "ACTIVE" || status === "IN_PROGRESS" || status === "INVOICED")
    return "rlk-badge rlk-badge-open";
  if (status === "ON_HOLD" || status === "OVERDUE") return "rlk-badge rlk-badge-pending";
  return "rlk-badge rlk-badge-hold";
}

export function PortalProjectsPanel() {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [serviceType, setServiceType] = useState<PortalProjectType>("WEBSITE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/portal/projects")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load projects");
        setProjects(d.projects ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/portal/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          title,
          description,
          budgetRange: budgetRange || undefined,
          timeline: timeline || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage(data.message || "Request submitted.");
      setTitle("");
      setDescription("");
      setBudgetRange("");
      setTimeline("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  const active = projects.find((p) => p.id === selected) || projects[0] || null;

  useEffect(() => {
    if (!selected && projects[0]) setSelected(projects[0].id);
  }, [projects, selected]);

  if (loading) return <p className="rlk-empty">Loading projects…</p>;

  return (
    <>
      <section className="rlk-section rlk-section-accent-orange">
        <div className="rlk-section-head">
          <h2>Request a project</h2>
        </div>
        <div className="rlk-section-body">
          <p className="text-sm text-[#666] mb-3">
            Custom software, websites, mobile apps — requests go to CRM for sales follow-up.
          </p>
          <form onSubmit={submitRequest} className="space-y-3 max-w-xl">
            <select
              className="rlk-input w-full"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as PortalProjectType)}
            >
              {PORTAL_PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              className="rlk-input w-full"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
            />
            <textarea
              className="rlk-input w-full min-h-[7rem] h-auto py-2"
              required
              minLength={20}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe goals, features, and constraints…"
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                className="rlk-input"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                placeholder="Budget range (optional)"
              />
              <input
                className="rlk-input"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="Timeline (optional)"
              />
            </div>
            {error ? <p className="rlk-login-error">{error}</p> : null}
            {message ? <p className="text-sm text-[#28a745]">{message}</p> : null}
            <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4" disabled={busy}>
              {busy ? "Sending…" : "Submit project request"}
            </button>
          </form>
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-teal">
        <div className="rlk-section-head">
          <h2>My projects</h2>
          <Link href="/portal/payments?tab=projects" className="rlk-link text-sm">
            Payment history
          </Link>
        </div>
        <div className="rlk-section-body">
          {projects.length === 0 ? (
            <p className="rlk-empty">
              No delivery projects yet. Submit a request above, or wait for sales to attach your
              project.
            </p>
          ) : (
            <div className="grid lg:grid-cols-[240px_1fr] gap-4">
              <div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={`rlk-shortcut w-full text-left !items-start !flex-col !gap-0.5 ${
                      active?.id === p.id ? "!text-[#17a2b8]" : ""
                    }`}
                  >
                    <span className="rlk-mono text-xs">{p.projectCode}</span>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-[#666]">
                      {p.status} · {p.progressPct}%
                    </span>
                  </button>
                ))}
              </div>

              {active && (
                <div className="space-y-3">
                  <div className="rlk-row !items-start">
                    <div>
                      <p className="rlk-mono text-xs text-[#17a2b8]">{active.projectCode}</p>
                      <h3 className="font-medium text-base mt-0.5">{active.name}</h3>
                      {active.description && (
                        <p className="text-sm text-[#666] mt-1">{active.description}</p>
                      )}
                    </div>
                    <span className={badge(active.status)}>{active.status}</span>
                  </div>

                  <Link
                    href={`/portal/projects/${active.id}`}
                    className="rlk-btn-green !w-auto !inline-flex text-sm"
                  >
                    Open project dashboard
                  </Link>

                  <div className="rlk-stats !mb-0">
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{active.progressPct}%</div>
                      <div className="rlk-stat-label">Progress</div>
                    </div>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num text-base">
                        {active.taskSummary.done}/{active.taskSummary.total}
                      </div>
                      <div className="rlk-stat-label">Tasks done</div>
                    </div>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num text-base">
                        {active.nextPaymentAt
                          ? new Date(active.nextPaymentAt).toLocaleDateString()
                          : "—"}
                      </div>
                      <div className="rlk-stat-label">
                        Next payment
                        {active.nextPaymentCents
                          ? ` · ${formatMoney(active.nextPaymentCents)}`
                          : ""}
                      </div>
                    </div>
                  </div>

                  {active.nextProcess && (
                    <p className="text-sm">
                      <strong>Next process:</strong> {active.nextProcess}
                    </p>
                  )}
                  {active.nextSteps && (
                    <p className="text-sm whitespace-pre-wrap">
                      <strong>Next steps:</strong>
                      <br />
                      {active.nextSteps}
                    </p>
                  )}
                  {active.clientBrief && (
                    <p className="text-sm whitespace-pre-wrap text-[#666]">
                      <strong>Brief:</strong> {active.clientBrief}
                    </p>
                  )}

                  <div>
                    <p className="font-medium text-sm mb-1">Milestones</p>
                    {active.milestones.length === 0 ? (
                      <p className="rlk-empty">Milestones appear after kickoff.</p>
                    ) : (
                      active.milestones.map((m) => (
                        <div key={m.id} className="rlk-row">
                          <span>{m.title}</span>
                          <span className="text-xs text-[#666]">
                            {m.status}
                            {m.dueDate
                              ? ` · ${new Date(m.dueDate).toLocaleDateString()}`
                              : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {(active.schedule || []).length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-1">Payment schedule</p>
                      {active.schedule!.map((s) => (
                        <div key={s.id} className="rlk-row">
                          <span>
                            {s.label} · {formatMoney(s.amountCents)}
                          </span>
                          <span className="text-xs text-[#666]">
                            {new Date(s.dueDate).toLocaleDateString()} · {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(active.updates || []).length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-1">Updates from MernCrest</p>
                      {active.updates!.map((u) => (
                        <div key={u.id} className="rlk-row !flex-col !items-stretch !gap-0.5">
                          <p className="font-medium text-[13px]">{u.title}</p>
                          <p className="text-xs text-[#666] whitespace-pre-wrap">{u.body}</p>
                          <p className="text-[11px] text-[#999]">
                            {new Date(u.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href="/portal/invoices"
                      className="rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                    >
                      Pay invoice
                    </Link>
                    <Link
                      href="/portal/tickets"
                      className="rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
                    >
                      Open ticket
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
