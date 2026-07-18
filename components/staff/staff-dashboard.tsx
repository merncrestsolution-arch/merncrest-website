"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function StaffDashboard() {
  const [data, setData] = useState<{
    employee?: { fullName: string; jobTitle: string; orgRole: string; department?: { name: string } | null } | null;
    tasks: { id: string; title: string; status: string; project: { name: string } }[];
    leave: { id: string; leaveType: string; status: string; startDate: string; endDate: string }[];
    notifications: { id: string; title: string; body: string }[];
    messages: { id: string; body: string; sender: { fullName: string }; createdAt: string }[];
  } | null>(null);
  const [chat, setChat] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else setData(d);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Employee self-service</h1>
        <p className="text-sm text-muted mt-1">
          {data.employee
            ? `${data.employee.fullName} · ${data.employee.jobTitle} · ${data.employee.orgRole}${data.employee.department ? ` · ${data.employee.department.name}` : ""}`
            : "Staff account (link an Employee record for full ESS)"}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-muted">Open tasks</p>
          <p className="font-display text-2xl font-bold">{data.tasks.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-muted">Leave requests</p>
          <p className="font-display text-2xl font-bold">{data.leave.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-muted">Notifications</p>
          <p className="font-display text-2xl font-bold">{data.notifications.length}</p>
        </div>
      </div>

      <section>
        <h2 className="font-display font-semibold mb-2">My tasks</h2>
        <ul className="space-y-2">
          {data.tasks.length === 0 && <li className="text-sm text-muted">No assigned tasks.</li>}
          {data.tasks.map((t) => (
            <li key={t.id} className="text-sm border border-white/10 rounded-lg p-3">
              {t.title} · {t.project.name} · {t.status}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display font-semibold mb-2">Leave</h2>
        <ul className="space-y-2 mb-3">
          {data.leave.map((l) => (
            <li key={l.id} className="text-sm text-muted">
              {l.leaveType} · {l.status} · {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
            </li>
          ))}
        </ul>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/hr">Request leave in HRM</Link></Button>
      </section>

      <section>
        <h2 className="font-display font-semibold mb-2">Internal chat</h2>
        <ul className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {data.messages.map((m) => (
            <li key={m.id} className="text-sm border border-white/5 rounded p-2">
              <span className="text-accent text-xs">{m.sender.fullName}</span>
              <p>{m.body}</p>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/staff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: chat }),
            });
            setChat("");
            await load();
          }}
        >
          <input value={chat} onChange={(e) => setChat(e.target.value)} placeholder="Message #general"
            className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <Button type="submit" size="sm">Send</Button>
        </form>
      </section>
    </div>
  );
}
