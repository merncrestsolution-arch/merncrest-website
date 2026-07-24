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
  assigneeId?: string | null;
  assigneeName?: string | null;
  csatRating?: number | null;
  responseDueAt?: string | null;
  resolveDueAt?: string | null;
  escalatedAt?: string | null;
  user?: { fullName: string; email: string } | null;
  messages: Message[];
};

function slaBadge(dueAt: string | null | undefined, label: string) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = Date.now();
  const breached = due.getTime() < now;
  const soon = !breached && due.getTime() - now < 2 * 3600_000;
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        breached
          ? "bg-red-500/15 text-red-400"
          : soon
            ? "bg-amber-500/15 text-amber-400"
            : "bg-emerald-500/15 text-emerald-400"
      }`}
    >
      {label}: {breached ? "breached" : due.toLocaleString()}
    </span>
  );
}

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
          <form onSubmit={createTicket} className="rounded-xl border border-[#c4bdd4] bg-white p-4 space-y-3 shadow-sm dark:border-[#4a4455] dark:bg-[#131317] dark:shadow-none">
            <h2 className="font-display font-semibold text-sm text-[#121218] dark:text-white">New ticket</h2>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              required
              className="auth-input"
            />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="auth-input auth-select"
            >
              {["GENERAL", "BILLING", "TECHNICAL", "DOMAIN", "HOSTING", "SALES"].map((d) => (
                <option key={d} value={d} className="bg-[#1b1b1f] text-[#e4e1e7]">
                  {d}
                </option>
              ))}
            </select>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your issue…"
              required
              rows={3}
              className="auth-input min-h-[5rem] h-auto py-2"
            />
            <Button type="submit" size="sm" disabled={busy}>
              Open ticket
            </Button>
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
                  selected === t.id
                    ? "border-accent/50 bg-accent/10"
                    : "border-[#c4bdd4] bg-white hover:bg-[#f4f1fa] dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5"
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

      <div className="rounded-xl border border-[#c4bdd4] bg-white min-h-[360px] flex flex-col shadow-sm dark:border-white/10 dark:bg-transparent dark:shadow-none">
        {error && <p className="text-sm text-red-600 dark:text-red-400 p-4">{error}</p>}
        {!active ? (
          <p className="text-sm text-muted p-6">Select a ticket</p>
        ) : (
          <>
            <div className="border-b border-[#e4dff0] dark:border-white/10 p-4">
              <p className="font-mono text-xs text-accent">{active.ticketNumber}</p>
              <h2 className="font-display font-semibold mt-1">{active.subject}</h2>
              <p className="text-xs text-muted mt-1">
                {active.status} · {active.priority} · {active.channel} · {active.department}
                {active.assigneeName ? ` · Lead: ${active.assigneeName}` : " · Unassigned"}
                {active.user ? ` · ${active.user.fullName}` : ""}
                {active.escalatedAt ? " · Escalated" : ""}
              </p>
              {(active.responseDueAt || active.resolveDueAt) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {slaBadge(active.responseDueAt, "Response SLA")}
                  {slaBadge(active.resolveDueAt, "Resolve SLA")}
                </div>
              )}
              {staffMode && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {!active.assigneeId && active.status !== "CLOSED" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const res = await fetch("/api/tickets", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ticketId: active.id, action: "claim" }),
                          });
                          if (res.ok) await load();
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Take ticket
                    </Button>
                  )}
                  {active.status !== "CLOSED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const note = reply.trim() || undefined;
                          const res = await fetch("/api/tickets", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              ticketId: active.id,
                              action: "close",
                              body: note,
                            }),
                          });
                          if (res.ok) {
                            setReply("");
                            await load();
                          }
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Close ticket
                    </Button>
                  )}
                  {active.status !== "CLOSED" && active.status !== "RESOLVED" && (
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
                  )}
                  {active.status !== "CLOSED" && !active.escalatedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const res = await fetch("/api/tickets", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ticketId: active.id, action: "escalate" }),
                          });
                          if (res.ok) await load();
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Escalate
                    </Button>
                  )}
                </div>
              )}
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
                        : "bg-[#f4f1fa] border border-[#c4bdd4] dark:bg-white/5 dark:border-white/10"
                    }`}
                  >
                    <p className="text-xs text-muted mb-1">
                      {m.authorName} · {m.authorRole} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
            </div>
            <form onSubmit={sendReply} className="border-t border-[#e4dff0] dark:border-white/10 p-4 flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply…"
                className="auth-input flex-1"
              />
              <Button type="submit" disabled={busy || !reply.trim()}>Send</Button>
            </form>
            {!staffMode && ["RESOLVED", "CLOSED"].includes(active.status) && (
              <div className="border-t border-[#e4dff0] dark:border-white/10 p-4 space-y-2">
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
              <div className="border-t border-[#e4dff0] dark:border-white/10 p-3 text-xs text-muted">
                Reply like email — customer is notified. Close when the issue is finished.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
