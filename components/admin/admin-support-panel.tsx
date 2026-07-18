"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TicketsPanel } from "@/components/support/tickets-panel";

type Stats = {
  openTickets: number;
  pendingCallbacks: number;
  chatHandoffs: number;
  recentWhatsApp: number;
};

type Callback = {
  id: string;
  fullName: string;
  phone: string;
  reason: string;
  status: string;
  preferredAt?: string | null;
  createdAt: string;
};

type WaMsg = {
  id: string;
  direction: string;
  phone: string;
  body: string;
  status: string;
  createdAt: string;
};

export function AdminSupportPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [wa, setWa] = useState<WaMsg[]>([]);
  const [tab, setTab] = useState<"tickets" | "callbacks" | "whatsapp">("tickets");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [sRes, wRes] = await Promise.all([
        fetch("/api/admin/support"),
        fetch("/api/whatsapp"),
      ]);
      const sData = await sRes.json();
      const wData = await wRes.json();
      if (!sRes.ok) throw new Error(sData.error || "Failed");
      setStats(sData.stats);
      setCallbacks(sData.callbacks ?? []);
      if (wRes.ok) setWa(wData.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setCallbackStatus(id: string, status: string) {
    await fetch("/api/callbacks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Open tickets", value: stats.openTickets },
            { label: "Pending callbacks", value: stats.pendingCallbacks },
            { label: "Chat handoffs", value: stats.chatHandoffs },
            { label: "WA msgs (24h)", value: stats.recentWhatsApp },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 p-4">
              <p className="text-xs font-mono uppercase text-muted">{s.label}</p>
              <p className="font-display text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {(["tickets", "callbacks", "whatsapp"] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {tab === "tickets" && <TicketsPanel staffMode />}

      {tab === "callbacks" && (
        <ul className="space-y-3">
          {callbacks.length === 0 && <li className="text-sm text-muted">No callbacks.</li>}
          {callbacks.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{c.fullName} · {c.phone}</p>
                <p className="text-xs text-muted mt-1">
                  {c.reason} · {c.status}
                  {c.preferredAt ? ` · ${c.preferredAt}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCallbackStatus(c.id, "SCHEDULED")}>
                  Schedule
                </Button>
                <Button size="sm" onClick={() => setCallbackStatus(c.id, "COMPLETED")}>
                  Done
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "whatsapp" && (
        <ul className="space-y-2 max-h-[480px] overflow-y-auto">
          {wa.length === 0 && (
            <li className="text-sm text-muted">
              No WhatsApp messages yet. POST to /api/whatsapp with {"{ phone, message }"} to simulate inbound.
            </li>
          )}
          {wa.map((m) => (
            <li key={m.id} className="rounded-lg border border-white/10 p-3 text-sm">
              <p className="text-xs font-mono text-muted">
                {m.direction} · {m.phone} · {m.status} · {new Date(m.createdAt).toLocaleString()}
              </p>
              <p className="mt-1">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
