"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { ERP_SECTIONS } from "@/lib/erp/modules";
import { formatMoney } from "@/lib/commerce-format";
import { Button } from "@/components/ui/button";

type Stats = {
  employees: number;
  leavePending: number;
  projects: number;
  assets: number;
  inventory: number;
  workOrders: number;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  lowStockCount: number;
  approvalsPending?: number;
  auditCount?: number;
  organizations?: number;
};

export function ErpDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [depts, setDepts] = useState<{ code: string; name: string; parentId?: string | null }[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [erpRes, hrRes] = await Promise.all([fetch("/api/erp"), fetch("/api/erp/hr")]);
      const erp = await erpRes.json();
      const hr = await hrRes.json();
      if (!erpRes.ok) throw new Error(erp.error || "Failed");
      setStats(erp.stats);
      setPermissions(erp.permissions ?? []);
      if (hrRes.ok) setDepts(hr.departments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const can = (p: string) =>
    permissions.includes(p) ||
    permissions.includes("erp.permissions.manage") ||
    (p.endsWith(".view") && permissions.includes(p.replace(".view", ".manage")));

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
        <p className="text-sm text-muted mb-3">
          Part 05 Enterprise Platform — 20 module groups. Architecture · departments · hierarchy.
        </p>
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Employees", value: String(stats.employees) },
              { label: "Active projects", value: String(stats.projects) },
              { label: "Net P&L", value: formatMoney(stats.netCents) },
              { label: "Work orders", value: String(stats.workOrders) },
              { label: "Pending approvals", value: String(stats.approvalsPending ?? 0) },
              { label: "Organizations", value: String(stats.organizations ?? 0) },
              { label: "Audit events", value: String(stats.auditCount ?? 0) },
              { label: "Leave pending", value: String(stats.leavePending) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 p-4">
                <p className="text-xs font-mono uppercase text-muted">{s.label}</p>
                <p className="font-display text-xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {depts.length > 0 && (
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="font-display font-semibold text-sm mb-2">Organization · departments</h3>
          <ul className="flex flex-wrap gap-2 text-xs">
            {depts.map((d) => (
              <li key={d.code} className="border border-white/10 px-2 py-1 rounded font-mono">
                {d.code} · {d.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ERP_SECTIONS.map((m) => {
          const allowed = can(m.permission);
          return (
            <Link
              key={m.id}
              href={allowed ? m.href : "/admin/erp"}
              className={`rounded-xl border p-5 transition-colors ${
                allowed
                  ? "border-white/10 hover:border-accent/40 hover:bg-accent/5"
                  : "border-white/5 opacity-40 pointer-events-none"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{m.section}</p>
              <p className="font-display font-semibold mt-1">{m.title}</p>
              <p className="text-sm text-muted mt-2 leading-relaxed">{m.summary}</p>
              <ul className="mt-3 flex flex-wrap gap-1">
                {m.features.slice(0, 4).map((f) => (
                  <li key={f} className="text-[10px] border border-white/10 px-1.5 py-0.5 rounded text-muted">
                    {f}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm"><Link href="/staff">Staff portal</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/organization">Organization</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/approvals">Approvals</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/coa">Chart of Accounts</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/audit">Audit logs</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/erp/dashboards">Executive dashboards</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/admin/reports">BI / Reports</Link></Button>
      </div>
    </div>
  );
}
