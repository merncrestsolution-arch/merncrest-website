"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  body: string;
  category: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export function NotificationsPanel() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setItems(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    await load();
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{unread} unread</p>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAll}>
            Mark all read
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted text-sm">No notifications yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.readAt ? "border-white/10 opacity-70" : "border-accent/30 bg-accent/5"
              }`}
            >
              <div className="flex justify-between gap-3">
                <p className="font-medium text-sm">{n.title}</p>
                <span className="text-xs font-mono text-muted">{n.category}</span>
              </div>
              <p className="text-sm text-muted mt-1">{n.body}</p>
              <div className="flex justify-between mt-2 text-xs text-muted">
                <span>{new Date(n.createdAt).toLocaleString()}</span>
                {n.href && (
                  <Link href={n.href} className="text-accent hover:underline">
                    Open
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
