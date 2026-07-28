"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { formatSriLankaDateTime } from "@/lib/timezone";

type Update = {
  id: string;
  title: string;
  body: string;
  processStage: string | null;
  createdAt: string;
};

export function ProjectUpdatesPanel({ projectId }: { projectId: string }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [processStage, setProcessStage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/staff/projects/${projectId}/updates`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setUpdates(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addUpdate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          processStage: processStage || undefined,
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      setTitle("");
      setBody("");
      setProcessStage("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--sp-muted)]">Timestamped project update log.</p>
        <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Log update
        </button>
      </div>

      {error ? <p className="stitch-auth-error text-sm">{error}</p> : null}

      {showForm ? (
        <section className="stitch-section-card">
          <div className="stitch-section-body">
            <form onSubmit={addUpdate} className="grid gap-2 max-w-xl">
              <input
                className="stitch-input"
                placeholder="Update title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                className="stitch-input"
                placeholder="Process stage (optional)"
                value={processStage}
                onChange={(e) => setProcessStage(e.target.value)}
              />
              <textarea
                className="stitch-input min-h-[100px]"
                placeholder="Update details"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                Save update
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="stitch-section-card">
        <div className="stitch-section-body space-y-4">
          {updates.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)] py-4">No updates logged yet.</p>
          ) : (
            updates.map((u) => (
              <article key={u.id} className="border-b border-[var(--sp-outline)] pb-4 last:border-0">
                <div className="flex flex-wrap justify-between gap-2 mb-1">
                  <h4 className="font-medium m-0">{u.title}</h4>
                  <span className="text-xs text-[var(--sp-muted)]">
                    {formatSriLankaDateTime(u.createdAt)}
                  </span>
                </div>
                {u.processStage ? (
                  <p className="text-xs text-violet-400 mb-2">{u.processStage}</p>
                ) : null}
                <p className="text-sm whitespace-pre-wrap m-0">{u.body}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
