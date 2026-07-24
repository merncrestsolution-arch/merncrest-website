"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";

type ServicesData = {
  domains: { id: string; name: string; tld: string; status: string; expiresAt: string | null }[];
  hosting: {
    id: string;
    label: string;
    planCode: string;
    status: string;
    renewsAt: string | null;
    panelUrl: string | null;
  }[];
  subscriptions: {
    id: string;
    productName: string;
    productSlug: string;
    status: string;
    billingPeriod: string;
    amountCents: number;
    nextBillingAt: string | null;
  }[];
  software: { id: string; productName: string; status: string; amountCents: number }[];
  projects: {
    id: string;
    projectCode: string;
    name: string;
    status: string;
    progressPct: number;
    milestonesDone: number;
    milestonesTotal: number;
  }[];
};

export function PortalServicesPanel() {
  const [data, setData] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portal/services")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="rlk-empty">Loading services…</p>;
  if (error || !data) return <p className="rlk-login-error">{error || "Unavailable"}</p>;

  const empty =
    data.domains.length +
      data.hosting.length +
      data.subscriptions.length +
      data.projects.length ===
    0;

  return (
    <div className="space-y-4">
      {empty && (
        <section className="rlk-section rlk-section-accent-gray">
          <div className="rlk-section-body">
            <p className="rlk-empty">
              No services yet.{" "}
              <Link href="/products" className="rlk-link">
                Browse the marketplace
              </Link>{" "}
              or{" "}
              <Link href="/hosting" className="rlk-link">
                get an AI hosting recommendation
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      <ServiceBlock title="Domains" actionHref="/portal/domains" actionLabel="Manage DNS" accent="teal">
        {data.domains.map((d) => (
          <div key={d.id} className="rlk-row">
            <span>
              {d.name}.{d.tld} · {d.status}
            </span>
            <span className="text-xs text-[#999]">
              Expires {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}
            </span>
          </div>
        ))}
      </ServiceBlock>

      <ServiceBlock
        title="Hosting / Cloud / VPS"
        actionHref="/portal/hosting"
        actionLabel="Usage & panel"
        accent="orange"
      >
        {data.hosting.map((h) => (
          <div key={h.id} className="rlk-row !flex-col !items-start gap-2">
            <div className="flex flex-wrap justify-between gap-2 w-full">
              <span>
                {h.label} · {h.status}
              </span>
              {h.panelUrl && (
                <a
                  href={h.panelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rlk-link text-xs"
                >
                  Provider panel
                </a>
              )}
            </div>
            <p className="text-xs text-[#999]">
              Plan {h.planCode}
              {h.renewsAt ? ` · Renews ${new Date(h.renewsAt).toLocaleDateString()}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/portal/invoices" className="rlk-btn-sm">
                Renew / bill
              </Link>
              <Link href="/hosting" className="rlk-btn-sm">
                Upgrade
              </Link>
              <Link href="/portal/tickets" className="rlk-btn-sm">
                Support
              </Link>
            </div>
          </div>
        ))}
      </ServiceBlock>

      <ServiceBlock title="Software & subscriptions" actionHref="/products" actionLabel="Browse more" accent="green">
        {data.subscriptions.map((s) => (
          <div key={s.id} className="rlk-row">
            <span>
              {s.productName} · {s.status} · {s.billingPeriod}
            </span>
            <span>
              {formatMoney(s.amountCents)}
              {s.nextBillingAt
                ? ` · next ${new Date(s.nextBillingAt).toLocaleDateString()}`
                : ""}
            </span>
          </div>
        ))}
      </ServiceBlock>

      <ServiceBlock title="Custom projects" actionHref="/portal/projects" actionLabel="Request & track" accent="gray">
        {data.projects.map((p) => (
          <div key={p.id} className="rlk-row !flex-col !items-start gap-1">
            <div className="flex flex-wrap justify-between gap-2 w-full">
              <span>
                {p.projectCode} · {p.name} · {p.status}
              </span>
              <span className="text-xs text-[#999]">{p.progressPct}% complete</span>
            </div>
            {p.milestonesTotal > 0 && (
              <p className="text-xs text-[#999]">
                Milestones {p.milestonesDone}/{p.milestonesTotal}
              </p>
            )}
          </div>
        ))}
      </ServiceBlock>
    </div>
  );
}

function ServiceBlock({
  title,
  actionHref,
  actionLabel,
  accent,
  children,
}: {
  title: string;
  actionHref: string;
  actionLabel: string;
  accent: "teal" | "orange" | "green" | "gray";
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className={`rlk-section rlk-section-accent-${accent}`}>
      <div className="rlk-section-head">
        <h2>{title}</h2>
        <Link href={actionHref} className="rlk-btn-green !w-auto !mt-0 !px-3 !py-2">
          {actionLabel}
        </Link>
      </div>
      <div className="rlk-section-body">
        {items.length === 0 ? <p className="rlk-empty">None yet.</p> : items}
      </div>
    </section>
  );
}
