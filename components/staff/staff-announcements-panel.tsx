"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function StaffAnnouncementsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/staff/notifications")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unread ?? 0);
        setSelectedId((prev) => prev ?? d.notifications?.[0]?.id ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return notifications;
    const q = search.toLowerCase();
    return notifications.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notifications, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const read = notifications.filter((n) => n.readAt).length;
    const thisMonth = notifications.filter((n) => new Date(n.createdAt) >= monthStart).length;
    return {
      total: notifications.length,
      unread: unreadCount,
      read,
      thisMonth,
    };
  }, [notifications, unreadCount]);

  const selected = notifications.find((n) => n.id === selectedId);

  async function markAllRead() {
    await fetch("/api/staff/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  }

  async function selectNotification(id: string) {
    setSelectedId(id);
    const n = notifications.find((x) => x.id === id);
    if (n && !n.readAt) {
      await fetch("/api/staff/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      load();
    }
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Announcements</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Announcements</h1>
          <p className="stitch-page-sub">Company updates and internal notifications.</p>
        </div>
        <button type="button" className="stitch-btn-sm" onClick={markAllRead}>
          Mark all read
        </button>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Total</div>
          <div className="stitch-stat-num">{stats.total}</div>
        </div>
        <div className="stitch-stat-card border-[var(--stitch-warning)]">
          <div className="stitch-stat-label">Unread</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-warning)" }}>
            {stats.unread}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Read</div>
          <div className="stitch-stat-num">{stats.read}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">This Month</div>
          <div className="stitch-stat-num">{stats.thisMonth}</div>
        </div>
      </div>

      <div className="stitch-master-detail">
        <div className="stitch-master-detail-main">
          <div className="stitch-toolbar mb-3">
            <div className="stitch-search-wrap flex-1">
              <Search className="h-4 w-4" />
              <input
                className="stitch-input !border-0 !h-9 flex-1"
                placeholder="Search announcements…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="stitch-ticket-list">
            {filtered.length === 0 ? (
              <p className="stitch-page-sub p-4">No announcements yet.</p>
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`stitch-ticket-item${selectedId === n.id ? " active" : ""}`}
                  onClick={() => selectNotification(n.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="stitch-ticket-subject !mb-0">{n.title}</span>
                    {!n.readAt ? (
                      <span className="stitch-chip stitch-badge-pending shrink-0">NEW</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--sp-muted)] mt-1 mb-0 line-clamp-2">{n.body}</p>
                  <span className="text-[11px] text-[var(--sp-muted)] mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="stitch-detail-panel">
          {!selected ? (
            <p className="stitch-page-sub p-6">Select an announcement to read.</p>
          ) : (
            <>
              <div className="stitch-detail-head">
                <h3 className="text-lg font-semibold m-0">{selected.title}</h3>
                <p className="text-xs text-[var(--sp-muted)] mt-2 mb-0">
                  {new Date(selected.createdAt).toLocaleString()}
                  {!selected.readAt ? (
                    <span className="stitch-chip stitch-badge-pending ml-2">NEW</span>
                  ) : null}
                </p>
              </div>
              <div className="stitch-section-body">
                <p className="text-sm whitespace-pre-wrap leading-relaxed m-0">{selected.body}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
