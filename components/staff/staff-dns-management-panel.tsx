"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Globe2, Loader2, Search } from "lucide-react";
import { formatSriLankaDate } from "@/lib/timezone";
import { registrarLabel } from "@/shared/domain-registrars";

type DnsRow = {
  id: string;
  domainName: string;
  registrar: string | null;
  effectiveDomainStatus: string;
  dnsRecordCount: number;
  nameservers: string[];
  purchasedViaMernCrest: boolean;
  project: { id: string; name: string; erpProjectId: string | null } | null;
  client: { id: string; fullName: string; email: string } | null;
};

export function StaffDnsManagementPanel() {
  const [rows, setRows] = useState<DnsRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/staff/dns?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setRows(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="stitch-page-title">DNS Management</h1>
          <p className="stitch-page-sub">
            Central view of all domain DNS zones across managed service projects.
          </p>
        </div>
        <Link href="/staff/dns-change-requests" className="stitch-btn-primary-sm">
          DNS change requests
        </Link>
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sp-muted)]" />
          <input
            className="stitch-input pl-9"
            placeholder="Search domains…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <button type="button" className="stitch-btn-sm" onClick={load}>
          Search
        </button>
      </div>

      {error ? <p className="stitch-auth-error text-sm">{error}</p> : null}

      <section className="stitch-section-card">
        <div className="stitch-section-body overflow-x-auto !p-0">
          {loading ? (
            <p className="p-6 text-sm text-[var(--sp-muted)] flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading DNS zones…
            </p>
          ) : (
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Registrar</th>
                  <th>Nameservers</th>
                  <th>Records</th>
                  <th>Status</th>
                  <th>Project</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-[var(--sp-muted)] py-8">
                      No managed domains found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono">{row.domainName}</td>
                      <td>{registrarLabel(row.registrar)}</td>
                      <td className="font-mono text-xs max-w-[200px] truncate">
                        {row.nameservers?.length
                          ? row.nameservers.slice(0, 2).join(", ")
                          : "—"}
                      </td>
                      <td>{row.dnsRecordCount}</td>
                      <td>{row.effectiveDomainStatus.replace("_", " ")}</td>
                      <td>
                        {row.project?.erpProjectId ? (
                          <Link
                            href={`/staff/projects/${row.project.erpProjectId}#services`}
                            className="hover:text-violet-400"
                          >
                            {row.project.name}
                          </Link>
                        ) : (
                          row.project?.name ?? "—"
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/staff/domains/managed/${row.id}?tab=dns`}
                          className="stitch-btn-sm inline-flex"
                        >
                          <Globe2 className="h-3.5 w-3.5" />
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
