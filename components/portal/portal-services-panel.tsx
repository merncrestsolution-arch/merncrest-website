"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { Button } from "@/components/ui/button";

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
  projects: { id: string; projectCode: string; name: string; status: string }[];
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

  if (loading) return <p className="text-sm text-muted">Loading services…</p>;
  if (error || !data) return <p className="text-sm text-red-400">{error || "Unavailable"}</p>;

  const empty =
    data.domains.length +
      data.hosting.length +
      data.subscriptions.length +
      data.projects.length ===
    0;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        All purchased services appear here automatically after payment verification and provider
        activation.
      </p>

      {empty && (
        <div className="rounded-xl border border-white/10 p-6 text-sm text-muted">
          No services yet.{" "}
          <Link href="/products" className="text-accent">
            Browse the marketplace
          </Link>{" "}
          or{" "}
          <Link href="/hosting" className="text-accent">
            get an AI hosting recommendation
          </Link>
          .
        </div>
      )}

      <ServiceBlock title="Domains" actionHref="/portal/domains" actionLabel="Manage DNS">
        {data.domains.map((d) => (
          <li key={d.id} className="text-sm flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
            <span>
              {d.name}.{d.tld} · {d.status}
            </span>
            <span className="text-muted text-xs">
              Expires {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}
            </span>
          </li>
        ))}
      </ServiceBlock>

      <ServiceBlock title="Hosting / Cloud / VPS" actionHref="/portal/hosting" actionLabel="Usage & panel">
        {data.hosting.map((h) => (
          <li key={h.id} className="text-sm border-b border-white/5 py-2 space-y-1">
            <div className="flex flex-wrap justify-between gap-2">
              <span>
                {h.label} · {h.status}
              </span>
              {h.panelUrl && (
                <a
                  href={h.panelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-xs"
                >
                  Provider panel
                </a>
              )}
            </div>
            <p className="text-xs text-muted">
              Plan {h.planCode}
              {h.renewsAt ? ` · Renews ${new Date(h.renewsAt).toLocaleDateString()}` : ""}
            </p>
            <div className="flex gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link href="/portal/invoices">Renew / bill</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/hosting">Upgrade options</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/portal/tickets">Support</Link>
              </Button>
            </div>
          </li>
        ))}
      </ServiceBlock>

      <ServiceBlock title="Software & subscriptions" actionHref="/products" actionLabel="Browse more">
        {data.subscriptions.map((s) => (
          <li key={s.id} className="text-sm flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
            <span>
              {s.productName} · {s.status} · {s.billingPeriod}
            </span>
            <span>
              {formatMoney(s.amountCents)}
              {s.nextBillingAt
                ? ` · next ${new Date(s.nextBillingAt).toLocaleDateString()}`
                : ""}
            </span>
          </li>
        ))}
      </ServiceBlock>

      <ServiceBlock title="Projects" actionHref="/contact" actionLabel="Talk to sales">
        {data.projects.map((p) => (
          <li key={p.id} className="text-sm border-b border-white/5 py-2">
            {p.projectCode} · {p.name} · {p.status}
          </li>
        ))}
      </ServiceBlock>
    </div>
  );
}

function ServiceBlock({
  title,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  const count = Array.isArray(children) ? children.length : 0;
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <Link href={actionHref} className="text-xs text-accent">
          {actionLabel}
        </Link>
      </div>
      {count === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <ul className="rounded-xl border border-white/10 bg-white/[0.02] px-4">{children}</ul>
      )}
    </section>
  );
}
