"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { Button } from "@/components/ui/button";

type DashboardData = {
  profile: {
    fullName?: string;
    email?: string;
    customerCode?: string | null;
    emailVerifiedAt?: string | null;
    company?: string | null;
  };
  stats: {
    domains: number;
    hosting: number;
    cloud: number;
    software: number;
    openTickets: number;
    pendingInvoices: number;
    pendingPayments: number;
    unreadNotifications: number;
    activeSubscriptions: number;
  };
  recentOrders: { id: string; orderNumber: string; status: string; totalCents: number }[];
  pendingInvoices: { id: string; invoiceNumber: string; status: string; totalCents: number }[];
  activeServices: {
    domains: { id: string; name: string; tld: string; status: string }[];
    hosting: { id: string; label: string; status: string }[];
    subscriptions: { id: string; productName: string; status: string }[];
  };
  openTickets: { id: string; ticketNumber: string; subject: string; status: string }[];
  announcements: { id: string; title: string; body: string; tone: string; href?: string | null }[];
  notifications: { id: string; title: string; body: string; readAt: string | null }[];
  renewals: { type: string; label: string; date: string | null; href: string }[];
  pendingPayments: {
    id: string;
    method: string;
    status: string;
    amountCents: number;
    invoice?: { invoiceNumber: string } | null;
  }[];
  quotations: { id: string; quoteNumber: string; status: string; totalCents: number }[];
  activities: {
    id: string;
    category: string;
    title: string;
    createdAt: string;
  }[];
};

const widgetLinks = [
  { href: "/portal/domains", label: "Domains", key: "domains" as const },
  { href: "/portal/hosting", label: "Hosting", key: "hosting" as const },
  { href: "/portal/hosting", label: "Cloud", key: "cloud" as const },
  { href: "/portal/services", label: "Software", key: "software" as const },
  { href: "/portal/invoices", label: "Invoices", key: "pendingInvoices" as const },
  { href: "/portal/tickets", label: "Support", key: "openTickets" as const },
  { href: "/portal/notifications", label: "Notifications", key: "unreadNotifications" as const },
  { href: "/portal/services", label: "Subscriptions", key: "activeSubscriptions" as const },
];

const quick = [
  { href: "/products", label: "Marketplace", hint: "Browse & buy" },
  { href: "/portal/cart", label: "Cart", hint: "Checkout" },
  { href: "/portal/orders", label: "Orders", hint: "Track purchases" },
  { href: "/portal/invoices", label: "Pay invoice", hint: "Bank transfer" },
  { href: "/domains", label: "Search domains", hint: "Register via providers" },
  { href: "/hosting", label: "Hosting advisor", hint: "AI recommend" },
  { href: "/portal/tickets", label: "New ticket", hint: "Get support" },
  { href: "/portal/settings", label: "Profile", hint: "Account settings" },
];

export function PortalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/dashboard")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load dashboard");
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading your workspace…</p>;
  if (error || !data) return <p className="text-sm text-red-400">{error || "Unavailable"}</p>;

  const firstName = data.profile.fullName?.split(" ")[0] || "Customer";
  const serviceRows = [
    ...data.activeServices.domains.slice(0, 3).map((d) => ({
      id: d.id,
      text: `Domain · ${d.name}.${d.tld} · ${d.status}`,
    })),
    ...data.activeServices.hosting.slice(0, 3).map((h) => ({
      id: h.id,
      text: `Hosting · ${h.label} · ${h.status}`,
    })),
    ...data.activeServices.subscriptions.slice(0, 2).map((s) => ({
      id: s.id,
      text: `Sub · ${s.productName}`,
    })),
  ];
  const unread = data.notifications.filter((n) => !n.readAt).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="stitch-card border-[#7c3aed]/40 bg-gradient-to-br from-[#7c3aed]/15 via-transparent to-[#2e2ebe]/10 !p-6 sm:!p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Welcome, {firstName}</h1>
            <p className="mt-2 text-[#ccc3d8] max-w-xl">
              Your self-service workspace — services, billing, support, and renewals in one place.
            </p>
            {data.profile.customerCode && (
              <p className="mt-3 text-xs font-mono text-[#d2bbff]">
                Customer ID · {data.profile.customerCode}
              </p>
            )}
            {!data.profile.emailVerifiedAt && (
              <p className="mt-2 text-sm text-amber-400">
                Please verify your email to unlock all features.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-xl bg-[#7c3aed]">
              <Link href="/portal/invoices">Pay invoices</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl border-[#4a4455]">
              <Link href="/portal/settings">Edit profile</Link>
            </Button>
          </div>
        </div>
      </div>

      {data.announcements.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-white">Announcements</h2>
          {data.announcements.map((a) => (
            <div key={a.id} className="stitch-card !py-3 !px-4">
              <p className="font-medium text-sm text-white">{a.title}</p>
              <p className="text-sm text-[#ccc3d8] mt-1">{a.body}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {widgetLinks.map((w) => (
          <Link
            key={w.label}
            href={w.href}
            className="stitch-card stitch-card-hover !p-4"
          >
            <p className="text-xs font-mono text-[#958da1] uppercase">{w.label}</p>
            <p className="font-display text-2xl font-bold mt-1 text-white">{data.stats[w.key]}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold mb-4 text-white">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quick.map((c) => (
            <Link
              key={c.href + c.label}
              href={c.href}
              className="stitch-card stitch-card-hover !p-4"
            >
              <p className="font-display font-semibold text-white">{c.label}</p>
              <p className="text-sm text-[#ccc3d8] mt-1">{c.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        <ListPanel title="Recent orders" href="/portal/orders" empty="No orders yet.">
          {data.recentOrders.map((o) => (
            <li key={o.id} className="text-sm flex justify-between border-b border-white/5 py-2">
              <span className="font-mono text-accent">{o.orderNumber}</span>
              <span>
                {formatMoney(o.totalCents)} · {o.status}
              </span>
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Pending invoices" href="/portal/invoices" empty="No pending invoices.">
          {data.pendingInvoices.map((inv) => (
            <li key={inv.id} className="text-sm flex justify-between border-b border-white/5 py-2">
              <span className="font-mono text-accent">{inv.invoiceNumber}</span>
              <span>{formatMoney(inv.totalCents)}</span>
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Active services" href="/portal/services" empty="No active services yet.">
          {serviceRows.map((r) => (
            <li key={r.id} className="text-sm border-b border-white/5 py-2">
              {r.text}
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Open tickets" href="/portal/tickets" empty="No open tickets.">
          {data.openTickets.map((t) => (
            <li key={t.id} className="text-sm border-b border-white/5 py-2">
              <span className="font-mono text-accent">{t.ticketNumber}</span> · {t.subject}
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Renewals (30 days)" href="/portal/services" empty="No upcoming renewals.">
          {data.renewals.map((r, i) => (
            <li key={`${r.label}-${i}`} className="text-sm flex justify-between border-b border-white/5 py-2">
              <span>
                {r.type}: {r.label}
              </span>
              <span className="text-muted">
                {r.date ? new Date(r.date).toLocaleDateString() : "—"}
              </span>
            </li>
          ))}
        </ListPanel>

        <ListPanel
          title="Pending payments"
          href="/portal/invoices"
          empty="No payments awaiting verification."
        >
          {data.pendingPayments.map((p) => (
            <li key={p.id} className="text-sm border-b border-white/5 py-2">
              {p.invoice?.invoiceNumber || "Payment"} · {p.method} · {p.status} ·{" "}
              {formatMoney(p.amountCents)}
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Quotations" href="/contact" empty="No quotations yet.">
          {data.quotations.map((q) => (
            <li key={q.id} className="text-sm flex justify-between border-b border-white/5 py-2">
              <span className="font-mono text-accent">{q.quoteNumber}</span>
              <span>
                {formatMoney(q.totalCents)} · {q.status}
              </span>
            </li>
          ))}
        </ListPanel>

        <ListPanel title="Recent activity" href="/portal/notifications" empty="No activity yet.">
          {data.activities.map((a) => (
            <li key={a.id} className="text-sm border-b border-white/5 py-2">
              <span className="text-muted text-xs uppercase">{a.category}</span> · {a.title}
              <span className="text-muted text-xs ml-2">
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ListPanel>
      </div>

      {unread.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Unread notifications</h2>
          <ul className="space-y-2">
            {unread.map((n) => (
              <li key={n.id} className="rounded-lg border border-white/10 px-4 py-3 text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-muted mt-1">{n.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ListPanel({
  title,
  empty,
  href,
  children,
}: {
  title: string;
  empty: string;
  href: string;
  children: React.ReactNode;
}) {
  const count = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
        <Link href={href} className="text-xs text-[#d2bbff]">
          View all
        </Link>
      </div>
      {count === 0 ? (
        <p className="text-sm text-[#ccc3d8]">{empty}</p>
      ) : (
        <ul className="stitch-card !p-4 space-y-0">{children}</ul>
      )}
    </div>
  );
}
