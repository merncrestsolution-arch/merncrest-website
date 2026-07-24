"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

type Domain = {
  id: string;
  name: string;
  tld: string;
  status: string;
  expiresAt: string | null;
  autoRenew: boolean;
  user: { fullName: string; email: string };
  provider?: { name: string } | null;
};

export function SystemDomainsPanel() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [expiring, setExpiring] = useState<Domain[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/domains");
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else {
      setDomains(d.domains ?? []);
      setExpiring(d.expiring ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1 className="stitch-page-title">Domain management</h1>
      <p className="stitch-page-sub !mb-5">All customer domains · expiry alerts · registrar status</p>
      {error ? <p className="stitch-auth-error !mb-4">{error}</p> : null}

      <div className="stitch-stat-grid !grid-cols-3 !mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{domains.length}</div>
          <div className="stitch-stat-label">Total domains</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{expiring.length}</div>
          <div className="stitch-stat-label">Expiring (30d)</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{domains.filter((d) => d.autoRenew).length}</div>
          <div className="stitch-stat-label">Auto-renew on</div>
        </div>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Domain list</h3>
        </div>
        <div className="stitch-section-body overflow-x-auto">
          <table className="stitch-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Customer</th>
                <th>Registrar</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={5} className="stitch-page-sub">No domains yet.</td>
                </tr>
              ) : (
                domains.map((d) => (
                  <tr key={d.id}>
                    <td className="font-mono text-sm">
                      {d.name}.{d.tld}
                    </td>
                    <td>
                      <Link href={`/admin/customers`} className="stitch-link">
                        {d.user.fullName}
                      </Link>
                    </td>
                    <td>{d.provider?.name || "—"}</td>
                    <td>{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <span className="stitch-chip stitch-chip-violet">{d.status}</span>
                    </td>
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
