"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";
import {
  Users,
  Wallet,
  FolderKanban,
  Package,
  Boxes,
  Wrench,
  Shield,
  LayoutDashboard,
} from "lucide-react";

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
};

const modules = [
  { href: "/admin/erp/hr", label: "HRM", desc: "Employees & leave", icon: Users, perm: "erp.hr.view" },
  { href: "/admin/erp/finance", label: "Finance", desc: "Income & expenses", icon: Wallet, perm: "erp.finance.view" },
  { href: "/admin/erp/projects", label: "Projects", desc: "Tasks & delivery", icon: FolderKanban, perm: "erp.projects.view" },
  { href: "/admin/erp/assets", label: "EAM", desc: "Asset registry", icon: Package, perm: "erp.assets.view" },
  { href: "/admin/erp/inventory", label: "SCM", desc: "Inventory / stock", icon: Boxes, perm: "erp.inventory.view" },
  { href: "/admin/erp/fsm", label: "FSM", desc: "Field work orders", icon: Wrench, perm: "erp.fsm.view" },
  { href: "/admin/erp/permissions", label: "Roles", desc: "Staff permissions", icon: Shield, perm: "erp.permissions.manage" },
];

export function ErpDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/erp");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStats(data.stats);
      setPermissions(data.permissions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const can = (p: string) => permissions.includes(p) || permissions.includes("erp.permissions.manage");

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-2 text-muted text-sm">
        <LayoutDashboard className="h-4 w-4" />
        Internal ERP · modules gated by role + StaffPermission
      </div>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active employees", value: String(stats.employees) },
            { label: "Pending leave", value: String(stats.leavePending) },
            { label: "Active projects", value: String(stats.projects) },
            { label: "Open work orders", value: String(stats.workOrders) },
            { label: "Assets", value: String(stats.assets) },
            { label: "SKUs / low stock", value: `${stats.inventory} / ${stats.lowStockCount}` },
            { label: "Income", value: formatMoney(stats.incomeCents) },
            { label: "Net (P&L)", value: formatMoney(stats.netCents) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 p-4">
              <p className="text-xs font-mono uppercase text-muted">{s.label}</p>
              <p className="font-display text-xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          const allowed = can(m.perm);
          return (
            <Link
              key={m.href}
              href={allowed ? m.href : "/admin/erp"}
              className={`rounded-xl border p-5 transition-colors ${
                allowed
                  ? "border-white/10 hover:border-accent/40 hover:bg-accent/5"
                  : "border-white/5 opacity-40 pointer-events-none"
              }`}
            >
              <Icon className="h-5 w-5 text-accent mb-3" />
              <p className="font-display font-semibold">{m.label}</p>
              <p className="text-sm text-muted mt-1">{m.desc}</p>
            </Link>
          );
        })}
      </div>

      <Button asChild variant="outline" size="sm">
        <Link href="/admin/reports">Analytics / reports</Link>
      </Button>
    </div>
  );
}
