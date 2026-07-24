"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

type Customer = {
  id: string;
  customerCode?: string | null;
  fullName: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  customerRating?: string | null;
  tagsJson?: string | null;
  parent?: { id: string; code?: string | null; name?: string } | null;
  children?: { id: string; code?: string | null; name?: string; email?: string }[];
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
  timeline?: { at: string; channel: string; title: string; body?: string }[];
};

export function AdminCustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (tag) params.set("tag", tag);
      if (rating) params.set("rating", rating);
      if (sort) params.set("sort", sort);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCustomers(data.customers ?? []);
      setSelected((prev) => prev || data.customers?.[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [q, tag, rating, sort]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/admin/customers/${selected}`)
      .then((r) => r.json())
      .then((d) => setDetail(d.customer ?? null))
      .catch(() => setDetail(null));
  }, [selected]);

  return (
    <div>
      <h1 className="rlk-welcome">Customers</h1>
      <p className="rlk-empty !mb-4">Database · hierarchy · 360 dashboard</p>
      {error ? <p className="rlk-login-error !mb-3">{error}</p> : null}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="rlk-input !w-auto min-w-[180px]"
          placeholder="Search name, email, code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="rlk-input !w-auto"
          placeholder="Tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <select className="rlk-input !w-auto" value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">All ratings</option>
          {["VIP", "GOOD", "AVERAGE", "AT_RISK"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className="rlk-input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {loading ? (
        <p className="rlk-empty">Loading…</p>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4">
          <section className="rlk-section rlk-section-accent-teal !mb-0">
            <div className="rlk-section-head">
              <h2>Customer list</h2>
              <span className="rlk-badge rlk-badge-hold">{customers.length}</span>
            </div>
            <div className="rlk-section-body !py-2 max-h-[560px] overflow-y-auto">
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`rlk-shortcut w-full text-left !flex-col !items-start ${
                    selected === c.id ? "!text-[#17a2b8]" : ""
                  }`}
                  onClick={() => setSelected(c.id)}
                >
                  <span className="font-medium">{c.fullName}</span>
                  <span className="text-[11px]" style={{ color: "var(--rlk-text-muted)" }}>
                    {c.customerCode || c.email} · {c.counts.orders} orders
                  </span>
                  {c.parent ? (
                    <span className="text-[10px]" style={{ color: "var(--rlk-teal)" }}>
                      Child of {c.parent.name || c.parent.code}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section className="rlk-section rlk-section-accent-green !mb-0">
            <div className="rlk-section-head">
              <h2>Customer dashboard</h2>
              <Link href="/admin/crm" className="rlk-link">
                Open CRM
              </Link>
            </div>
            <div className="rlk-section-body">
              {!detail ? (
                <p className="rlk-empty">Select a customer</p>
              ) : (
                <>
                  <p className="rlk-mono">{detail.customerCode}</p>
                  <p className="font-medium text-[16px]">{detail.fullName}</p>
                  <p className="rlk-empty">
                    {detail.email} · {detail.company || "—"}
                  </p>
                  <div className="rlk-stats !my-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{detail.services?.domains?.length ?? 0}</div>
                      <div className="rlk-stat-label">Domains</div>
                    </div>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{detail.financial?.openInvoices?.length ?? 0}</div>
                      <div className="rlk-stat-label">Open invoices</div>
                    </div>
                    <div className="rlk-stat">
                      <div className="rlk-stat-num">{detail.support?.tickets?.length ?? 0}</div>
                      <div className="rlk-stat-label">Tickets</div>
                    </div>
                  </div>
                  <h3 className="text-[13px] font-semibold mb-2">Recent activity</h3>
                  {(detail.timeline || []).slice(0, 12).map((t, i) => (
                    <div key={i} className="rlk-row !flex-col !items-start">
                      <span className="rlk-badge rlk-badge-hold">{t.channel}</span>
                      <span>
                        {t.title}
                        {t.body ? ` — ${t.body}` : ""}
                      </span>
                    </div>
                  ))}
                  {!detail.timeline?.length ? (
                    <p className="rlk-empty">No timeline events in 360 payload.</p>
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
