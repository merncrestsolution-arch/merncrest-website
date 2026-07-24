"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { leaveTypeLabel } from "@/lib/erp/roles-hierarchy";
import { Eye, Plus, X } from "lucide-react";

type Balance = {
  id: string;
  leaveType: string;
  entitled: number;
  used: number;
  pending: number;
};
type LeaveRow = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string | null;
};
type LeaveTypeOpt = { code: string; label: string };

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "stitch-chip stitch-badge-done";
  if (s === "REJECTED") return "stitch-chip stitch-badge-danger";
  return "stitch-chip stitch-badge-pending";
}

export function StaffLeavePanel() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [types, setTypes] = useState<LeaveTypeOpt[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewRow, setViewRow] = useState<LeaveRow | null>(null);
  const [form, setForm] = useState({
    leaveType: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/staff/leave")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setBalances(d.balances ?? []);
        setRequests(d.requests ?? []);
        const lt = d.leaveTypes ?? [];
        setTypes(
          Array.isArray(lt) && lt[0]?.code
            ? lt
            : (lt as string[]).map((code) => ({ code, label: leaveTypeLabel(code) }))
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = balances.reduce((s, b) => s + b.entitled, 0);
    const used = balances.reduce((s, b) => s + b.used, 0);
    const pending = balances.reduce((s, b) => s + b.pending, 0);
    const available = balances.reduce((s, b) => s + (b.entitled - b.used - b.pending), 0);
    return { total, used, pending, available };
  }, [balances]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/staff/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Leave request submitted for approval");
      setForm({ leaveType: "ANNUAL", startDate: "", endDate: "", reason: "" });
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const typeOptions =
    types.length > 0
      ? types
      : [
          { code: "ANNUAL", label: "Annual Leave" },
          { code: "CASUAL", label: "Casual Leave" },
          { code: "SICK", label: "Sick Leave" },
        ];

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Leave Management</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Leave Management</h1>
          <p className="stitch-page-sub">Apply for leave and track your leave history.</p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowModal(true)}>
          <Plus className="h-3.5 w-3.5" />
          Apply Leave
        </button>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}
      {msg ? (
        <p className="mb-4 text-sm" style={{ color: "var(--stitch-success)" }}>
          {msg}
        </p>
      ) : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Total Leaves</div>
          <div className="stitch-stat-num">{stats.total}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Used Leaves</div>
          <div className="stitch-stat-num">{stats.used}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Pending Approval</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-warning)" }}>
            {stats.pending}
          </div>
        </div>
        <div className="stitch-stat-card border-[var(--stitch-success)]">
          <div className="stitch-stat-label">Available Leaves</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-success)" }}>
            {stats.available}
          </div>
        </div>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Leave History</h3>
        </div>
        <div className="stitch-section-body !p-0">
          {requests.length === 0 ? (
            <p className="stitch-page-sub p-4">No leave requests yet.</p>
          ) : (
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{leaveTypeLabel(r.leaveType)}</td>
                    <td>{new Date(r.startDate).toLocaleDateString()}</td>
                    <td>{new Date(r.endDate).toLocaleDateString()}</td>
                    <td>{r.days}</td>
                    <td className="max-w-[180px] truncate">{r.reason || "—"}</td>
                    <td>
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="stitch-btn-icon"
                        aria-label="View leave request"
                        onClick={() => setViewRow(r)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showModal ? (
        <div className="stitch-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="stitch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Apply Leave</h3>
              <button type="button" className="stitch-btn-icon" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submit} className="stitch-modal-body space-y-4">
              <div>
                <label className="stitch-label">Leave Type</label>
                <select
                  className="stitch-input"
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                >
                  {typeOptions.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="stitch-label">From</label>
                  <input
                    type="date"
                    required
                    className="stitch-input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="stitch-label">To</label>
                  <input
                    type="date"
                    required
                    className="stitch-input"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="stitch-label">Reason</label>
                <textarea
                  className="stitch-input min-h-[100px]"
                  placeholder="Reason for leave"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="stitch-btn-sm" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewRow ? (
        <div className="stitch-modal-backdrop" onClick={() => setViewRow(null)}>
          <div className="stitch-modal stitch-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Leave Request</h3>
              <button type="button" className="stitch-btn-icon" onClick={() => setViewRow(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="stitch-modal-body space-y-3 text-sm">
              <p>
                <span className="text-[var(--sp-muted)]">Type:</span>{" "}
                {leaveTypeLabel(viewRow.leaveType)}
              </p>
              <p>
                <span className="text-[var(--sp-muted)]">Period:</span>{" "}
                {new Date(viewRow.startDate).toLocaleDateString()} –{" "}
                {new Date(viewRow.endDate).toLocaleDateString()} ({viewRow.days} days)
              </p>
              <p>
                <span className="text-[var(--sp-muted)]">Status:</span>{" "}
                <span className={statusBadge(viewRow.status)}>{viewRow.status}</span>
              </p>
              <p>
                <span className="text-[var(--sp-muted)]">Reason:</span> {viewRow.reason || "—"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
