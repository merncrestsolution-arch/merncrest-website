"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/commerce-format";
import { KANBAN_COLUMNS, POMODORO_MINUTES } from "@/lib/erp/projects/constants";

type Member = { user: { id: string; fullName: string; email: string }; role: string };
type Milestone = {
  id: string;
  title: string;
  status: string;
  progressPct?: number;
  dueDate?: string | null;
};
type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  progressPct: number;
  estimateMinutes: number;
  trackedMinutes: number;
  dueDate?: string | null;
  startDate?: string | null;
  parentId?: string | null;
  milestoneId?: string | null;
  recurrence?: string;
  assignee?: { id: string; fullName: string } | null;
  milestone?: { id: string; title: string } | null;
  children?: { id: string; title: string; status: string; progressPct: number }[];
  dependencies?: { id: string; dependsOnId: string; type: string }[];
  _count?: { comments: number; attachments: number; timeEntries: number };
};
type Finance = {
  budgetCents: number;
  spentCents: number;
  revenueCents: number;
  profitCents: number;
  budgetVarianceCents: number;
  marginPct: number | null;
  nextPaymentAt: string | Date | null;
  nextPaymentCents: number;
  overdueCount: number;
  overdueCents: number;
};

type Expense = {
  id: string;
  title: string;
  category: string;
  amountCents: number;
  expenseDate: string;
  notes?: string | null;
};

type PaymentRow = {
  id: string;
  label: string;
  amountCents: number;
  dueDate: string;
  status: string;
  paidAt?: string | null;
};

type ClientUser = {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  profile?: { customerCode?: string | null; phone?: string | null } | null;
};

type ClientUpdate = {
  id: string;
  title: string;
  body: string;
  processStage?: string | null;
  createdAt: string;
};

type Project = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  budgetCents: number;
  spentCents?: number;
  revenueCents?: number;
  progressPct?: number;
  startDate?: string | null;
  endDate?: string | null;
  nextPaymentAt?: string | null;
  nextPaymentCents?: number;
  clientBrief?: string | null;
  nextSteps?: string | null;
  nextProcess?: string | null;
  customer?: ClientUser | null;
  customerId?: string | null;
  tasks: Task[];
  milestones: Milestone[];
  members: Member[];
  expenses?: Expense[];
  payments?: PaymentRow[];
  clientUpdates?: ClientUpdate[];
  finance?: Finance;
  kanban?: Record<string, Task[]>;
};

type WorkloadRow = {
  userId: string;
  fullName: string;
  openTasks: number;
  blockedTasks: number;
  estimateMinutes: number;
  overdue: number;
  capacityPct: number;
};

type GanttBar = {
  id: string;
  title: string;
  status: string;
  progressPct: number;
  leftPct: number;
  widthPct: number;
};

type Tab = "board" | "kanban" | "gantt" | "workload" | "finance" | "client";

function statusBadge(status: string) {
  if (status === "DONE" || status === "COMPLETED") return "rlk-badge rlk-badge-done";
  if (status === "IN_PROGRESS" || status === "ACTIVE" || status === "IN_REVIEW")
    return "rlk-badge rlk-badge-open";
  if (status === "BLOCKED") return "rlk-badge rlk-badge-pending";
  return "rlk-badge rlk-badge-hold";
}

function priorityClass(p: string) {
  if (p === "CRITICAL") return "text-[#c62828] font-semibold";
  if (p === "HIGH") return "text-[#d84315]";
  if (p === "LOW") return "text-[#999]";
  return "text-[#666]";
}

export function ErpProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("board");
  const [name, setName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [parentId, setParentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimateMin, setEstimateMin] = useState("60");
  const [recurrence, setRecurrence] = useState("NONE");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [attachUrl, setAttachUrl] = useState("");
  const [attachName, setAttachName] = useState("");
  const [dependsOnId, setDependsOnId] = useState("");
  const [workload, setWorkload] = useState<WorkloadRow[]>([]);
  const [gantt, setGantt] = useState<GanttBar[]>([]);
  const [criticalIds, setCriticalIds] = useState<string[]>([]);
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [pomodoroLeft, setPomodoroLeft] = useState(0);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("GENERAL");
  const [payLabel, setPayLabel] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDue, setPayDue] = useState("");
  const [revenueInput, setRevenueInput] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientHits, setClientHits] = useState<
    { id: string; fullName: string; email: string; company?: string | null; customerCode?: string }[]
  >([]);
  const [brief, setBrief] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [nextProcess, setNextProcess] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<
    { id: string; label: string; subject: string; body: string }[]
  >([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/erp/projects");
      const text = await res.text();
      let data: { error?: string; projects?: Project[] } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(text?.slice(0, 120) || `Server error (${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error || `Failed (${res.status})`);
        return;
      }
      setError("");
      setProjects(data.projects ?? []);
      setSelected((prev) => prev || data.projects?.[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    }
  }, []);

  const loadExtras = useCallback(async (projectId: string | null, view: Tab) => {
    if (view === "workload") {
      const res = await fetch("/api/erp/projects?view=workload");
      const data = await res.json();
      if (res.ok) setWorkload(data.workload ?? []);
    }
    if (view === "gantt" && projectId) {
      const [gRes, cRes] = await Promise.all([
        fetch(`/api/erp/projects?view=gantt&projectId=${projectId}`),
        fetch(`/api/erp/projects?view=critical-path&projectId=${projectId}`),
      ]);
      const gData = await gRes.json();
      const cData = await cRes.json();
      if (gRes.ok) setGantt(gData.gantt?.bars ?? []);
      if (cRes.ok) setCriticalIds(cData.criticalPath?.criticalPathIds ?? []);
    }
    if (view === "client" && projectId) {
      const res = await fetch(`/api/erp/projects?view=emails&projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setEmailTemplates(data.templates ?? []);
        setBrief(data.clientBrief || "");
        setNextSteps(data.nextSteps || "");
        setNextProcess(data.nextProcess || "");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadExtras(selected, tab);
  }, [selected, tab, loadExtras]);

  useEffect(() => {
    if (!pomodoroTaskId || pomodoroLeft <= 0) return;
    const t = setInterval(() => {
      setPomodoroLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          void finishPomodoro(pomodoroTaskId);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroTaskId]);

  const active = projects.find((p) => p.id === selected);
  const detail = useMemo(
    () => active?.tasks.find((t) => t.id === detailId) || null,
    [active, detailId]
  );

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status: "ACTIVE", budgetCents: 5000000 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setName("");
      setSelected(data.project.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_milestone",
          projectId: selected,
          title: milestoneTitle,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setMilestoneTitle("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_task",
          projectId: selected,
          title: taskTitle,
          priority,
          assigneeId: assigneeId || undefined,
          milestoneId: milestoneId || undefined,
          parentId: parentId || undefined,
          dueDate: dueDate || undefined,
          estimateMinutes: Number(estimateMin) || 0,
          recurrence,
          startDate: dueDate ? new Date().toISOString() : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setTaskTitle("");
      setParentId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setTaskStatus(taskId: string, status: string) {
    await fetch("/api/erp/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_task", taskId, status }),
    });
    await load();
  }

  async function finishPomodoro(taskId: string) {
    await fetch("/api/erp/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pomodoro", taskId }),
    });
    setPomodoroTaskId(null);
    await load();
  }

  function startPomodoro(taskId: string) {
    setPomodoroTaskId(taskId);
    setPomodoroLeft(POMODORO_MINUTES * 60);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!detailId || !comment.trim()) return;
    await fetch("/api/erp/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", taskId: detailId, body: comment }),
    });
    setComment("");
    await load();
  }

  async function postAttach(e: React.FormEvent) {
    e.preventDefault();
    if (!detailId || !attachUrl || !attachName) return;
    await fetch("/api/erp/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "attach",
        taskId: detailId,
        fileName: attachName,
        fileUrl: attachUrl,
      }),
    });
    setAttachName("");
    setAttachUrl("");
    await load();
  }

  async function addDependency(e: React.FormEvent) {
    e.preventDefault();
    if (!detailId || !dependsOnId) return;
    await fetch("/api/erp/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_dependency", taskId: detailId, dependsOnId }),
    });
    setDependsOnId("");
    await load();
    if (selected) loadExtras(selected, "gantt");
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cents = Math.round(Number(expenseAmount) * 100);
    if (!cents || cents < 1) {
      setError("Enter a valid expense amount");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_expense",
          projectId: selected,
          title: expenseTitle,
          category: expenseCategory,
          amountCents: cents,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setExpenseTitle("");
      setExpenseAmount("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addPaymentSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !payDue) return;
    const cents = Math.round(Number(payAmount) * 100);
    if (!cents || cents < 1) {
      setError("Enter a valid payment amount");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_payment_schedule",
          projectId: selected,
          label: payLabel,
          amountCents: cents,
          dueDate: payDue,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setPayLabel("");
      setPayAmount("");
      setPayDue("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function markPaymentPaid(paymentId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_payment_paid", paymentId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setRevenue(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cents = Math.round(Number(revenueInput) * 100);
    if (cents < 0 || Number.isNaN(cents)) {
      setError("Enter a valid revenue amount");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_revenue",
          projectId: selected,
          revenueCents: cents,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setRevenueInput("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function searchClients(q: string) {
    setClientSearch(q);
    if (q.trim().length < 2) {
      setClientHits([]);
      return;
    }
    const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    if (res.ok) {
      setClientHits(
        (data.customers || data.rows || []).slice(0, 8).map(
          (c: {
            id: string;
            fullName: string;
            email: string;
            company?: string | null;
            customerCode?: string;
          }) => ({
            id: c.id,
            fullName: c.fullName,
            email: c.email,
            company: c.company,
            customerCode: c.customerCode,
          })
        )
      );
    }
  }

  async function linkCustomer(customerId: string | null) {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link_customer", projectId: selected, customerId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setClientSearch("");
      setClientHits([]);
      await load();
      await loadExtras(selected, "client");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveClientPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_client_plan",
          projectId: selected,
          clientBrief: brief,
          nextSteps,
          nextProcess,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      await load();
      await loadExtras(selected, "client");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addClientUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_client_update",
          projectId: selected,
          title: updateTitle,
          body: updateBody,
          processStage: nextProcess || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setUpdateTitle("");
      setUpdateBody("");
      await load();
      await loadExtras(selected, "client");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyTemplate(t: { id: string; subject: string; body: string }) {
    const text = `Subject: ${t.subject}\n\n${t.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(t.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy — select the text manually");
    }
  }

  const rootTasks = active?.tasks.filter((t) => !t.parentId) || [];
  const fin = active?.finance;

  return (
    <div>
      {error ? <p className="rlk-login-error !mb-4">{error}</p> : null}

      {pomodoroTaskId && pomodoroLeft > 0 && (
        <div className="rlk-section rlk-section-accent-orange !mb-4">
          <div className="rlk-section-body flex items-center justify-between gap-3">
            <p className="font-medium text-[#333]">
              Focus session · {Math.floor(pomodoroLeft / 60)}:{String(pomodoroLeft % 60).padStart(2, "0")}
            </p>
            <button
              type="button"
              className="rlk-btn-ghost !w-auto !mt-0 !px-3 !py-1.5"
              onClick={() => {
                setPomodoroTaskId(null);
                setPomodoroLeft(0);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="rlk-section rlk-section-accent-orange">
        <div className="rlk-section-head">
          <h2>Create project</h2>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={createProject} className="flex flex-wrap gap-2 max-w-xl">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New project name"
              className="rlk-input flex-1 min-w-[200px]"
            />
            <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4" disabled={busy}>
              Create
            </button>
          </form>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["board", "kanban", "gantt", "workload", "finance", "client"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={
              tab === t
                ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
            }
            onClick={() => setTab(t)}
          >
            {t === "board"
              ? "Work plan"
              : t === "kanban"
                ? "Progress board"
                : t === "gantt"
                  ? "Schedule"
                  : t === "workload"
                    ? "Workload"
                    : t === "finance"
                      ? "Finance"
                      : "Client"}
          </button>
        ))}
      </div>

      {tab === "workload" ? (
        <section className="rlk-section rlk-section-accent-teal">
          <div className="rlk-section-head">
            <h2>Workload distribution</h2>
          </div>
          <div className="rlk-section-body">
            {workload.length === 0 ? (
              <p className="rlk-empty">No assigned open tasks.</p>
            ) : (
              workload.map((w) => (
                <div key={w.userId} className="rlk-row !flex-col !items-stretch !gap-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{w.fullName}</span>
                    <span className="text-sm text-[#666]">
                      {w.openTasks} open · {Math.round(w.estimateMinutes / 60)}h est ·{" "}
                      {w.capacityPct}% capacity
                    </span>
                  </div>
                  <div className="h-2 bg-[#eee] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#17a2b8]"
                      style={{ width: `${Math.min(100, w.capacityPct)}%` }}
                    />
                  </div>
                  {w.overdue > 0 && (
                    <span className="text-xs text-[#c62828]">{w.overdue} overdue</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          <section className="rlk-section rlk-section-accent-teal !mb-0">
            <div className="rlk-section-head">
              <h2>Projects</h2>
            </div>
            <div className="rlk-section-body !py-2">
              {projects.length === 0 ? (
                <p className="rlk-empty">No projects yet.</p>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={`rlk-shortcut w-full text-left !items-start !flex-col !gap-1 ${
                      selected === p.id ? "!text-[#17a2b8]" : ""
                    }`}
                  >
                    <span className="rlk-mono">{p.projectCode}</span>
                    <span className="font-medium truncate w-full">{p.name}</span>
                    <span className="text-xs text-[#666]">
                      {p.progressPct ?? 0}% · {p.status}
                      {p.customer?.fullName ? ` · ${p.customer.fullName}` : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          {active ? (
            <div className="space-y-4 min-w-0">
              <section className="rlk-section rlk-section-accent-green !mb-0">
                <div className="rlk-section-head">
                  <h2>{active.name}</h2>
                  <span className={statusBadge(active.status)}>{active.status}</span>
                </div>
                <div className="rlk-section-body">
                  <div className="rlk-stats !mb-4">
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{active.progressPct ?? 0}%</div>
                      <div className="rlk-stat-label">Progress</div>
                    </div>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{rootTasks.length}</div>
                      <div className="rlk-stat-label">Tasks</div>
                    </div>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{active.milestones.length}</div>
                      <div className="rlk-stat-label">Milestones</div>
                    </div>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{formatMoney(active.budgetCents)}</div>
                      <div className="rlk-stat-label">Budget</div>
                    </div>
                    {fin && (
                      <>
                        <div className="rlk-stat">
                          <div
                            className={`rlk-stat-num text-base ${
                              fin.profitCents >= 0 ? "!text-[#28a745]" : "!text-[#c62828]"
                            }`}
                          >
                            {formatMoney(fin.profitCents)}
                          </div>
                          <div className="rlk-stat-label">Profit</div>
                        </div>
                        <div className="rlk-stat">
                          <div className="rlk-stat-num text-base">
                            {fin.nextPaymentAt
                              ? new Date(fin.nextPaymentAt).toLocaleDateString()
                              : "—"}
                          </div>
                          <div className="rlk-stat-label">
                            Next due
                            {fin.nextPaymentCents
                              ? ` · ${formatMoney(fin.nextPaymentCents)}`
                              : ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {tab === "finance" ? (
                    <div className="space-y-4">
                      <div className="rlk-stats !mb-0">
                        <div className="rlk-stat">
                          <div className="rlk-stat-num text-base">
                            {formatMoney(fin?.revenueCents ?? active.revenueCents ?? 0)}
                          </div>
                          <div className="rlk-stat-label">Revenue</div>
                        </div>
                        <div className="rlk-stat">
                          <div className="rlk-stat-num text-base">
                            {formatMoney(fin?.spentCents ?? active.spentCents ?? 0)}
                          </div>
                          <div className="rlk-stat-label">Expenses</div>
                        </div>
                        <div className="rlk-stat">
                          <div
                            className={`rlk-stat-num text-base ${
                              (fin?.profitCents ?? 0) >= 0 ? "!text-[#28a745]" : "!text-[#c62828]"
                            }`}
                          >
                            {formatMoney(fin?.profitCents ?? 0)}
                          </div>
                          <div className="rlk-stat-label">
                            Profit
                            {fin?.marginPct != null ? ` · ${fin.marginPct}%` : ""}
                          </div>
                        </div>
                        <div className="rlk-stat">
                          <div className="rlk-stat-num text-base">
                            {fin?.nextPaymentAt
                              ? new Date(fin.nextPaymentAt).toLocaleDateString()
                              : "—"}
                          </div>
                          <div className="rlk-stat-label">
                            Next payment
                            {fin?.nextPaymentCents
                              ? ` · ${formatMoney(fin.nextPaymentCents)}`
                              : ""}
                          </div>
                        </div>
                      </div>
                      {(fin?.overdueCount ?? 0) > 0 && (
                        <p className="text-sm text-[#c62828]">
                          {fin!.overdueCount} overdue · {formatMoney(fin!.overdueCents)}
                        </p>
                      )}

                      <form onSubmit={setRevenue} className="flex flex-wrap gap-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={revenueInput}
                          onChange={(e) => setRevenueInput(e.target.value)}
                          placeholder={`Revenue (LKR) · now ${formatMoney(fin?.revenueCents ?? 0)}`}
                          className="rlk-input flex-1 min-w-[160px]"
                        />
                        <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-3" disabled={busy}>
                          Set revenue
                        </button>
                      </form>

                      <form onSubmit={addExpense} className="grid sm:grid-cols-4 gap-2">
                        <input
                          required
                          value={expenseTitle}
                          onChange={(e) => setExpenseTitle(e.target.value)}
                          placeholder="Expense title"
                          className="rlk-input sm:col-span-2"
                        />
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="rlk-input"
                        >
                          <option value="GENERAL">General</option>
                          <option value="LABOR">Labor</option>
                          <option value="SOFTWARE">Software</option>
                          <option value="TRAVEL">Travel</option>
                          <option value="CONTRACTOR">Contractor</option>
                        </select>
                        <input
                          required
                          type="number"
                          min={0}
                          step="0.01"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="Amount LKR"
                          className="rlk-input"
                        />
                        <button
                          type="submit"
                          className="rlk-btn-green !w-auto !mt-0 !px-3 sm:col-span-4"
                          disabled={busy}
                        >
                          + Add expense
                        </button>
                      </form>

                      <div>
                        <p className="font-medium text-sm mb-2">Expense lines</p>
                        {(active.expenses || []).length === 0 ? (
                          <p className="rlk-empty">No expenses yet.</p>
                        ) : (
                          (active.expenses || []).map((ex) => (
                            <div key={ex.id} className="rlk-row">
                              <div>
                                <p className="font-medium text-[13px]">{ex.title}</p>
                                <p className="text-xs text-[#666]">
                                  {ex.category} ·{" "}
                                  {new Date(ex.expenseDate).toLocaleDateString()}
                                </p>
                              </div>
                              <span>{formatMoney(ex.amountCents)}</span>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={addPaymentSchedule} className="grid sm:grid-cols-4 gap-2">
                        <input
                          required
                          value={payLabel}
                          onChange={(e) => setPayLabel(e.target.value)}
                          placeholder="Payment label"
                          className="rlk-input sm:col-span-2"
                        />
                        <input
                          required
                          type="number"
                          min={0}
                          step="0.01"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="Amount LKR"
                          className="rlk-input"
                        />
                        <input
                          required
                          type="date"
                          value={payDue}
                          onChange={(e) => setPayDue(e.target.value)}
                          className="rlk-input"
                        />
                        <button
                          type="submit"
                          className="rlk-btn-green !w-auto !mt-0 !px-3 sm:col-span-4"
                          disabled={busy}
                        >
                          + Schedule payment / due date
                        </button>
                      </form>

                      <div>
                        <p className="font-medium text-sm mb-2">Payment schedule</p>
                        {(active.payments || []).length === 0 ? (
                          <p className="rlk-empty">No payment schedule yet.</p>
                        ) : (
                          (active.payments || []).map((pay) => (
                            <div key={pay.id} className="rlk-row">
                              <div>
                                <p className="font-medium text-[13px]">{pay.label}</p>
                                <p className="text-xs text-[#666]">
                                  Due {new Date(pay.dueDate).toLocaleDateString()} · {pay.status}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>{formatMoney(pay.amountCents)}</span>
                                {pay.status !== "PAID" && pay.status !== "WAIVED" && (
                                  <button
                                    type="button"
                                    className="rlk-btn-sm"
                                    disabled={busy}
                                    onClick={() => void markPaymentPaid(pay.id)}
                                  >
                                    Mark paid
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : tab === "client" ? (
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-sm mb-2">Linked client</p>
                        {active.customer ? (
                          <div className="rlk-row !items-start">
                            <div>
                              <p className="font-medium">
                                {active.customer.fullName}
                                {active.customer.profile?.customerCode
                                  ? ` · ${active.customer.profile.customerCode}`
                                  : ""}
                              </p>
                              <p className="text-xs text-[#666]">
                                {active.customer.email}
                                {active.customer.company ? ` · ${active.customer.company}` : ""}
                                {active.customer.profile?.phone
                                  ? ` · ${active.customer.profile.phone}`
                                  : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="rlk-btn-ghost !w-auto !mt-0 !px-2 !py-1"
                              disabled={busy}
                              onClick={() => void linkCustomer(null)}
                            >
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <p className="rlk-empty !mb-2">No client linked yet.</p>
                        )}
                        <input
                          value={clientSearch}
                          onChange={(e) => void searchClients(e.target.value)}
                          placeholder="Search client by name, email, company…"
                          className="rlk-input w-full"
                        />
                        {clientHits.length > 0 && (
                          <div className="border border-[#e0e0e0] bg-white mt-1 max-h-40 overflow-y-auto">
                            {clientHits.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="rlk-shortcut w-full text-left !rounded-none"
                                onClick={() => void linkCustomer(c.id)}
                              >
                                <span className="font-medium">{c.fullName}</span>
                                <span className="text-xs text-[#666] block">
                                  {c.email}
                                  {c.customerCode ? ` · ${c.customerCode}` : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <form onSubmit={saveClientPlan} className="space-y-2">
                        <p className="font-medium text-sm">Brief · next process · next steps</p>
                        <textarea
                          value={brief}
                          onChange={(e) => setBrief(e.target.value)}
                          rows={2}
                          placeholder="Client brief / scope summary"
                          className="rlk-input w-full min-h-[4rem] h-auto py-2"
                        />
                        <input
                          value={nextProcess}
                          onChange={(e) => setNextProcess(e.target.value)}
                          placeholder="Next process e.g. Design approval → Development → UAT"
                          className="rlk-input w-full"
                        />
                        <textarea
                          value={nextSteps}
                          onChange={(e) => setNextSteps(e.target.value)}
                          rows={3}
                          placeholder="Next steps (what we do / what client must provide)"
                          className="rlk-input w-full min-h-[5rem] h-auto py-2"
                        />
                        <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4" disabled={busy}>
                          Save plan
                        </button>
                      </form>

                      <form onSubmit={addClientUpdate} className="space-y-2">
                        <p className="font-medium text-sm">Log client update</p>
                        <input
                          required
                          value={updateTitle}
                          onChange={(e) => setUpdateTitle(e.target.value)}
                          placeholder="Update title"
                          className="rlk-input w-full"
                        />
                        <textarea
                          required
                          value={updateBody}
                          onChange={(e) => setUpdateBody(e.target.value)}
                          rows={3}
                          placeholder="What changed / what we told the client"
                          className="rlk-input w-full min-h-[5rem] h-auto py-2"
                        />
                        <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4" disabled={busy}>
                          + Add update
                        </button>
                      </form>

                      {(active.clientUpdates || []).length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2">Update history</p>
                          {(active.clientUpdates || []).map((u) => (
                            <div key={u.id} className="rlk-row !flex-col !items-stretch !gap-0.5">
                              <p className="font-medium text-[13px]">{u.title}</p>
                              <p className="text-xs text-[#666] whitespace-pre-wrap">{u.body}</p>
                              <p className="text-[11px] text-[#999]">
                                {new Date(u.createdAt).toLocaleString()}
                                {u.processStage ? ` · ${u.processStage}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-sm mb-1">Email templates — copy &amp; paste to client</p>
                        <p className="text-xs text-[#666] mb-2">
                          Auto-filled from project, client, next steps, and payment due.
                        </p>
                        {emailTemplates.length === 0 ? (
                          <p className="rlk-empty">Templates load when this tab opens.</p>
                        ) : (
                          emailTemplates.map((t) => (
                            <div key={t.id} className="border border-[#e0e0e0] mb-2 p-3 bg-[#fafafa]">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <p className="font-medium text-[13px]">{t.label}</p>
                                <button
                                  type="button"
                                  className="rlk-btn-green !w-auto !mt-0 !px-3 !py-1.5"
                                  onClick={() => void copyTemplate(t)}
                                >
                                  {copiedId === t.id ? "Copied!" : "Copy email"}
                                </button>
                              </div>
                              <p className="text-xs text-[#666] mb-1">
                                <strong>Subject:</strong> {t.subject}
                              </p>
                              <pre className="text-xs text-[#333] whitespace-pre-wrap font-sans max-h-40 overflow-y-auto bg-white border border-[#e0e0e0] p-2">
                                {t.body}
                              </pre>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                  <form onSubmit={addMilestone} className="flex flex-wrap gap-2 mb-3">
                    <input
                      required
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      placeholder="New milestone"
                      className="rlk-input flex-1 min-w-[140px]"
                    />
                    <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-3" disabled={busy}>
                      + Milestone
                    </button>
                  </form>

                  <form onSubmit={addTask} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                    <input
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Task / subtask title"
                      className="rlk-input sm:col-span-2 lg:col-span-3"
                    />
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="rlk-input"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                    <select
                      value={milestoneId}
                      onChange={(e) => setMilestoneId(e.target.value)}
                      className="rlk-input"
                    >
                      <option value="">No milestone</option>
                      {active.milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="rlk-input"
                    >
                      <option value="">Top-level task</option>
                      {rootTasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          Sub of: {t.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="rlk-input"
                    >
                      <option value="">Unassigned</option>
                      {active.members.map((m) => (
                        <option key={m.user.id} value={m.user.id}>
                          {m.user.fullName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rlk-input"
                    />
                    <input
                      type="number"
                      min={0}
                      value={estimateMin}
                      onChange={(e) => setEstimateMin(e.target.value)}
                      placeholder="Estimate min"
                      className="rlk-input"
                    />
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="rlk-input"
                    >
                      <option value="NONE">No repeat</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                    <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4" disabled={busy}>
                      + Add task
                    </button>
                  </form>
                    </>
                  )}
                </div>
              </section>

              {tab === "kanban" && (
                <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-2">
                  {KANBAN_COLUMNS.map((col) => (
                    <section key={col} className="rlk-section rlk-section-accent-teal !mb-0">
                      <div className="rlk-section-head">
                        <h2 className="!text-sm">{col.replace("_", " ")}</h2>
                      </div>
                      <div className="rlk-section-body min-h-[120px] !py-2">
                        {(active.kanban?.[col] || rootTasks.filter((t) => t.status === col)).map(
                          (t) => (
                            <div
                              key={t.id}
                              className="rlk-row !flex-col !items-stretch !gap-1 cursor-pointer"
                              onClick={() => setDetailId(t.id)}
                            >
                              <p className="font-medium text-[13px]">{t.title}</p>
                              <p className={`text-[11px] ${priorityClass(t.priority)}`}>
                                {t.priority} · {t.progressPct}%
                                {criticalIds.includes(t.id) ? " · critical" : ""}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {KANBAN_COLUMNS.filter((c) => c !== col)
                                  .slice(0, 3)
                                  .map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      className="rlk-btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void setTaskStatus(t.id, c);
                                      }}
                                    >
                                      → {c.replace("_", " ")}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {tab === "gantt" && (
                <section className="rlk-section rlk-section-accent-gray !mb-0">
                  <div className="rlk-section-head">
                    <h2>Project schedule</h2>
                  </div>
                  <div className="rlk-section-body space-y-2">
                    {gantt.length === 0 ? (
                      <p className="rlk-empty">
                        Add start and due dates on tasks to see the schedule.
                      </p>
                    ) : (
                      gantt.map((b) => (
                        <div key={b.id} className="text-sm">
                          <div className="flex justify-between gap-2 mb-0.5">
                            <button
                              type="button"
                              className="rlk-link text-left truncate"
                              onClick={() => setDetailId(b.id)}
                            >
                              {b.title}
                              {criticalIds.includes(b.id) ? " ★" : ""}
                            </button>
                            <span className="text-[#999] shrink-0">{b.progressPct}%</span>
                          </div>
                          <div className="relative h-6 bg-[#f0f0f0] rounded overflow-hidden">
                            <div
                              className={`absolute top-0 h-full rounded ${
                                criticalIds.includes(b.id) ? "bg-[#d84315]" : "bg-[#17a2b8]"
                              }`}
                              style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%` }}
                              title={b.status}
                            />
                          </div>
                        </div>
                      ))
                    )}
                    {criticalIds.length > 0 && (
                      <p className="text-xs text-[#666] mt-2">
                        ★ Orange bars = critical path ({criticalIds.length} tasks)
                      </p>
                    )}
                  </div>
                </section>
              )}

              {tab === "board" && (
                <section className="rlk-section rlk-section-accent-teal !mb-0">
                  <div className="rlk-section-head">
                    <h2>Work plan · milestones → tasks → subtasks</h2>
                  </div>
                  <div className="rlk-section-body">
                    {active.milestones.map((m) => (
                      <div key={m.id} className="mb-3">
                        <p className="font-medium text-[#333]">
                          ◆ {m.title}{" "}
                          <span className={statusBadge(m.status)}>{m.status}</span>
                          <span className="text-xs text-[#666] ml-2">{m.progressPct ?? 0}%</span>
                        </p>
                        {rootTasks
                          .filter((t) => t.milestone?.id === m.id || t.milestoneId === m.id)
                          .map((t) => (
                            <TaskRow
                              key={t.id}
                              task={t}
                              critical={criticalIds.includes(t.id)}
                              onOpen={() => setDetailId(t.id)}
                              onStatus={setTaskStatus}
                              onPomodoro={startPomodoro}
                            />
                          ))}
                      </div>
                    ))}
                    <p className="font-medium text-[#666] mt-2 mb-1">Unmilestoned</p>
                    {rootTasks
                      .filter((t) => !t.milestoneId && !t.milestone)
                      .map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          critical={criticalIds.includes(t.id)}
                          onOpen={() => setDetailId(t.id)}
                          onStatus={setTaskStatus}
                          onPomodoro={startPomodoro}
                        />
                      ))}
                    {rootTasks.length === 0 && <p className="rlk-empty">No tasks yet.</p>}
                  </div>
                </section>
              )}

              {detail && (
                <section className="rlk-section rlk-section-accent-orange !mb-0">
                  <div className="rlk-section-head">
                    <h2>{detail.title}</h2>
                    <button
                      type="button"
                      className="rlk-btn-ghost !w-auto !mt-0 !px-2 !py-1"
                      onClick={() => setDetailId(null)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="rlk-section-body space-y-3">
                    <p className="text-sm text-[#666]">
                      {detail.priority} · {detail.status} · {detail.progressPct}% · est{" "}
                      {detail.estimateMinutes}m · tracked {detail.trackedMinutes}m
                      {detail.recurrence && detail.recurrence !== "NONE"
                        ? ` · repeats ${detail.recurrence}`
                        : ""}
                    </p>
                    {detail.children && detail.children.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#666] mb-1">Subtasks</p>
                        {detail.children.map((c) => (
                          <div key={c.id} className="rlk-row text-sm">
                            <span>{c.title}</span>
                            <span className={statusBadge(c.status)}>
                              {c.status} · {c.progressPct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={addDependency} className="flex flex-wrap gap-2">
                      <select
                        value={dependsOnId}
                        onChange={(e) => setDependsOnId(e.target.value)}
                        className="rlk-input flex-1"
                      >
                        <option value="">Depends on…</option>
                        {rootTasks
                          .filter((t) => t.id !== detail.id)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                      </select>
                      <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-3">
                        Add dependency
                      </button>
                    </form>
                    <form onSubmit={postComment} className="flex flex-wrap gap-2">
                      <input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Discussion comment"
                        className="rlk-input flex-1"
                      />
                      <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-3">
                        Comment
                      </button>
                    </form>
                    <form onSubmit={postAttach} className="flex flex-wrap gap-2">
                      <input
                        value={attachName}
                        onChange={(e) => setAttachName(e.target.value)}
                        placeholder="File name"
                        className="rlk-input flex-1"
                      />
                      <input
                        value={attachUrl}
                        onChange={(e) => setAttachUrl(e.target.value)}
                        placeholder="https://… file URL"
                        className="rlk-input flex-1"
                      />
                      <button type="submit" className="rlk-btn-ghost !w-auto !mt-0 !px-3">
                        Attach
                      </button>
                    </form>
                    <button
                      type="button"
                      className="rlk-btn-green !w-auto !mt-0 !px-4"
                      onClick={() => startPomodoro(detail.id)}
                      disabled={!!pomodoroTaskId}
                    >
                      Start {POMODORO_MINUTES}m focus session
                    </button>
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  critical,
  onOpen,
  onStatus,
  onPomodoro,
}: {
  task: Task;
  critical?: boolean;
  onOpen: () => void;
  onStatus: (id: string, status: string) => void;
  onPomodoro: (id: string) => void;
}) {
  return (
    <div className="ml-3 border-l border-[#e0e0e0] pl-3 py-1">
      <div className="rlk-row !items-start">
        <button type="button" className="text-left flex-1" onClick={onOpen}>
          <span className="font-medium text-[13px]">
            {task.title}
            {critical ? " ★" : ""}
          </span>
          <span className={`block text-[11px] ${priorityClass(task.priority)}`}>
            {task.assignee?.fullName || "Unassigned"} · {task.progressPct}%
            {task.children?.length ? ` · ${task.children.length} sub` : ""}
          </span>
        </button>
        <div className="flex flex-col gap-1 items-end">
          <button
            type="button"
            className={statusBadge(task.status)}
            onClick={() =>
              onStatus(task.id, task.status === "DONE" ? "TODO" : "DONE")
            }
          >
            {task.status}
          </button>
          <button
            type="button"
            className="rlk-btn-sm"
            onClick={() => onPomodoro(task.id)}
          >
            Focus
          </button>
        </div>
      </div>
      {task.children?.map((c) => (
        <div key={c.id} className="ml-3 text-sm text-[#666] py-0.5">
          └ {c.title} · {c.status} · {c.progressPct}%
        </div>
      ))}
    </div>
  );
}
