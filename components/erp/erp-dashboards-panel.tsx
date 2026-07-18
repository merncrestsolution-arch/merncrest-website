"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/commerce-format";

type Dashboards = {
  ceo: { customers: number; revenueCents: number; netCents: number; projects: number; openTickets: number };
  finance: { incomeCents: number; expenseCents: number; netCents: number };
  hr: { employees: number; leavePending: number };
  sales: { customers: number; revenueCents: number; projects: number };
  support: { openTickets: number; incidents: number; workOrders: number };
  operations: { workOrders: number; lowStock: number; projects: number };
  projects: { active: number };
  systemHealth: { iotDevices: number; alertDevices: number; avgHealth: number };
};

export function ErpDashboardsPanel() {
  const [data, setData] = useState<Dashboards | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/erp/dashboards")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d.dashboards);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading dashboards…</p>;

  const cards: { title: string; rows: { label: string; value: string }[] }[] = [
    {
      title: "CEO",
      rows: [
        { label: "Customers", value: String(data.ceo.customers) },
        { label: "Revenue", value: formatMoney(data.ceo.revenueCents) },
        { label: "ERP net", value: formatMoney(data.ceo.netCents) },
        { label: "Projects", value: String(data.ceo.projects) },
        { label: "Open tickets", value: String(data.ceo.openTickets) },
      ],
    },
    {
      title: "Finance",
      rows: [
        { label: "Income", value: formatMoney(data.finance.incomeCents) },
        { label: "Expense", value: formatMoney(data.finance.expenseCents) },
        { label: "Net", value: formatMoney(data.finance.netCents) },
      ],
    },
    {
      title: "HR",
      rows: [
        { label: "Employees", value: String(data.hr.employees) },
        { label: "Pending leave", value: String(data.hr.leavePending) },
      ],
    },
    {
      title: "Sales",
      rows: [
        { label: "Customers", value: String(data.sales.customers) },
        { label: "Revenue", value: formatMoney(data.sales.revenueCents) },
        { label: "Projects", value: String(data.sales.projects) },
      ],
    },
    {
      title: "Support",
      rows: [
        { label: "Tickets", value: String(data.support.openTickets) },
        { label: "ESM incidents", value: String(data.support.incidents) },
        { label: "FSM jobs", value: String(data.support.workOrders) },
      ],
    },
    {
      title: "Operations",
      rows: [
        { label: "Work orders", value: String(data.operations.workOrders) },
        { label: "Low stock", value: String(data.operations.lowStock) },
        { label: "Projects", value: String(data.operations.projects) },
      ],
    },
    {
      title: "Projects",
      rows: [{ label: "Active / planning", value: String(data.projects.active) }],
    },
    {
      title: "System health",
      rows: [
        { label: "IoT devices", value: String(data.systemHealth.iotDevices) },
        { label: "Alerts", value: String(data.systemHealth.alertDevices) },
        { label: "Avg health", value: `${data.systemHealth.avgHealth}%` },
      ],
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.title} className="rounded-xl border border-white/10 p-4 space-y-2">
          <h3 className="font-display font-semibold text-sm">{c.title}</h3>
          {c.rows.map((r) => (
            <div key={r.label} className="flex justify-between text-sm gap-2">
              <span className="text-muted">{r.label}</span>
              <span className="font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
