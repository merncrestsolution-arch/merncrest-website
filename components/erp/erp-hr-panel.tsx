"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@/lib/commerce-format";
import { ORG_ROLES } from "@/lib/erp/modules";
import { SYSTEM_LEAVE_TYPES, leaveTypeLabel } from "@/lib/erp/roles-hierarchy";

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  jobTitle: string;
  orgRole: string;
  status: string;
  salaryCents: number;
  designation?: string | null;
  managerId?: string | null;
  department?: { name: string } | null;
  manager?: { fullName: string; employeeCode: string } | null;
  directReports?: { id: string; fullName: string; orgRole: string; jobTitle: string }[];
  documents?: { id: string; title: string; docType: string }[];
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

type HierarchyNode = {
  id: string;
  fullName: string;
  orgRole: string;
  jobTitle: string;
  department: string | null;
  reports: { id: string; fullName: string; orgRole: string; jobTitle: string }[];
};

export function ErpHrPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leave, setLeave] = useState<Leave[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [holidays, setHolidays] = useState<{ id: string; name: string; date: string }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    designation: "",
    grade: "",
    departmentId: "",
    managerId: "",
    orgRole: "GENERAL_STAFF",
    employmentType: "FULL_TIME",
    salaryCents: 10000000,
    nic: "",
    bankName: "",
    bankAccount: "",
    emergencyName: "",
    emergencyPhone: "",
    qualifications: "",
  });
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    leaveType: "ANNUAL",
    reason: "",
  });
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "" });
  const [docForm, setDocForm] = useState({ employeeId: "", title: "", docType: "OFFER" });

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
    setHierarchy(data.hierarchy ?? []);
    setHolidays(data.holidays ?? []);
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
          managerId: form.managerId || undefined,
          salaryCents: Number(form.salaryCents),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({
        fullName: "",
        email: "",
        phone: "",
        jobTitle: "",
        designation: "",
        grade: "",
        departmentId: "",
        managerId: "",
        orgRole: "GENERAL_STAFF",
        employmentType: "FULL_TIME",
        salaryCents: 10000000,
        nic: "",
        bankName: "",
        bankAccount: "",
        emergencyName: "",
        emergencyPhone: "",
        qualifications: "",
      });
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

  async function addHoliday(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/erp/hr/attendance-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "HOLIDAY", ...holidayForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setHolidayForm({ name: "", date: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function addDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docForm.employeeId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/erp/hr/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDocForm({ employeeId: "", title: "", docType: "OFFER" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="rlk-welcome">Staff management</h1>
      <p className="rlk-empty !mb-5">
        Employee master, org hierarchy, leave approvals, holidays — scoped by your role.
      </p>
      {error ? <p className="rlk-login-error !mb-4">{error}</p> : null}

      <div className="rlk-stats !mb-5">
        <div className="rlk-stat">
          <div className="rlk-stat-num">{employees.length}</div>
          <div className="rlk-stat-label">Employees</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num">{leave.filter((l) => l.status === "PENDING").length}</div>
          <div className="rlk-stat-label">Pending leave</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num">{departments.length}</div>
          <div className="rlk-stat-label">Departments</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num">{holidays.length}</div>
          <div className="rlk-stat-label">Holidays</div>
        </div>
      </div>

      <section className="rlk-section rlk-section-accent-teal">
        <div className="rlk-section-head">
          <h2>Organizational hierarchy</h2>
        </div>
        <div className="rlk-section-body">
          {hierarchy.length === 0 ? (
            <p className="rlk-empty">No root managers yet — set managerId when adding staff.</p>
          ) : (
            hierarchy.map((node) => (
              <div key={node.id} className="mb-4">
                <div className="rlk-row">
                  <span>
                    <strong>{node.fullName}</strong> · {node.orgRole} · {node.jobTitle}
                    {node.department ? ` · ${node.department}` : ""}
                  </span>
                </div>
                {node.reports.map((r) => (
                  <div key={r.id} className="rlk-row pl-4">
                    <span>
                      → {r.fullName} · {r.orgRole} · {r.jobTitle}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rlk-section rlk-section-accent-orange !mb-0">
          <div className="rlk-section-head">
            <h2>Add employee</h2>
          </div>
          <div className="rlk-section-body">
            <form onSubmit={addEmployee} className="space-y-2">
              <input
                required
                placeholder="Full name"
                className="rlk-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <input
                required
                type="email"
                placeholder="Email"
                className="rlk-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                placeholder="Phone"
                className="rlk-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="Job title"
                  className="rlk-input"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                />
                <input
                  placeholder="Designation"
                  className="rlk-input"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="rlk-input"
                  value={form.orgRole}
                  onChange={(e) => setForm({ ...form, orgRole: e.target.value })}
                >
                  {ORG_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  className="rlk-input"
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                >
                  {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className="rlk-input"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                className="rlk-input"
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              >
                <option value="">Reporting manager</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.orgRole})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="NIC / ID"
                  className="rlk-input"
                  value={form.nic}
                  onChange={(e) => setForm({ ...form, nic: e.target.value })}
                />
                <input
                  placeholder="Grade"
                  className="rlk-input"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Bank name"
                  className="rlk-input"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                />
                <input
                  placeholder="Bank account"
                  className="rlk-input"
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Emergency contact"
                  className="rlk-input"
                  value={form.emergencyName}
                  onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                />
                <input
                  placeholder="Emergency phone"
                  className="rlk-input"
                  value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                />
              </div>
              <textarea
                className="rlk-input"
                placeholder="Qualifications / certifications"
                value={form.qualifications}
                onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
              />
              <input
                type="number"
                className="rlk-input"
                placeholder="Salary (cents)"
                value={form.salaryCents}
                onChange={(e) => setForm({ ...form, salaryCents: Number(e.target.value) })}
              />
              <button type="submit" className="rlk-btn-green" disabled={busy}>
                Save employee
              </button>
            </form>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rlk-section rlk-section-accent-green !mb-0">
            <div className="rlk-section-head">
              <h2>Bulk CSV import</h2>
            </div>
            <div className="rlk-section-body">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const csv = String(fd.get("csv") || "");
                  setBusy(true);
                  try {
                    const res = await fetch("/api/erp/hr", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ csv }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Import failed");
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Import failed");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="space-y-2"
              >
                <p className="rlk-empty">
                  Header: fullName,email,jobTitle,departmentCode,orgRole
                </p>
                <textarea
                  name="csv"
                  required
                  rows={4}
                  placeholder={
                    "fullName,email,jobTitle,departmentCode,orgRole\nJane Doe,jane@co.lk,Engineer,TECH,GENERAL_STAFF"
                  }
                  className="rlk-input font-mono text-[12px]"
                />
                <button type="submit" className="rlk-btn-ghost" disabled={busy}>
                  Import CSV
                </button>
              </form>
            </div>
          </section>

          <section className="rlk-section rlk-section-accent-teal !mb-0">
            <div className="rlk-section-head">
              <h2>Employment document</h2>
            </div>
            <div className="rlk-section-body">
              <form onSubmit={addDocument} className="space-y-2">
                <select
                  className="rlk-input"
                  required
                  value={docForm.employeeId}
                  onChange={(e) => setDocForm({ ...docForm, employeeId: e.target.value })}
                >
                  <option value="">Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName}
                    </option>
                  ))}
                </select>
                <select
                  className="rlk-input"
                  value={docForm.docType}
                  onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                >
                  {["OFFER", "AGREEMENT", "ID_CARD", "CERTIFICATE", "OTHER"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  required
                  className="rlk-input"
                  placeholder="Document title"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                />
                <button type="submit" className="rlk-btn-green !w-auto" disabled={busy}>
                  Add document record
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>

      <section className="rlk-section rlk-section-accent-orange mt-4">
        <div className="rlk-section-head">
          <h2>Employee directory</h2>
        </div>
        <div className="rlk-section-body">
          {employees.length === 0 ? (
            <p className="rlk-empty">No employees in your scope.</p>
          ) : (
            employees.map((e) => (
              <div key={e.id} className="rlk-row !items-start">
                <div>
                  <p className="rlk-mono">{e.employeeCode}</p>
                  <p className="font-medium">
                    {e.fullName} · {e.jobTitle}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--rlk-text-muted)" }}>
                    {e.orgRole} · {e.department?.name || "—"} · {e.status}
                    {e.manager ? ` · Mgr ${e.manager.fullName}` : ""}
                  </p>
                  {(e.documents?.length ?? 0) > 0 ? (
                    <p className="text-[11px] mt-1" style={{ color: "var(--rlk-teal)" }}>
                      Docs: {e.documents!.map((d) => d.title).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span>{formatMoney(e.salaryCents)}/mo</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-green">
        <div className="rlk-section-head">
          <h2>Leave approvals</h2>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={requestLeave} className="grid sm:grid-cols-2 gap-2 mb-4 max-w-2xl">
            <select
              className="rlk-input"
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
            >
              {SYSTEM_LEAVE_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              required
              type="date"
              className="rlk-input"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
            />
            <input
              required
              type="date"
              className="rlk-input"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
            />
            <input
              className="rlk-input"
              placeholder="Reason"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            />
            <button type="submit" className="rlk-btn-green !w-auto sm:col-span-2" disabled={busy}>
              Request leave (self)
            </button>
          </form>
          {leave.map((l) => (
            <div key={l.id} className="rlk-row">
              <span>
                {l.user.fullName} · {leaveTypeLabel(l.leaveType)} ·{" "}
                {new Date(l.startDate).toLocaleDateString()} →{" "}
                {new Date(l.endDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <span className="rlk-badge rlk-badge-pending">{l.status}</span>
                {l.status === "PENDING" ? (
                  <>
                    <button
                      type="button"
                      className="rlk-btn-green !w-auto !mt-0 !px-2 !py-1"
                      onClick={() => setLeaveStatus(l.id, "APPROVED")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rlk-btn-ghost !w-auto !mt-0 !px-2 !py-1"
                      onClick={() => setLeaveStatus(l.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-gray">
        <div className="rlk-section-head">
          <h2>Holiday calendar</h2>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={addHoliday} className="flex flex-wrap gap-2 mb-3 max-w-xl">
            <input
              required
              className="rlk-input flex-1 min-w-[140px]"
              placeholder="Holiday name"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
            />
            <input
              required
              type="date"
              className="rlk-input !w-auto"
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
            />
            <button type="submit" className="rlk-btn-green !w-auto !mt-0" disabled={busy}>
              Add holiday
            </button>
          </form>
          {holidays.map((h) => (
            <div key={h.id} className="rlk-row">
              <span>{h.name}</span>
              <span>{new Date(h.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
