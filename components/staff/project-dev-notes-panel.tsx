"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";

export function ProjectDevNotesPanel({ projectId }: { projectId: string }) {
  const [developmentNotes, setDevelopmentNotes] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [progressOverridePct, setProgressOverridePct] = useState<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/staff/projects/${projectId}/development-notes`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setDevelopmentNotes(d.data.developmentNotes ?? "");
        setNextSteps(d.data.nextSteps ?? "");
        setProgressOverridePct(
          d.data.progressOverridePct != null ? String(d.data.progressOverridePct) : ""
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/development-notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developmentNotes,
          nextSteps,
          progressOverridePct: progressOverridePct === "" ? null : Number(progressOverridePct),
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stitch-section-card">
      <div className="stitch-section-head">
        <h3>Development notes (internal)</h3>
        <button type="button" className="stitch-btn-primary-sm" disabled={busy} onClick={save}>
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>
      <div className="stitch-section-body space-y-3 max-w-2xl">
        {error ? <p className="stitch-auth-error text-sm">{error}</p> : null}
        <textarea
          className="stitch-input min-h-[160px]"
          placeholder="Internal development notes — not visible to clients"
          value={developmentNotes}
          onChange={(e) => setDevelopmentNotes(e.target.value)}
        />
        <textarea
          className="stitch-input min-h-[80px]"
          placeholder="Next steps (shown on overview)"
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
        />
        <div>
          <label className="text-xs text-[var(--sp-muted)] block mb-1">
            Progress override % (leave empty for auto from tasks)
          </label>
          <input
            className="stitch-input !w-32"
            type="number"
            min={0}
            max={100}
            value={progressOverridePct}
            onChange={(e) => setProgressOverridePct(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
