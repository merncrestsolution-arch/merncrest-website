"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Server,
  Shield,
  Star,
  Ticket,
  User,
} from "lucide-react";

type DiagnosticIssue = {
  id: string;
  label: string;
  category: string;
  likelihood: string;
  reply: string;
};

type SupportContext = {
  sessionId: string;
  isKnownCustomer: boolean;
  identification: { confidence: string; identifiedBy: string[] };
  lead: {
    fullName: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    stage: string;
  } | null;
  customer: {
    id: string;
    customerCode: string | null;
    fullName: string;
    company: string | null;
    email: string;
    phone: string | null;
    customerSince: string;
    accountStatus: string;
    accountManager: string | null;
    preferredLanguage: string | null;
    priorityStars: number;
    previousComplaints: number;
    isVip: boolean;
    staffNotes: string | null;
    services: {
      domains: { id: string; name: string; status: string; expiresAt: string | null; alert: string }[];
      hosting: { id: string; label: string; status: string; renewsAt: string | null; sslStatus: string; alert: string }[];
      ssl: { status: string; alert: string }[];
      email: { count: number; status: string };
      website: { status: string } | null;
      erp: { version: string | null; status: string } | null;
      amc: { status: string } | null;
    };
    billing: {
      paidCount: number;
      pendingCount: number;
      overdueCount: number;
      lastPaymentCents: number | null;
      lastPaymentCurrency: string;
      nextRenewal: string | null;
      nextRenewalLabel: string | null;
    };
    support: { openTickets: number };
  } | null;
  diagnostics: DiagnosticIssue[];
  timeline: { id: string; at: string; type: string; label: string; detail?: string }[];
};

function formatMoney(cents: number | null, currency = "LKR") {
  if (cents == null) return "—";
  return `${currency} ${(cents / 100).toLocaleString()}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function alertClass(alert: string) {
  if (alert === "danger") return "danger";
  if (alert === "warning") return "warning";
  return "";
}

function statusDot(status: string) {
  if (status === "active" || status === "ACTIVE") return "active";
  if (status === "suspended" || status === "SUSPENDED" || status === "at_risk") return "danger";
  return "warning";
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  ta: "Tamil",
  si: "Sinhala",
};

type Props = {
  sessionId: string | null;
  onInsertReply?: (text: string) => void;
  onCreateTicket?: () => void;
  onRenewalSent?: () => void;
  busy?: boolean;
};

export function SmartSupportContextPanel({
  sessionId,
  onInsertReply,
  onCreateTicket,
  onRenewalSent,
  busy,
}: Props) {
  const [ctx, setCtx] = useState<SupportContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [renewing, setRenewing] = useState<string | null>(null);
  const [renewToast, setRenewToast] = useState<string | null>(null);

  const loadContext = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/chat/inbox/${id}/context`);
      const data = await res.json();
      if (res.ok) setCtx(data.context);
      else setCtx(null);
    } catch {
      setCtx(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setCtx(null);
      return;
    }
    loadContext(sessionId);
    const t = setInterval(() => loadContext(sessionId), 8000);
    return () => clearInterval(t);
  }, [sessionId, loadContext]);

  async function sendRenewal(
    type: "domain" | "hosting" | "ssl",
    serviceId: string,
    label: string
  ) {
    if (!sessionId || renewing) return;
    const key = `${type}:${serviceId}`;
    setRenewing(key);
    try {
      const res = await fetch("/api/staff/renewals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, serviceId, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Renewal failed");
      setRenewToast(`Renewal link sent for ${label}`);
      setTimeout(() => setRenewToast(null), 4000);
      onRenewalSent?.();
      if (sessionId) loadContext(sessionId);
    } catch (e) {
      setRenewToast(e instanceof Error ? e.message : "Renewal failed");
      setTimeout(() => setRenewToast(null), 5000);
    } finally {
      setRenewing(null);
    }
  }

  if (!sessionId) {
    return (
      <aside className="side-chat-context">
        <div className="side-chat-context-empty">
          <User className="h-8 w-8 opacity-30" />
          <p>Select a chat to view customer context</p>
        </div>
      </aside>
    );
  }

  if (loading && !ctx) {
    return (
      <aside className="side-chat-context">
        <div className="side-chat-context-empty">
          <p>Detecting customer…</p>
        </div>
      </aside>
    );
  }

  const c = ctx?.customer;
  const lead = ctx?.lead;
  const displayName = c?.fullName || lead?.fullName || "Unknown visitor";
  const displayCompany = c?.company || lead?.company;
  const displayEmail = c?.email || lead?.email;
  const displayPhone = c?.phone || lead?.phone;

  return (
    <aside className="side-chat-context">
      {renewToast ? <div className="side-chat-ctx-toast">{renewToast}</div> : null}
      <div className="side-chat-context-scroll">
        {/* Customer Information */}
        <section className="side-chat-ctx-block">
          <h3>Customer Information</h3>
          {ctx?.isKnownCustomer ? (
            <span className="side-chat-ctx-badge known">Identified</span>
          ) : (
            <span className="side-chat-ctx-badge unknown">Visitor</span>
          )}
          <div className="side-chat-ctx-rows">
            {displayCompany && (
              <div className="side-chat-ctx-row">
                <Building2 className="h-3.5 w-3.5" />
                <span>{displayCompany}</span>
              </div>
            )}
            <div className="side-chat-ctx-row">
              <User className="h-3.5 w-3.5" />
              <span>{displayName}</span>
            </div>
            {displayEmail && (
              <div className="side-chat-ctx-row">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${displayEmail}`} className="side-chat-ctx-link">
                  {displayEmail}
                </a>
              </div>
            )}
            {displayPhone && (
              <div className="side-chat-ctx-row">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${displayPhone}`} className="side-chat-ctx-link">
                  {displayPhone}
                </a>
              </div>
            )}
            {c?.customerCode && (
              <div className="side-chat-ctx-row muted">
                <span>ID: {c.customerCode}</span>
              </div>
            )}
          </div>

          {c && (
            <>
              <div className="side-chat-ctx-divider" />
              <div className="side-chat-ctx-meta-grid">
                <div>
                  <span className="label">Customer since</span>
                  <span>{formatDate(c.customerSince)}</span>
                </div>
                <div>
                  <span className="label">Account status</span>
                  <span className={`side-chat-status-pill ${statusDot(c.accountStatus)}`}>
                    {c.accountStatus === "active" ? "Active" : c.accountStatus}
                  </span>
                </div>
                {c.accountManager && (
                  <div className="col-span-2">
                    <span className="label">Account manager</span>
                    <span>{c.accountManager}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Active Services */}
        {c && (
          <section className="side-chat-ctx-block">
            <h3>Active Services</h3>
            {c.services.domains.length > 0 && (
              <div className="side-chat-ctx-service">
                <div className="side-chat-ctx-service-head">
                  <Globe className="h-3.5 w-3.5" /> Domains
                </div>
                {c.services.domains.map((d) => (
                  <div key={d.id} className={`side-chat-ctx-service-item ${alertClass(d.alert)}`}>
                    <span>
                      ✔ {d.name}
                      {d.expiresAt && (
                        <span className="expires">Expires {formatDate(d.expiresAt)}</span>
                      )}
                    </span>
                    {(d.alert === "warning" || d.alert === "danger") && (
                      <button
                        type="button"
                        className="side-chat-ctx-renew-btn"
                        disabled={Boolean(renewing) || busy}
                        onClick={() => sendRenewal("domain", d.id, d.name)}
                      >
                        <RefreshCw className={`h-3 w-3 ${renewing === `domain:${d.id}` ? "animate-spin" : ""}`} />
                        Renew
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {c.services.hosting.length > 0 && (
              <div className="side-chat-ctx-service">
                <div className="side-chat-ctx-service-head">
                  <Server className="h-3.5 w-3.5" /> Hosting
                </div>
                {c.services.hosting.map((h) => (
                  <div key={h.id} className={`side-chat-ctx-service-item ${alertClass(h.alert)}`}>
                    <span>
                      ✔ {h.label}
                      {h.renewsAt && (
                        <span className="expires">Expires {formatDate(h.renewsAt)}</span>
                      )}
                    </span>
                    {(h.alert === "warning" || h.alert === "danger") && (
                      <button
                        type="button"
                        className="side-chat-ctx-renew-btn"
                        disabled={Boolean(renewing) || busy}
                        onClick={() => sendRenewal("hosting", h.id, h.label)}
                      >
                        <RefreshCw className={`h-3 w-3 ${renewing === `hosting:${h.id}` ? "animate-spin" : ""}`} />
                        Renew
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {c.services.ssl.length > 0 && (
              <div className="side-chat-ctx-service">
                <div className="side-chat-ctx-service-head">
                  <Shield className="h-3.5 w-3.5" /> SSL Certificate
                </div>
                {c.services.ssl.map((s, i) => {
                  const hosting = c.services.hosting[i];
                  return (
                    <div key={i} className={`side-chat-ctx-service-item ${alertClass(s.alert)}`}>
                      <span>
                        {/active|valid|ok/i.test(s.status) ? "✔ Active" : `⚠ ${s.status}`}
                      </span>
                      {s.alert !== "ok" && hosting && (
                        <button
                          type="button"
                          className="side-chat-ctx-renew-btn"
                          disabled={Boolean(renewing) || busy}
                          onClick={() => sendRenewal("ssl", hosting.id, `SSL · ${hosting.label}`)}
                        >
                          <RefreshCw className={`h-3 w-3 ${renewing === `ssl:${hosting.id}` ? "animate-spin" : ""}`} />
                          Renew SSL
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {c.services.email.count > 0 && (
              <div className="side-chat-ctx-service">
                <div className="side-chat-ctx-service-head">
                  <Mail className="h-3.5 w-3.5" /> Business Email
                </div>
                <div className="side-chat-ctx-service-item">
                  {c.services.email.count} account{c.services.email.count !== 1 ? "s" : ""}
                </div>
              </div>
            )}
            {c.services.website && (
              <div className="side-chat-ctx-service">
                <div className="side-chat-ctx-service-head">💻 Website</div>
                <div className="side-chat-ctx-service-item">✔ {c.services.website.status}</div>
              </div>
            )}
            {c.services.erp && (
              <div className="side-chat-ctx-service">
                <div className="side-chat-ctx-service-head">📦 ERP System</div>
                <div className="side-chat-ctx-service-item">
                  {c.services.erp.version || "Active"} · {c.services.erp.status}
                </div>
              </div>
            )}
            {c.services.amc && (
              <div className="side-chat-ctx-service">
                <div className="side-chat-ctx-service-head">🛠 AMC / Support</div>
                <div className="side-chat-ctx-service-item">✔ {c.services.amc.status}</div>
              </div>
            )}
            {!c.services.domains.length &&
              !c.services.hosting.length &&
              !c.services.email.count && (
                <p className="side-chat-ctx-muted">No active services on record.</p>
              )}
          </section>
        )}

        {/* Billing Summary */}
        {c && (
          <section className="side-chat-ctx-block">
            <h3>Billing Summary</h3>
            <div className="side-chat-ctx-billing-grid">
              <div>
                <span className="num paid">{c.billing.paidCount}</span>
                <span className="lbl">Paid</span>
              </div>
              <div>
                <span className="num pending">{c.billing.pendingCount}</span>
                <span className="lbl">Pending</span>
              </div>
              <div>
                <span className={`num ${c.billing.overdueCount > 0 ? "overdue" : ""}`}>
                  {c.billing.overdueCount}
                </span>
                <span className="lbl">Overdue</span>
              </div>
            </div>
            <div className="side-chat-ctx-divider" />
            <div className="side-chat-ctx-meta-grid">
              <div>
                <span className="label">Last payment</span>
                <span>{formatMoney(c.billing.lastPaymentCents, c.billing.lastPaymentCurrency)}</span>
              </div>
              <div>
                <span className="label">Next renewal</span>
                <span>
                  {formatDate(c.billing.nextRenewal)}
                  {c.billing.nextRenewalLabel && (
                    <span className="side-chat-ctx-muted"> · {c.billing.nextRenewalLabel}</span>
                  )}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* AI Diagnostics */}
        {ctx && ctx.diagnostics.length > 0 && (
          <section className="side-chat-ctx-block">
            <h3>AI Quick Reply</h3>
            <p className="side-chat-ctx-muted">Possible issues detected</p>
            <div className="side-chat-ctx-diagnostics">
              {ctx.diagnostics.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="side-chat-ctx-diagnostic"
                  disabled={busy}
                  onClick={() => onInsertReply?.(d.reply)}
                  title={d.reply}
                >
                  <span className="diag-label">✓ {d.label}</span>
                  <span className="diag-reply">{d.reply.slice(0, 72)}…</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Staff Notes */}
        {c && (
          <section className="side-chat-ctx-block">
            <h3>Internal Notes</h3>
            <div className="side-chat-ctx-notes">
              <div className="side-chat-ctx-note-row">
                <span>Priority</span>
                <span className="stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < c.priorityStars ? "filled" : ""}`}
                    />
                  ))}
                </span>
              </div>
              <div className="side-chat-ctx-note-row">
                <span>Previous complaints</span>
                <span>{c.previousComplaints}</span>
              </div>
              <div className="side-chat-ctx-note-row">
                <span>Preferred language</span>
                <span>{LANG_LABELS[c.preferredLanguage || "en"] || c.preferredLanguage}</span>
              </div>
              {c.isVip && <div className="side-chat-ctx-vip">⭐ VIP Customer</div>}
              {c.staffNotes && <p className="side-chat-ctx-staff-note">{c.staffNotes}</p>}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="side-chat-ctx-block">
          <h3>Quick Actions</h3>
          <div className="side-chat-ctx-actions">
            {displayEmail && (
              <a href={`mailto:${displayEmail}`} className="side-chat-ctx-action">
                <Mail className="h-3 w-3" /> Email
              </a>
            )}
            {displayPhone && (
              <a
                href={`https://wa.me/${displayPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="side-chat-ctx-action"
              >
                <MessageSquare className="h-3 w-3" /> WhatsApp
              </a>
            )}
            {displayPhone && (
              <a href={`tel:${displayPhone}`} className="side-chat-ctx-action">
                <Phone className="h-3 w-3" /> Call
              </a>
            )}
            <button
              type="button"
              className="side-chat-ctx-action"
              disabled={busy}
              onClick={onCreateTicket}
            >
              <Ticket className="h-3 w-3" /> Ticket
            </button>
            {c && (
              <a
                href={`/admin/customers?highlight=${c.id}`}
                className="side-chat-ctx-action"
                target="_blank"
                rel="noopener noreferrer"
              >
                <CreditCard className="h-3 w-3" /> View 360
              </a>
            )}
          </div>
        </section>

        {/* Chat Timeline */}
        {ctx && ctx.timeline.length > 0 && (
          <section className="side-chat-ctx-block">
            <h3>Chat Timeline</h3>
            <div className="side-chat-ctx-timeline">
              {ctx.timeline.map((ev) => (
                <div key={ev.id} className={`side-chat-ctx-tl-item ${ev.type}`}>
                  <span className="tl-time">
                    {new Date(ev.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="tl-label">{ev.label}</span>
                  {ev.detail && <span className="tl-detail">{ev.detail}</span>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
