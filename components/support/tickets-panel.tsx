"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  internal?: boolean;
};

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  department: string;
  priority: string;
  status: string;
  channel: string;
  createdAt: string;
  csatRating?: number | null;
  messages: Message[];
};

export function TicketsPanel({ staffMode = false }: { staffMode?: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [department, setDepartment] = useState("GENERAL");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setTickets(data.tickets ?? []);
      setSelected((prev) => prev || data.tickets?.[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, department }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSubject("");
      setBody("");
      setSelected(data.ticket.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selected, body: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReply("");
      setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const active = tickets.find((t) => t.id === selected);

  if (loading) return <p className="text-sm text-muted">Loading tickets…</p>;

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-3">
        {!staffMode && (
          <form onSubmit={createTicket} className="rounded-xl border border-white/10 p-4 space-y-3">
            <h2 className="font-display font-semibold text-sm">New ticket</h2>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              required
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
            />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
            >
              {["GENERAL", "BILLING", "TECHNICAL", "DOMAIN", "HOSTING", "SALES"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your issue…"
              required
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm" disabled={busy}>Open ticket</Button>
          </form>
        )}
        <ul className="space-y-2 max-h-[480px] overflow-y-auto">
          {tickets.length === 0 && <li className="text-sm text-muted">No tickets yet.</li>}
          {tickets.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelected(t.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selected === t.id ? "border-accent/50 bg-accent/10" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <p className="font-mono text-xs text-accent">{t.ticketNumber}</p>
                <p className="font-medium truncate mt-0.5">{t.subject}</p>
                <p className="text-xs text-muted mt-1">{t.status} · {t.department}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 min-h-[360px] flex flex-col">
        {error && <p className="text-sm text-red-400 p-4">{error}</p>}
        {!active ? (
          <p className="text-sm text-muted p-6">Select a ticket</p>
        ) : (
          <>
            <div className="border-b border-white/10 p-4">
              <p className="font-mono text-xs text-accent">{active.ticketNumber}</p>
              <h2 className="font-display font-semibold mt-1">{active.subject}</h2>
              <p className="text-xs text-muted mt-1">
                {active.status} · {active.priority} · {active.channel} · {active.department}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
              {active.messages
                .filter((m) => !m.internal || staffMode)
                .map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 text-sm ${
                      m.authorRole === "STAFF" || m.authorRole === "AI"
                        ? "bg-accent/10 border border-accent/20"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <p className="text-xs text-muted mb-1">
                      {m.authorName} · {m.authorRole} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
            </div>
            <form onSubmit={sendReply} className="border-t border-white/10 p-4 flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply…"
                className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
              />
              <Button type="submit" disabled={busy || !reply.trim()}>Send</Button>
            </form>
            {!staffMode && ["RESOLVED", "CLOSED"].includes(active.status) && (
              <div className="border-t border-white/10 p-4 space-y-2">
                <p className="text-sm text-muted">Rate this support experience</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={active.csatRating === n ? "default" : "outline"}
                      disabled={busy || Boolean(active.csatRating)}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const res = await fetch("/api/tickets", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ticketId: active.id, csatRating: n }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setTickets((prev) =>
                              prev.map((t) => (t.id === data.ticket.id ? { ...t, ...data.ticket } : t))
                            );
                          }
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      ★{n}
                    </Button>
                  ))}
                </div>
                {active.csatRating && (
                  <p className="text-xs text-success">Thanks — you rated ★{active.csatRating}</p>
                )}
              </div>
            )}
            {staffMode && active.status !== "CLOSED" && (
              <div className="border-t border-white/10 p-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await fetch("/api/tickets", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ticketId: active.id, status: "RESOLVED" }),
                      });
                      await load();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Mark resolved
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
