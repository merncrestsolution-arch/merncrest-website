"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  jobTitle: string;
  status: string;
  salaryCents: number;
  department?: { name: string } | null;
};

type Leave = {
  id: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  user: { fullName: string; email: string };
};

export function ErpHrPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leave, setLeave] = useState<Leave[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    jobTitle: "",
    departmentId: "",
    salaryCents: 10000000,
  });
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    leaveType: "ANNUAL",
    reason: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/hr");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setEmployees(data.employees ?? []);
    setLeave(data.leave ?? []);
    setDepartments(data.departments ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/erp/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentId: form.departmentId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({ fullName: "", email: "", jobTitle: "", departmentId: "", salaryCents: 10000000 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function requestLeave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/erp/hr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setLeaveStatus(leaveId: string, status: string) {
    await fetch("/api/erp/hr", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveId, status }),
    });
    await load();
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={addEmployee} className="rounded-xl border border-white/10 p-4 space-y-2">
          <h3 className="font-display font-semibold text-sm">Add employee</h3>
          <input required placeholder="Full name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input required type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input required placeholder="Job title" value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm">
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={busy}>Save</Button>
        </form>

        <form onSubmit={requestLeave} className="rounded-xl border border-white/10 p-4 space-y-2">
          <h3 className="font-display font-semibold text-sm">Request leave (self)</h3>
          <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm">
            {["ANNUAL", "SICK", "UNPAID", "OTHER"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input required type="date" value={leaveForm.startDate}
            onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input required type="date" value={leaveForm.endDate}
            onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input placeholder="Reason" value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <Button type="submit" size="sm" disabled={busy}>Submit leave</Button>
        </form>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-3">Employees</h3>
        <ul className="space-y-2">
          {employees.map((e) => (
            <li key={e.id} className="rounded-lg border border-white/10 p-3 text-sm flex justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-accent">{e.employeeCode}</p>
                <p className="font-medium">{e.fullName} · {e.jobTitle}</p>
                <p className="text-xs text-muted">{e.department?.name || "—"} · {e.status}</p>
              </div>
              <p className="text-sm">{formatMoney(e.salaryCents)}/mo</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-3">Leave requests</h3>
        <ul className="space-y-2">
          {leave.map((l) => (
            <li key={l.id} className="rounded-lg border border-white/10 p-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">{l.user.fullName} · {l.leaveType}</p>
                <p className="text-xs text-muted">
                  {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()} · {l.status}
                </p>
              </div>
              {l.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setLeaveStatus(l.id, "APPROVED")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setLeaveStatus(l.id, "REJECTED")}>Reject</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
