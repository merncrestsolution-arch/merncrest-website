"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Project = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  budgetCents: number;
  tasks: { id: string; title: string; status: string }[];
};

export function ErpProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/projects");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setProjects(data.projects ?? []);
    setSelected((prev) => prev || data.projects?.[0]?.id || null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = projects.find((p) => p.id === selected);

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

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/erp/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selected, title: taskTitle }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setTaskTitle("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form onSubmit={createProject} className="flex gap-2 max-w-md">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="New project name"
          className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" disabled={busy}>Create</Button>
      </form>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setSelected(p.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                  selected === p.id ? "border-accent/50 bg-accent/10" : "border-white/10"
                }`}>
                <p className="font-mono text-xs text-accent">{p.projectCode}</p>
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted">{p.status}</p>
              </button>
            </li>
          ))}
        </ul>

        {active && (
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div>
              <h3 className="font-display font-semibold">{active.name}</h3>
              <p className="text-sm text-muted">Budget {formatMoney(active.budgetCents)} · {active.status}</p>
            </div>
            <form onSubmit={addTask} className="flex gap-2">
              <input required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="New task"
                className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
              <Button type="submit" size="sm" disabled={busy}>Add task</Button>
            </form>
            <ul className="space-y-2">
              {active.tasks.map((t) => (
                <li key={t.id} className="text-sm flex justify-between border-b border-white/5 pb-2">
                  <span>{t.title}</span>
                  <button
                    type="button"
                    className="text-xs text-accent"
                    onClick={async () => {
                      await fetch("/api/erp/projects", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          taskId: t.id,
                          status: t.status === "DONE" ? "TODO" : "DONE",
                        }),
                      });
                      await load();
                    }}
                  >
                    {t.status}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
