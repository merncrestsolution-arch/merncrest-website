"use client";

import { useCallback, useEffect, useState } from "react";

type Account = {
  id: string;
  label: string;
  planCode: string;
  status: string;
  sslStatus: string;
  renewsAt: string | null;
  cpuPercent: number;
  ramUsedMb: number;
  ramMb: number;
  diskUsedMb: number;
  diskMb: number;
  primaryDomain: string | null;
  user: { fullName: string; email: string };
  provider?: { name: string } | null;
};

export function SystemHostingPanel() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; avgCpuPercent: number } | null>(
    null
  );
  const [sslIssues, setSslIssues] = useState<Account[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/hosting");
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else {
      setAccounts(d.accounts ?? []);
      setStats(d.stats ?? null);
      setSslIssues(d.sslIssues ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1 className="stitch-page-title">Hosting management</h1>
      <p className="stitch-page-sub !mb-5">
        Shared · VPS · Cloud · disk · bandwidth · SSL status
      </p>
      {error ? <p className="stitch-auth-error !mb-4">{error}</p> : null}

      <div className="stitch-stat-grid !grid-cols-4 !mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{stats?.total ?? 0}</div>
          <div className="stitch-stat-label">Accounts</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{stats?.active ?? 0}</div>
          <div className="stitch-stat-label">Active</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{sslIssues.length}</div>
          <div className="stitch-stat-label">SSL alerts</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{stats?.avgCpuPercent ?? 0}%</div>
          <div className="stitch-stat-label">Avg CPU</div>
        </div>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Hosting accounts</h3>
        </div>
        <div className="stitch-section-body overflow-x-auto">
          <table className="stitch-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Disk</th>
                <th>SSL</th>
                <th>Renews</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="stitch-page-sub">No hosting accounts.</td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.label}</td>
                    <td>{a.user.fullName}</td>
                    <td>{a.planCode}</td>
                    <td>
                      {Math.round((a.diskUsedMb / a.diskMb) * 100)}% · {a.diskUsedMb}/{a.diskMb}MB
                    </td>
                    <td>
                      <span
                        className={`stitch-chip ${
                          ["OK", "ACTIVE"].includes(a.sslStatus) ? "stitch-chip-success" : ""
                        }`}
                      >
                        {a.sslStatus}
                      </span>
                    </td>
                    <td>{a.renewsAt ? new Date(a.renewsAt).toLocaleDateString() : "—"}</td>
                    <td>{a.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
