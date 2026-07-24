"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { Server, Globe, Mail, CreditCard } from "lucide-react";

type DashboardData = {
  profile: {
    fullName?: string;
    customerCode?: string | null;
  };
  stats: {
    domains: number;
    hosting: number;
    openTickets: number;
    pendingInvoices: number;
  };
  pendingInvoices: { id: string; invoiceNumber: string; status: string; totalCents: number }[];
  activeServices: {
    domains: { id: string; name: string; tld: string; status: string }[];
    hosting: { id: string; label: string; status: string }[];
    subscriptions: { id: string; productName: string; status: string }[];
  };
  projects: { id: string; projectCode: string; name: string; status: string; progressPct: number }[];
  openTickets: { id: string; ticketNumber: string; subject: string; status: string }[];
  announcements: { id: string; title: string; body: string }[];
};

export function PortalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/dashboard")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[#999]">Loading your workspace…</p>;
  if (error || !data) return <p className="stitch-auth-error">{error || "Unavailable"}</p>;

  const firstName = data.profile.fullName?.split(" ")[0] || "Customer";
  const servicesCount =
    data.activeServices.domains.length +
    data.activeServices.hosting.length +
    data.activeServices.subscriptions.length +
    (data.projects?.length || 0);

  return (
    <div>
      <h2 className="stitch-page-title">Welcome back, {firstName}</h2>
      <p className="stitch-page-sub">
        {data.profile.customerCode
          ? `Customer ID · ${data.profile.customerCode}`
          : "Your MernCrest customer workspace"}
      </p>

      <div className="stitch-stat-grid">
        <Link href="/portal/services" className="stitch-stat-card">
          <Server className="h-5 w-5 text-violet-600 mb-2" />
          <div className="stitch-stat-num">{servicesCount}</div>
          <div className="stitch-stat-label">Active services</div>
        </Link>
        <Link href="/portal/domains" className="stitch-stat-card">
          <Globe className="h-5 w-5 text-violet-600 mb-2" />
          <div className="stitch-stat-num">{data.stats.domains}</div>
          <div className="stitch-stat-label">Domains</div>
        </Link>
        <Link href="/portal/tickets" className="stitch-stat-card">
          <Mail className="h-5 w-5 text-violet-600 mb-2" />
          <div className="stitch-stat-num">{data.stats.openTickets}</div>
          <div className="stitch-stat-label">Open tickets</div>
        </Link>
        <Link href="/portal/invoices" className="stitch-stat-card">
          <CreditCard className="h-5 w-5 text-violet-600 mb-2" />
          <div className="stitch-stat-num">{data.stats.pendingInvoices}</div>
          <div className="stitch-stat-label">Pending invoices</div>
        </Link>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Your active services</h3>
          <Link href="/portal/services" className="stitch-btn-sm">
            View all
          </Link>
        </div>
        <div className="stitch-section-body">
          {servicesCount === 0 ? (
            <p className="text-sm text-[#999] py-2">
              No services yet.{" "}
              <Link href="/hosting" className="text-violet-600 font-medium">
                Order hosting
              </Link>{" "}
              or{" "}
              <Link href="/domains" className="text-violet-600 font-medium">
                register a domain
              </Link>
              .
            </p>
          ) : (
            <>
              {data.activeServices.domains.slice(0, 3).map((d) => (
                <div key={d.id} className="stitch-row">
                  <span>
                    {d.name}.{d.tld}
                  </span>
                  <span className="stitch-badge">{d.status}</span>
                </div>
              ))}
              {data.activeServices.hosting.slice(0, 2).map((h) => (
                <div key={h.id} className="stitch-row">
                  <span>{h.label}</span>
                  <span className="stitch-badge">{h.status}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Recent support tickets</h3>
          <Link href="/portal/tickets" className="stitch-btn-sm">
            Open ticket
          </Link>
        </div>
        <div className="stitch-section-body">
          {data.openTickets.length === 0 ? (
            <p className="text-sm text-[#999] py-2">No open tickets.</p>
          ) : (
            data.openTickets.map((t) => (
              <div key={t.id} className="stitch-row">
                <span>
                  <span className="font-mono text-xs">{t.ticketNumber}</span> — {t.subject}
                </span>
                <span className="stitch-badge">{t.status}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Pending invoices</h3>
          <Link href="/portal/invoices" className="stitch-btn-outline">
            View billing
          </Link>
        </div>
        <div className="stitch-section-body">
          {data.pendingInvoices.length === 0 ? (
            <p className="text-sm text-[#999] py-2">No pending invoices.</p>
          ) : (
            data.pendingInvoices.map((inv) => (
              <div key={inv.id} className="stitch-row">
                <span className="font-mono text-xs">{inv.invoiceNumber}</span>
                <span>{formatMoney(inv.totalCents)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {data.announcements.length > 0 && (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Announcements</h3>
          </div>
          <div className="stitch-section-body">
            {data.announcements.map((a) => (
              <div key={a.id} className="stitch-row !flex-col !items-start gap-1">
                <strong className="text-sm">{a.title}</strong>
                <span className="text-sm text-[#666]">{a.body}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
