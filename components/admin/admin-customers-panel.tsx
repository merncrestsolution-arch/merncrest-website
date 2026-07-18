"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Customer = {
  id: string;
  customerCode?: string | null;
  fullName: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  language?: string | null;
  counts: {
    orders: number;
    invoices: number;
    domains: number;
    hostingAccounts: number;
    tickets: number;
  };
};

type Customer360 = {
  customerCode?: string | null;
  fullName: string;
  email: string;
  company?: string | null;
  profile?: Record<string, unknown> | null;
  services: { domains: unknown[]; hosting: unknown[]; subscriptions: unknown[] };
  financial: {
    openInvoices: { invoiceNumber: string; totalCents: number; status: string }[];
    creditBalanceCents: number;
  };
  support: {
    tickets: { ticketNumber: string; subject: string; status: string; csatRating?: number | null }[];
    calls: { callNumber: string; status: string; department: string }[];
  };
};

export function AdminCustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCustomers(data.customers ?? []);
      setSelected((prev) => prev || data.customers?.[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/admin/customers/${selected}`)
      .then((r) => r.json())
      .then((d) => setDetail(d.customer ?? null))
      .catch(() => setDetail(null));
  }, [selected]);

  if (loading) return <p className="text-sm text-muted">Loading customers…</p>;

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {error && <p className="text-sm text-red-400 lg:col-span-2">{error}</p>}
      <ul className="space-y-2 max-h-[560px] overflow-y-auto">
        {customers.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setSelected(c.id)}
              className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                selected === c.id ? "border-accent/50 bg-accent/10" : "border-white/10"
              }`}
            >
              <p className="font-medium truncate">{c.fullName}</p>
              <p className="text-xs font-mono text-accent">{c.customerCode || "—"}</p>
              <p className="text-xs text-muted mt-1">
                {c.counts.domains}d · {c.counts.hostingAccounts}h · {c.counts.tickets}t
              </p>
            </button>
          </li>
        ))}
      </ul>

      {detail ? (
        <div className="space-y-4 rounded-xl border border-white/10 p-5">
          <div>
            <p className="font-mono text-xs text-accent">{detail.customerCode}</p>
            <h2 className="font-display text-xl font-bold">{detail.fullName}</h2>
            <p className="text-sm text-muted">
              {detail.email}
              {detail.company ? ` · ${detail.company}` : ""}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="border border-white/10 rounded-lg p-3">
              <p className="text-xs text-muted">Domains</p>
              <p className="font-display text-xl font-bold">{detail.services.domains.length}</p>
            </div>
            <div className="border border-white/10 rounded-lg p-3">
              <p className="text-xs text-muted">Hosting</p>
              <p className="font-display text-xl font-bold">{detail.services.hosting.length}</p>
            </div>
            <div className="border border-white/10 rounded-lg p-3">
              <p className="text-xs text-muted">Open invoices</p>
              <p className="font-display text-xl font-bold">{detail.financial.openInvoices.length}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2">Support history</h3>
            <ul className="text-sm space-y-1">
              {detail.support.tickets.slice(0, 5).map((t) => (
                <li key={t.ticketNumber} className="text-muted">
                  {t.ticketNumber} · {t.status}
                  {t.csatRating ? ` · ★${t.csatRating}` : ""} — {t.subject}
                </li>
              ))}
              {detail.support.tickets.length === 0 && <li className="text-muted">No tickets</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2">Call records</h3>
            <ul className="text-sm space-y-1">
              {detail.support.calls.slice(0, 5).map((c) => (
                <li key={c.callNumber} className="text-muted">
                  {c.callNumber} · {c.department} · {c.status}
                </li>
              ))}
              {detail.support.calls.length === 0 && <li className="text-muted">No calls</li>}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Select a customer for 360° profile</p>
      )}
    </div>
  );
}
