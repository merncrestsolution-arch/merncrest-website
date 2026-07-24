"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { Receipt, FileText, CreditCard, TrendingUp, Building2 } from "lucide-react";

type FinanceSnapshot = {
  pendingInvoices: number;
  paidThisMonthCents: number;
  pendingPayments: number;
  erpIncomeCents: number;
  erpExpenseCents: number;
  erpNetCents: number;
};

export function SystemFinanceHub() {
  const [snap, setSnap] = useState<FinanceSnapshot | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/invoices").then((r) => r.json()).catch(() => ({})),
      fetch("/api/staff/command-center").then((r) => r.json()).catch(() => ({})),
      fetch("/api/erp").then((r) => r.json()).catch(() => ({})),
    ]).then(([invoices, cmd, erp]) => {
      const list = invoices.invoices ?? [];
      const pending = list.filter((i: { status: string }) => i.status === "PENDING" || i.status === "OVERDUE").length;
      const paidMonth = list
        .filter((i: { status: string; paidAt?: string }) => i.status === "PAID")
        .reduce((sum: number, i: { totalCents?: number }) => sum + (i.totalCents ?? 0), 0);
      setSnap({
        pendingInvoices: pending,
        paidThisMonthCents: paidMonth,
        pendingPayments: cmd.kpis?.pendingPayments ?? 0,
        erpIncomeCents: erp.stats?.incomeCents ?? 0,
        erpExpenseCents: erp.stats?.expenseCents ?? 0,
        erpNetCents: erp.stats?.netCents ?? 0,
      });
    });
  }, []);

  const cards = [
    { label: "Pending invoices", value: String(snap?.pendingInvoices ?? "—") },
    { label: "Pending payments", value: String(snap?.pendingPayments ?? "—") },
    { label: "ERP income", value: formatMoney(snap?.erpIncomeCents ?? 0) },
    { label: "ERP expenses", value: formatMoney(snap?.erpExpenseCents ?? 0) },
    { label: "ERP net P&L", value: formatMoney(snap?.erpNetCents ?? 0) },
  ];

  const modules = [
    { href: "/staff/billing", label: "Billing hub", desc: "Quotes, invoices, receipts & clients", icon: Building2 },
    { href: "/staff/invoices", label: "Invoices", desc: "AR billing & collections", icon: Receipt },
    { href: "/staff/quotations", label: "Quotations", desc: "Sales quotes & proposals", icon: FileText },
    { href: "/staff/clients", label: "Clients", desc: "Create & manage portal clients", icon: Building2 },
    { href: "/admin/payments", label: "Payments", desc: "Verify bank transfers", icon: CreditCard },
    { href: "/admin/erp/finance", label: "Finance (GL)", desc: "General ledger & expenses", icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="stitch-bento-card">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--sp-muted)" }}>
              {c.label}
            </p>
            <p className="font-display text-xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href} className="stitch-bento-card hover:border-[var(--stitch-primary)] transition-colors group">
              <div className="flex items-start gap-3">
                <span className="stitch-brand-icon group-hover:scale-105 transition-transform" style={{ width: "2.5rem", height: "2.5rem" }}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--sp-muted)" }}>{m.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
