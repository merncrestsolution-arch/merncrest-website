"use client";

import { useEffect, useState } from "react";

type Suggestion = { title: string; reason: string; action?: string };

/** Dismissible AI suggestions for CRM lead / agent chat views */
export function AiSuggestionsPanel({
  leadId,
  sessionId,
}: {
  leadId?: string;
  sessionId?: string;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId && !sessionId) return;
    let cancelled = false;
    setLoading(true);
    const q = new URLSearchParams();
    if (leadId) q.set("leadId", leadId);
    if (sessionId) q.set("sessionId", sessionId);
    fetch(`/api/admin/suggestions?${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems(d.suggestions || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, sessionId]);

  if (hidden || (!loading && items.length === 0)) return null;

  return (
    <section className="rlk-section rlk-section-accent-teal mb-3">
      <div className="rlk-section-head">
        <h2>Suggested for you</h2>
        <button
          type="button"
          className="text-sm text-[#666]"
          onClick={async () => {
            setHidden(true);
            await fetch("/api/admin/suggestions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "DISMISSED",
                leadId,
                sessionId,
                suggestionJson: JSON.stringify(items),
              }),
            });
          }}
        >
          Dismiss
        </button>
      </div>
      <div className="rlk-section-body">
        {loading ? (
          <p className="text-sm text-[#666]">Loading suggestions…</p>
        ) : (
          <ul className="space-y-2">
            {items.map((s, i) => (
              <li key={`${s.title}-${i}`} className="text-sm">
                <strong>{s.title}</strong>
                <p className="text-[#666]">{s.reason}</p>
                {s.action ? (
                  <button
                    type="button"
                    className="mt-1 text-[#17a2b8] underline"
                    onClick={async () => {
                      await fetch("/api/admin/suggestions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "ACCEPTED",
                          leadId,
                          sessionId,
                          suggestionJson: JSON.stringify([s]),
                        }),
                      });
                    }}
                  >
                    {s.action}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
