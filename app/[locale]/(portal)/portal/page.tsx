"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import type { SessionUser } from "@/lib/auth-types";

type Order = { id: string; orderNumber: string; status: string; totalCents: number };
type Invoice = { id: string; invoiceNumber: string; status: string; totalCents: number };

export default function PortalHomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => undefined);
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders((d.orders ?? []).slice(0, 3))).catch(() => undefined);
    fetch("/api/invoices").then((r) => r.json()).then((d) => setInvoices((d.invoices ?? []).slice(0, 3))).catch(() => undefined);
  }, []);

  const pendingInvoices = invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID");
  const quick = [
    { href: "/portal/services", label: "My Services", hint: "Active subscriptions" },
    { href: "/portal/cart", label: "Cart", hint: "Checkout products" },
    { href: "/portal/orders", label: "Orders", hint: "Track purchases" },
    { href: "/portal/domains", label: "Domains", hint: "DNS & renewals" },
    { href: "/portal/hosting", label: "Hosting", hint: "Usage & panel" },
    { href: "/portal/invoices", label: "Billing", hint: "Pay invoices" },
    { href: "/portal/tickets", label: "Support", hint: "Open tickets" },
    { href: "/portal/notifications", label: "Notifications", hint: "Alerts & notices" },
  ];

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold">
          Welcome{user ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-muted max-w-xl">
          Your customer dashboard — services, billing, support, and notifications in one place.
        </p>
        {user && !user.emailVerifiedAt && (
          <p className="mt-3 text-sm text-amber-400">Please verify your email to unlock all features.</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs font-mono text-muted uppercase">Pending invoices</p>
          <p className="font-display text-2xl font-bold mt-1">{pendingInvoices.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs font-mono text-muted uppercase">Recent orders</p>
          <p className="font-display text-2xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs font-mono text-muted uppercase">Open tickets</p>
          <p className="font-display text-2xl font-bold mt-1">0</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs font-mono text-muted uppercase">Notifications</p>
          <p className="font-display text-2xl font-bold mt-1">1</p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quick.map((c) => (
            <Link key={c.href} href={c.href} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-accent/40 transition-colors">
              <p className="font-display font-semibold">{c.label}</p>
              <p className="text-sm text-muted mt-1">{c.hint}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Recent orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet. <Link href="/products" className="text-accent">Browse products</Link></p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="text-sm flex justify-between border-b border-white/5 py-2">
                  <span className="font-mono text-accent">{o.orderNumber}</span>
                  <span>{formatMoney(o.totalCents)} · {o.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Pending invoices</h2>
          {pendingInvoices.length === 0 ? (
            <p className="text-sm text-muted">No pending invoices.</p>
          ) : (
            <ul className="space-y-2">
              {pendingInvoices.map((inv) => (
                <li key={inv.id} className="text-sm flex justify-between border-b border-white/5 py-2">
                  <Link href="/portal/invoices" className="font-mono text-accent hover:underline">{inv.invoiceNumber}</Link>
                  <span>{formatMoney(inv.totalCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
