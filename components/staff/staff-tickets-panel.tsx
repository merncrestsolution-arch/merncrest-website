"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Send } from "lucide-react";

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
  escalatedAt?: string | null;
  user?: { fullName: string; email: string } | null;
  messages: Message[];
};

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "CLOSED" || s === "RESOLVED") return "stitch-chip stitch-badge-done";
  if (s === "OPEN") return "stitch-chip stitch-badge-pending";
  if (s.includes("PROGRESS")) return "stitch-chip stitch-badge-progress";
  return "stitch-chip";
}

export function StaffTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([fetch("/api/tickets"), fetch("/api/staff")]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      if (!tRes.ok) throw new Error(tData.error || "Failed");
      setTickets(tData.tickets ?? []);
      setUserId(sData.user?.id ?? null);
      setSelectedId((prev) => prev || tData.tickets?.[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.user?.fullName?.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status.toUpperCase() === "OPEN").length;
    const inProgress = tickets.filter((t) =>
      ["IN_PROGRESS", "ASSIGNED", "PENDING"].includes(t.status.toUpperCase())
    ).length;
    const resolved = tickets.filter((t) =>
      ["RESOLVED", "CLOSED"].includes(t.status.toUpperCase())
    ).length;
    const mine = userId
      ? tickets.filter((t) => t.assigneeId === userId && t.status.toUpperCase() !== "CLOSED").length
      : 0;
    return { open, inProgress, resolved, mine };
  }, [tickets, userId]);

  const active = tickets.find((t) => t.id === selectedId);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedId, body: reply }),
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

  async function ticketAction(action: "claim" | "close" | "escalate") {
    if (!active) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: active.id,
          action,
          body: action === "close" ? reply.trim() || undefined : undefined,
        }),
      });
      if (res.ok) {
        if (action === "close") setReply("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function markResolved() {
    if (!active) return;
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
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Helpdesk</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Helpdesk</h1>
          <p className="stitch-page-sub">Support ticket inbox — reply, assign, and resolve.</p>
        </div>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Open Tickets</div>
          <div className="stitch-stat-num">{stats.open}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">In Progress</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-primary)" }}>
            {stats.inProgress}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Resolved</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-success)" }}>
            {stats.resolved}
          </div>
        </div>
        <div className="stitch-stat-card border-[var(--stitch-primary)]">
          <div className="stitch-stat-label">My Assigned</div>
          <div className="stitch-stat-num">{stats.mine}</div>
        </div>
      </div>

      {loading ? (
        <p className="stitch-page-sub">Loading tickets…</p>
      ) : (
        <div className="stitch-master-detail">
          <div className="stitch-master-detail-main">
            <div className="stitch-toolbar mb-3">
              <div className="stitch-search-wrap flex-1">
                <Search className="h-4 w-4" />
                <input
                  className="stitch-input !border-0 !h-9 flex-1"
                  placeholder="Search tickets…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="stitch-ticket-list">
              {filtered.length === 0 ? (
                <p className="stitch-page-sub p-4">No tickets found.</p>
              ) : (
                filtered.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`stitch-ticket-item${selectedId === t.id ? " active" : ""}`}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <span className="stitch-ticket-num">{t.ticketNumber}</span>
                    <span className="stitch-ticket-subject">{t.subject}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={statusBadge(t.status)}>{t.status}</span>
                      <span className="text-xs text-[var(--sp-muted)]">{t.department}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="stitch-detail-panel">
            {!active ? (
              <p className="stitch-page-sub p-6">Select a ticket to view details.</p>
            ) : (
              <>
                <div className="stitch-detail-head">
                  <span className="stitch-ticket-num">{active.ticketNumber}</span>
                  <h3 className="text-base font-semibold mt-1 mb-2">{active.subject}</h3>
                  <p className="text-xs text-[var(--sp-muted)] mb-3">
                    {active.status} · {active.priority} · {active.channel} · {active.department}
                    {active.assigneeName ? ` · ${active.assigneeName}` : " · Unassigned"}
                    {active.user ? ` · ${active.user.fullName}` : ""}
                  </p>
                  {active.status !== "CLOSED" && (
                    <div className="flex flex-wrap gap-2">
                      {!active.assigneeId && (
                        <button
                          type="button"
                          className="stitch-btn-primary-sm"
                          disabled={busy}
                          onClick={() => ticketAction("claim")}
                        >
                          Take Ticket
                        </button>
                      )}
                      <button
                        type="button"
                        className="stitch-btn-sm"
                        disabled={busy}
                        onClick={() => ticketAction("close")}
                      >
                        Close
                      </button>
                      {active.status !== "RESOLVED" && (
                        <button
                          type="button"
                          className="stitch-btn-sm"
                          disabled={busy}
                          onClick={markResolved}
                        >
                          Mark Resolved
                        </button>
                      )}
                      {!active.escalatedAt && (
                        <button
                          type="button"
                          className="stitch-btn-sm"
                          disabled={busy}
                          onClick={() => ticketAction("escalate")}
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="stitch-thread">
                  {active.messages
                    .filter((m) => !m.internal)
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`stitch-thread-msg${
                          m.authorRole === "STAFF" || m.authorRole === "ADMIN" ? " staff" : ""
                        }`}
                      >
                        <p className="stitch-thread-meta">
                          {m.authorName} · {m.authorRole} ·{" "}
                          {new Date(m.createdAt).toLocaleString()}
                        </p>
                        <p className="whitespace-pre-wrap m-0 text-sm">{m.body}</p>
                      </div>
                    ))}
                </div>

                {active.status !== "CLOSED" && (
                  <form onSubmit={sendReply} className="stitch-reply-form">
                    <input
                      className="stitch-input flex-1"
                      placeholder="Write a reply…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="stitch-btn-primary-sm"
                      disabled={busy || !reply.trim()}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
