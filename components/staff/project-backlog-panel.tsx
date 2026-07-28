"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type BacklogItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export function ProjectBacklogPanel({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/staff/projects/${projectId}/backlog`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setItems(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/backlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      setTitle("");
      setDescription("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/backlog?id=${id}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const backlog = items.filter((i) => i.status === "BACKLOG");

  return (
    <div className="space-y-4">
      {error ? <p className="stitch-auth-error text-sm">{error}</p> : null}

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Future improvements</h3>
        </div>
        <div className="stitch-section-body">
          <form onSubmit={addItem} className="grid gap-2 max-w-xl mb-4">
            <input
              className="stitch-input"
              placeholder="Improvement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="stitch-input min-h-[60px]"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
              <Plus className="h-3.5 w-3.5" /> Add to backlog
            </button>
          </form>

          {backlog.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No backlog items yet.</p>
          ) : (
            <ul className="space-y-3">
              {backlog.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 border-b border-[var(--sp-outline)] pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.description ? (
                      <p className="text-xs text-[var(--sp-muted)] mt-1">{item.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="stitch-btn-danger-sm !p-1.5"
                    disabled={busy}
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
