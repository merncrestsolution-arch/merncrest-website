"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ErpAiPanel() {
  const [insights, setInsights] = useState<{ id: string; title: string; category: string; summary: string; createdAt: string }[]>([]);
  const [prompt, setPrompt] = useState("Summarize company performance this month");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/ai");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setInsights(data.insights ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/erp/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category: "ASSISTANT" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReply(data.reply);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form onSubmit={ask} className="space-y-2">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
        <Button type="submit" disabled={busy}>{busy ? "Thinking…" : "Ask AI assistant"}</Button>
      </form>
      {reply && <pre className="text-sm whitespace-pre-wrap rounded-xl border border-white/10 p-4 bg-white/[0.02]">{reply}</pre>}
      <ul className="space-y-2">
        {insights.map((i) => (
          <li key={i.id} className="border border-white/10 rounded-lg p-3 text-sm">
            <p className="font-medium">{i.title}</p>
            <p className="text-xs text-muted mt-1">{i.category} · {new Date(i.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
