"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash, MessageSquare, Search, Send, Users } from "lucide-react";
import { Link } from "@/i18n/routing";

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; fullName: string };
};
type Staff = { id: string; fullName: string; email: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StaffChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [peerId, setPeerId] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    const q = peerId ? `?peerId=${peerId}` : "";
    fetch(`/api/staff/chat${q}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setMessages(d.messages ?? []);
        setStaff(d.staff ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [peerId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const filteredStaff = useMemo(() => {
    if (!filter) return staff;
    const q = filter.toLowerCase();
    return staff.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [staff, filter]);

  const peer = staff.find((s) => s.id === peerId);
  const channelLabel = peer ? `DM · ${peer.fullName}` : "# general";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch("/api/staff/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, recipientId: peerId || undefined, channel: "general" }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setBody("");
    setError("");
    load();
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Internal Chat</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Internal Team Chat</h1>
          <p className="stitch-page-sub">Direct messages and the #general channel for staff.</p>
        </div>
        <Link href="/staff/live-chat" className="stitch-btn-sm">
          Visitor live chat
        </Link>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-stat-grid mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stitch-stat-card">
          <Users className="h-5 w-5 mb-2 text-[var(--sp-primary)]" />
          <div className="stitch-stat-num">{staff.length}</div>
          <div className="stitch-stat-label">Team members</div>
        </div>
        <div className="stitch-stat-card">
          <MessageSquare className="h-5 w-5 mb-2 text-[var(--sp-primary)]" />
          <div className="stitch-stat-num">{messages.length}</div>
          <div className="stitch-stat-label">Messages loaded</div>
        </div>
        <div className="stitch-stat-card">
          <Hash className="h-5 w-5 mb-2 text-[var(--sp-primary)]" />
          <div className="stitch-stat-num text-base truncate">{channelLabel}</div>
          <div className="stitch-stat-label">Active channel</div>
        </div>
      </div>

      <div className="stitch-chat-shell" style={{ height: "calc(100vh - 18rem)" }}>
        <div className="stitch-chat-header">
          <div>
            <h1>{channelLabel}</h1>
            <p>{peer ? peer.email : "Company-wide announcements and coordination"}</p>
          </div>
          <select
            className="stitch-select-sm"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
          >
            <option value=""># general</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                DM · {s.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid flex-1 min-h-0 lg:grid-cols-[260px_1fr]">
          <aside className="stitch-chat-inbox hidden lg:flex">
            <div className="p-3 border-b border-[var(--sp-outline)]">
              <div className="stitch-search-wrap">
                <Search className="h-4 w-4" />
                <input
                  className="stitch-input !border-0 !h-9 flex-1"
                  placeholder="Search team…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <button
                type="button"
                className={`stitch-chat-inbox-item w-full${!peerId ? " active" : ""}`}
                onClick={() => setPeerId("")}
              >
                <span className="stitch-chat-avatar stitch-chat-avatar-user">#</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm">general</div>
                  <div className="text-xs text-[var(--sp-muted)] truncate">Team channel</div>
                </div>
              </button>
              {filteredStaff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`stitch-chat-inbox-item w-full${peerId === s.id ? " active" : ""}`}
                  onClick={() => setPeerId(s.id)}
                >
                  <span className="stitch-chat-avatar stitch-chat-avatar-user">
                    {initials(s.fullName)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{s.fullName}</div>
                    <div className="text-xs text-[var(--sp-muted)] truncate">{s.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <div className="stitch-chat-thread">
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="stitch-page-sub text-center py-12">No messages yet. Say hello!</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-[var(--sp-primary)]">
                        {m.sender.fullName}
                      </span>
                      <span className="text-[11px] text-[var(--sp-muted)]">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="stitch-chat-bubble stitch-chat-bubble-agent inline-block">
                      {m.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={send} className="flex gap-2 p-4 border-t border-[var(--sp-outline)]">
              <input
                className="stitch-input flex-1"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Message ${channelLabel}…`}
                required
              />
              <button type="submit" className="stitch-btn-primary-sm" disabled={sending}>
                <Send className="h-4 w-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
