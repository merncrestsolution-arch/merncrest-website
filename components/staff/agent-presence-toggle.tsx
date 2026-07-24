"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "ONLINE" | "AWAY" | "OFFLINE";

const labels: Record<Status, string> = {
  ONLINE: "Online",
  AWAY: "Away",
  OFFLINE: "Offline",
};

const dotClass: Record<Status, string> = {
  ONLINE: "stitch-presence-online",
  AWAY: "stitch-presence-away",
  OFFLINE: "stitch-presence-offline",
};

export function AgentPresenceToggle() {
  const [status, setStatus] = useState<Status>("OFFLINE");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/presence");
      if (!res.ok) return;
      const data = await res.json();
      if (data.me?.status) setStatus(data.me.status);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  async function cycle() {
    const order: Status[] = ["ONLINE", "AWAY", "OFFLINE"];
    const next = order[(order.indexOf(status) + 1) % order.length];
    setBusy(true);
    try {
      const res = await fetch("/api/staff/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (res.ok && data.me?.status) setStatus(data.me.status);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={busy}
      className="stitch-presence-btn"
      title="Toggle chat availability"
    >
      <span className={`stitch-presence-dot ${dotClass[status]}`} />
      {labels[status]}
    </button>
  );
}
