"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, ShieldCheck } from "lucide-react";

type Session = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

type History = {
  id: string;
  email: string;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export function SystemSecurityPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [twoFactor, setTwoFactor] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const load = useCallback(async () => {
    const [sRes, secRes, meRes] = await Promise.all([
      fetch("/api/auth/sessions"),
      fetch("/api/staff/security"),
      fetch("/api/auth/me"),
    ]);
    const s = await sRes.json();
    const sec = await secRes.json();
    if (sRes.ok) setSessions(s.sessions ?? []);
    if (secRes.ok) setTwoFactor(Boolean(sec.twoFactorEnabled));

    const me = await meRes.json();
    if (meRes.ok && me.user?.email) {
      const prof = await fetch("/api/portal/profile");
      const pd = await prof.json();
      if (prof.ok) setHistory(pd.loginHistory ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const failed = history.filter((h) => !h.success).length;
    const lastLogin = history.find((h) => h.success);
    return {
      sessions: sessions.length,
      twoFactor: twoFactor ? "Enabled" : "Disabled",
      lastLogin: lastLogin ? new Date(lastLogin.createdAt).toLocaleString() : "—",
      failed,
    };
  }, [sessions, twoFactor, history]);

  async function revokeAll() {
    await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
    setMsg("Other sessions signed out.");
  }

  async function toggle2fa() {
    const res = await fetch("/api/staff/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twoFactorEnabled: !twoFactor }),
    });
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else {
      setTwoFactor(!twoFactor);
      setMsg("2FA preference updated (TOTP enrollment coming soon).");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      setError("Passwords do not match");
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
    });
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else {
      setMsg("Password updated.");
      setPw({ current: "", next: "", confirm: "" });
    }
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Security</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Security</h1>
          <p className="stitch-page-sub">Sessions, login history, 2FA, and password management.</p>
        </div>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}
      {msg ? (
        <p className="stitch-chip stitch-chip-success !mb-4 !inline-flex">{msg}</p>
      ) : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Active Sessions</div>
          <div className="stitch-stat-num">{stats.sessions}</div>
        </div>
        <div
          className={`stitch-stat-card ${twoFactor ? "border-[var(--stitch-success)]" : ""}`}
        >
          <div className="stitch-stat-label">2FA Status</div>
          <div
            className="stitch-stat-num text-base"
            style={{ color: twoFactor ? "var(--stitch-success)" : "var(--stitch-warning)" }}
          >
            {stats.twoFactor}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Last Login</div>
          <div className="stitch-stat-num text-sm !leading-tight">{stats.lastLogin}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Failed Attempts</div>
          <div
            className="stitch-stat-num"
            style={{ color: stats.failed ? "var(--stitch-danger)" : undefined }}
          >
            {stats.failed}
          </div>
        </div>
      </div>

      <div className="stitch-dash-grid-2 mb-6">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <Shield className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Active Sessions
            </h3>
            <button type="button" className="stitch-btn-sm" onClick={revokeAll}>
              Sign out others
            </button>
          </div>
          <div className="stitch-section-body space-y-3">
            {sessions.length === 0 ? (
              <p className="stitch-page-sub !mb-0">No active sessions.</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-[var(--sp-outline)] p-3 bg-[var(--stitch-surface-low)]"
                >
                  <p className="text-sm font-medium m-0">
                    {s.current ? (
                      <span className="stitch-chip stitch-badge-done mr-2">Current</span>
                    ) : null}
                    {s.ip || "Unknown IP"}
                  </p>
                  <p className="text-xs text-[var(--sp-muted)] mt-1 mb-0">
                    {s.userAgent?.slice(0, 80) || "Unknown device"} · Since{" "}
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <ShieldCheck className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Two-Factor Authentication
            </h3>
            <button type="button" className="stitch-btn-primary-sm" onClick={toggle2fa}>
              {twoFactor ? "Disable" : "Enable"}
            </button>
          </div>
          <div className="stitch-section-body">
            <p className="stitch-page-sub !mb-0">
              Status: <strong>{twoFactor ? "Enabled" : "Disabled"}</strong>. Full TOTP enrollment is
              planned; admins can require 2FA in Settings → Security.
            </p>
          </div>
        </section>
      </div>

      <div className="stitch-dash-grid-2">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Change Password</h3>
          </div>
          <form onSubmit={changePassword} className="stitch-section-body space-y-3">
            <input
              className="stitch-input w-full"
              type="password"
              placeholder="Current password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              required
            />
            <input
              className="stitch-input w-full"
              type="password"
              placeholder="New password (8+ chars)"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              required
            />
            <input
              className="stitch-input w-full"
              type="password"
              placeholder="Confirm new password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              required
            />
            <button type="submit" className="stitch-btn-primary-sm">
              Update Password
            </button>
          </form>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Device Login History</h3>
          </div>
          <div className="stitch-section-body !p-0 max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <p className="stitch-page-sub p-4">No login history.</p>
            ) : (
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>IP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="text-xs">{new Date(h.createdAt).toLocaleString()}</td>
                      <td className="text-xs">{h.ip || "—"}</td>
                      <td>
                        <span
                          className={
                            h.success ? "stitch-chip stitch-badge-done" : "stitch-chip stitch-badge-danger"
                          }
                        >
                          {h.success ? "Success" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
