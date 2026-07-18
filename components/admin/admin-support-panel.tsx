"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TicketsPanel } from "@/components/support/tickets-panel";

type Stats = {
  openTickets: number;
  pendingCallbacks: number;
  chatHandoffs: number;
  recentWhatsApp: number;
  missedCalls?: number;
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

type Call = {
  id: string;
  callNumber: string;
  phone: string;
  language: string;
  department: string;
  status: string;
  createdAt: string;
};

export function AdminSupportPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [wa, setWa] = useState<WaMsg[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [tab, setTab] = useState<"tickets" | "callbacks" | "whatsapp" | "ivr">("tickets");
  const [error, setError] = useState("");
  const [simPhone, setSimPhone] = useState("94770000001");
  const [simMsg, setSimMsg] = useState("menu");
  const [simReply, setSimReply] = useState("");

  const load = useCallback(async () => {
    try {
      const [sRes, wRes, iRes] = await Promise.all([
        fetch("/api/admin/support"),
        fetch("/api/whatsapp"),
        fetch("/api/ivr"),
      ]);
      const sData = await sRes.json();
      const wData = await wRes.json();
      const iData = await iRes.json();
      if (!sRes.ok) throw new Error(sData.error || "Failed");
      setStats(sData.stats);
      setCallbacks(sData.callbacks ?? []);
      if (wRes.ok) setWa(wData.messages ?? []);
      if (iRes.ok) setCalls(iData.calls ?? []);
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

  async function simWhatsApp() {
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: simPhone, message: simMsg }),
    });
    const data = await res.json();
    setSimReply(data.reply || data.error || "");
    await load();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Open tickets", value: stats.openTickets },
            { label: "Pending callbacks", value: stats.pendingCallbacks },
            { label: "Chat handoffs", value: stats.chatHandoffs },
            { label: "WA msgs (24h)", value: stats.recentWhatsApp },
            { label: "Missed / VM calls", value: stats.missedCalls ?? calls.filter((c) => c.status !== "ANSWERED").length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 p-4">
              <p className="text-xs font-mono uppercase text-muted">{s.label}</p>
              <p className="font-display text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["tickets", "callbacks", "whatsapp", "ivr"] as const).map((t) => (
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
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 p-4 space-y-2 max-w-lg">
            <p className="text-sm font-medium">Simulate inbound WhatsApp</p>
            <input value={simPhone} onChange={(e) => setSimPhone(e.target.value)}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" placeholder="Phone" />
            <input value={simMsg} onChange={(e) => setSimMsg(e.target.value)}
              className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" placeholder="Message (try: menu, search domain demo.lk)" />
            <Button size="sm" onClick={simWhatsApp}>Send</Button>
            {simReply && <pre className="text-xs text-muted whitespace-pre-wrap mt-2">{simReply}</pre>}
          </div>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {wa.length === 0 && <li className="text-sm text-muted">No WhatsApp messages yet.</li>}
            {wa.map((m) => (
              <li key={m.id} className="rounded-lg border border-white/10 p-3 text-sm">
                <p className="text-xs font-mono text-muted">
                  {m.direction} · {m.phone} · {m.status} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "ivr" && (
        <ul className="space-y-2">
          {calls.length === 0 && <li className="text-sm text-muted">No call records. Use Support Center IVR simulator.</li>}
          {calls.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 p-4 text-sm">
              <p className="font-mono text-accent">{c.callNumber}</p>
              <p className="mt-1">{c.phone} · {c.language} · {c.department} · {c.status}</p>
              <p className="text-xs text-muted mt-1">{new Date(c.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
