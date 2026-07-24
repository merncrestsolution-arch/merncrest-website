"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { Button } from "@/components/ui/button";
import type { CommandCenterKpis } from "@/lib/dashboard/command-center";

type CrmAnalytics = {
  totals?: {
    leads: number;
    won: number;
    lost: number;
    winRate: number;
    wonValueCents: number;
    avgScore: number;
  };
  byStage?: { stage: string; _count: { _all: number }; _sum: { valueCents: number | null } }[];
};

export function AdminReportsPanel() {
  const [erp, setErp] = useState<{
    stats?: {
      employees: number;
      projects: number;
      incomeCents: number;
      expenseCents: number;
      netCents: number;
      workOrders: number;
      lowStockCount: number;
    };
  } | null>(null);
  const [commerce, setCommerce] = useState<{
    stats?: { revenueCents: number; orderCount: number; customerCount: number };
  } | null>(null);
  const [kpis, setKpis] = useState<CommandCenterKpis | null>(null);
  const [crm, setCrm] = useState<CrmAnalytics | null>(null);

  useEffect(() => {
    fetch("/api/erp")
      .then((r) => r.json())
      .then(setErp)
      .catch(() => undefined);
    fetch("/api/admin/commerce")
      .then((r) => r.json())
      .then(setCommerce)
      .catch(() => undefined);
    fetch("/api/staff/command-center")
      .then((r) => r.json())
      .then((d) => setKpis(d.kpis ?? null))
      .catch(() => undefined);
    fetch("/api/crm/analytics")
      .then((r) => r.json())
      .then(setCrm)
      .catch(() => undefined);
  }, []);

  const sections = [
    {
      title: "Command center",
      items: [
        { label: "Revenue today", value: formatMoney(kpis?.todayRevenueCents ?? 0) },
        { label: "Revenue this month", value: formatMoney(kpis?.monthRevenueCents ?? 0) },
        { label: "Pending payments", value: String(kpis?.pendingPayments ?? 0) },
        { label: "New leads (30d)", value: String(kpis?.newLeads ?? 0) },
        { label: "New clients", value: String(kpis?.newClients ?? 0) },
        { label: "Open tickets", value: String(kpis?.openTickets ?? 0) },
        { label: "Live chats", value: String(kpis?.liveChats ?? 0) },
        { label: "Domain expiry alerts", value: String(kpis?.domainExpiryAlerts ?? 0) },
        { label: "Staff attendance today", value: String(kpis?.staffAttendanceToday ?? 0) },
      ],
    },
    {
      title: "Commerce",
      items: [
        { label: "Commerce revenue", value: formatMoney(commerce?.stats?.revenueCents ?? 0) },
        { label: "Orders", value: String(commerce?.stats?.orderCount ?? 0) },
        { label: "Customers", value: String(commerce?.stats?.customerCount ?? 0) },
      ],
    },
    {
      title: "CRM pipeline",
      items: [
        { label: "Total leads", value: String(crm?.totals?.leads ?? 0) },
        { label: "Won deals", value: String(crm?.totals?.won ?? 0) },
        { label: "Won value", value: formatMoney(crm?.totals?.wonValueCents ?? 0) },
        { label: "Win rate", value: `${crm?.totals?.winRate ?? 0}%` },
        { label: "Avg lead score", value: String(crm?.totals?.avgScore ?? 0) },
      ],
    },
    {
      title: "ERP operations",
      items: [
        { label: "ERP income", value: formatMoney(erp?.stats?.incomeCents ?? 0) },
        { label: "ERP net", value: formatMoney(erp?.stats?.netCents ?? 0) },
        { label: "Active projects", value: String(erp?.stats?.projects ?? 0) },
        { label: "Employees", value: String(erp?.stats?.employees ?? 0) },
        { label: "Open work orders", value: String(erp?.stats?.workOrders ?? 0) },
        { label: "Low stock SKUs", value: String(erp?.stats?.lowStockCount ?? 0) },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        Unified business intelligence across command center, commerce, CRM, and ERP.
      </p>

      {sections.map((section) => (
        <div key={section.title} className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
            {section.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {section.items.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 p-4">
                <p className="text-xs font-mono uppercase text-muted">{s.label}</p>
                <p className="font-display text-xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {crm?.byStage && crm.byStage.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
            Leads by stage
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {crm.byStage.map((row) => (
              <div key={row.stage} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                <p className="font-medium">{row.stage}</p>
                <p className="text-xs text-muted mt-0.5">
                  {row._count._all} leads · {formatMoney(row._sum.valueCents ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/staff">Command center</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/staff/billing">Billing</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/crm">CRM</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/erp/projects">Projects</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/erp/finance">Finance (GL)</Link>
        </Button>
      </div>
    </div>
  );
}
