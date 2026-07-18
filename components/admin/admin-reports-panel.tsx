"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    fetch("/api/erp")
      .then((r) => r.json())
      .then(setErp)
      .catch(() => undefined);
    fetch("/api/admin/commerce")
      .then((r) => r.json())
      .then(setCommerce)
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Combined commerce + ERP snapshot (IoT / manufacturing analytics expand later).
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Commerce revenue", value: formatMoney(commerce?.stats?.revenueCents ?? 0) },
          { label: "Orders", value: String(commerce?.stats?.orderCount ?? 0) },
          { label: "Customers", value: String(commerce?.stats?.customerCount ?? 0) },
          { label: "ERP income", value: formatMoney(erp?.stats?.incomeCents ?? 0) },
          { label: "ERP net", value: formatMoney(erp?.stats?.netCents ?? 0) },
          { label: "Active projects", value: String(erp?.stats?.projects ?? 0) },
          { label: "Employees", value: String(erp?.stats?.employees ?? 0) },
          { label: "Open work orders", value: String(erp?.stats?.workOrders ?? 0) },
          { label: "Low stock SKUs", value: String(erp?.stats?.lowStockCount ?? 0) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 p-4">
            <p className="text-xs font-mono uppercase text-muted">{s.label}</p>
            <p className="font-display text-xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/erp">Open ERP hub</Link>
      </Button>
    </div>
  );
}
