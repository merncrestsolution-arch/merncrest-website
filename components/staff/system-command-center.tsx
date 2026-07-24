"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import type { CommandCenterPayload } from "@/lib/dashboard/command-center";
import {
  DollarSign,
  CreditCard,
  UserPlus,
  Users,
  FolderKanban,
  Headphones,
  MessageSquare,
  Globe,
  Shield,
  Server,
  Activity,
  UserCheck,
  CheckSquare,
  CloudSun,
  Calendar,
  Zap,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

function KpiCard({
  href,
  icon: Icon,
  label,
  value,
  sub,
  alert,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
}) {
  const inner = (
    <div className={`stitch-stat-card stitch-stat-card-luminous h-full ${alert ? "!border-red-500/40" : ""}`}>
      <Icon className={`h-5 w-5 stitch-stat-icon ${alert ? "text-red-400" : ""}`} />
      {sub ? <div className="stitch-stat-trend">{sub}</div> : null}
      <div className={`stitch-stat-num ${alert ? "!text-red-400" : ""}`}>{value}</div>
      <div className="stitch-stat-label">{label}</div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function healthLabel(h: string) {
  if (h === "healthy") return { text: "All systems operational", class: "stitch-chip-success" };
  if (h === "maintenance") return { text: "Maintenance mode", class: "stitch-chip" };
  return { text: "Degraded performance", class: "stitch-chip" };
}

export function SystemCommandCenter({
  breadcrumb = "Dashboard > Command Center",
}: {
  breadcrumb?: string;
}) {
  const [data, setData] = useState<CommandCenterPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/command-center");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load command center");
      setData(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <p className="stitch-page-sub">Loading command center…</p>;
  if (error) return <p className="stitch-auth-error">{error}</p>;
  if (!data) return null;

  const { kpis, alerts, recentActivities, upcomingCalendar, quickActions } = data;
  const health = healthLabel(kpis.serverHealth);

  return (
    <div className="mb-8">
      <div className="stitch-breadcrumb">{breadcrumb}</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Command Center</h1>
          <p className="stitch-page-sub">Real-time KPI dashboard · System.merncrest.lk</p>
        </div>
        <div className="stitch-toolbar-actions flex-wrap">
          <span className={`stitch-chip ${health.class}`}>
            <Activity className="h-3 w-3" />
            {health.text}
          </span>
          <span className="stitch-chip stitch-chip-violet">
            <Server className="h-3 w-3" />
            DB {kpis.serverStatus}
          </span>
          <span className="stitch-chip">Refreshes every 60s</span>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="stitch-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KpiCard
          href="/staff/invoices"
          icon={DollarSign}
          label="Revenue today"
          value={formatMoney(kpis.todayRevenueCents, "LKR")}
          sub={`Month ${formatMoney(kpis.monthRevenueCents, "LKR")}`}
        />
        <KpiCard
          href="/staff/invoices"
          icon={CreditCard}
          label="Pending payments"
          value={kpis.pendingPayments}
          alert={kpis.pendingPayments > 0}
        />
        <KpiCard href="/admin/crm" icon={UserPlus} label="New leads today" value={kpis.newLeads} />
        <KpiCard href="/staff/clients" icon={Users} label="New clients today" value={kpis.newClients} />
        <KpiCard href="/admin/erp/projects" icon={FolderKanban} label="Active projects" value={kpis.activeProjects} />
        <KpiCard
          href="/staff/tickets"
          icon={Headphones}
          label="Open tickets"
          value={kpis.openTickets}
          alert={kpis.openTickets > 5}
        />
        <KpiCard
          href="/staff/live-chat"
          icon={MessageSquare}
          label="Live chats"
          value={kpis.liveChats}
          alert={kpis.liveChats > 0}
        />
        <KpiCard
          href="/portal/domains"
          icon={Globe}
          label="Domain expiry (30d)"
          value={kpis.domainExpiryAlerts}
          alert={kpis.domainExpiryAlerts > 0}
        />
        <KpiCard
          href="/portal/hosting"
          icon={Shield}
          label="SSL alerts"
          value={kpis.sslExpiryAlerts}
          alert={kpis.sslExpiryAlerts > 0}
        />
        <KpiCard
          href="/portal/hosting"
          icon={Server}
          label="Hosting expiry (30d)"
          value={kpis.hostingExpiryAlerts}
          alert={kpis.hostingExpiryAlerts > 0}
        />
        <KpiCard href="/staff/attendance" icon={UserCheck} label="Staff attendance" value={kpis.staffAttendanceToday} />
        <KpiCard href="/staff/tasks" icon={CheckSquare} label="Daily tasks" value={kpis.dailyTasks} />
      </div>

      <div className="stitch-bento">
        {/* Expiry alerts */}
        <section className="stitch-bento-6 stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <AlertTriangle className="inline h-4 w-4 mr-1 text-amber-400" />
              Expiry alerts
            </h3>
            <Link href="/admin/customers" className="stitch-btn-sm">
              View all
            </Link>
          </div>
          <div className="stitch-section-body">
            {alerts.length === 0 ? (
              <p className="stitch-page-sub">No domain, SSL, or hosting alerts in the next 30 days.</p>
            ) : (
              alerts.map((a) => (
                <div key={`${a.type}-${a.id}`} className="stitch-row">
                  <span>
                    <span className={`stitch-chip ${a.severity === "critical" ? "" : "stitch-chip-violet"} !text-[10px] !py-0.5`}>
                      {a.type}
                    </span>{" "}
                    {a.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--sp-muted)" }}>
                    {a.date ? new Date(a.date).toLocaleDateString() : a.type === "ssl" ? "SSL issue" : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Calendar widget */}
        <section className="stitch-bento-6 stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <Calendar className="inline h-4 w-4 mr-1" style={{ color: "var(--sp-primary)" }} />
              Upcoming calendar
            </h3>
            <Link href="/staff/calendar" className="stitch-btn-outline">
              Open calendar
            </Link>
          </div>
          <div className="stitch-section-body">
            {upcomingCalendar.length === 0 ? (
              <p className="stitch-page-sub">No upcoming events.</p>
            ) : (
              upcomingCalendar.map((ev) => (
                <div key={ev.id} className="stitch-row !flex-col !items-start gap-0.5">
                  <strong className="text-sm">{ev.title}</strong>
                  <span className="text-xs" style={{ color: "var(--sp-muted)" }}>
                    {new Date(ev.startsAt).toLocaleString()} · {ev.kind}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent activities */}
        <section className="stitch-bento-8 stitch-section-card">
          <div className="stitch-section-head">
            <h3>Recent activities</h3>
            <Link href="/admin/erp/audit" className="stitch-btn-sm">
              Audit logs
            </Link>
          </div>
          <div className="stitch-section-body max-h-64 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="stitch-page-sub">No recent activity.</p>
            ) : (
              recentActivities.map((a) => (
                <div key={a.id} className="stitch-row !flex-col !items-start gap-0.5">
                  <span className="text-sm">
                    <span className="font-mono text-xs" style={{ color: "var(--stitch-primary-glow)" }}>
                      {a.module}
                    </span>{" "}
                    · {a.summary || a.action}
                  </span>
                  <span className="text-xs" style={{ color: "var(--sp-muted)" }}>
                    {a.actorName || "System"} · {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Weather + quick actions */}
        <section className="stitch-bento-4 stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <CloudSun className="inline h-4 w-4 mr-1" style={{ color: "var(--sp-primary)" }} />
              Quick actions
            </h3>
          </div>
          <div className="stitch-section-body">
            <div className="rounded-lg border border-[var(--sp-outline)] p-3 mb-3 text-center" style={{ background: "var(--stitch-surface-low)" }}>
              <CloudSun className="h-8 w-8 mx-auto mb-1" style={{ color: "var(--stitch-primary-glow)" }} />
              <p className="text-sm font-medium">Colombo, LK</p>
              <p className="text-xs" style={{ color: "var(--sp-muted)" }}>
                Weather widget — connect API in settings
              </p>
            </div>
            <div className="stitch-quick-grid">
              {quickActions.slice(0, 6).map((q) => (
                <Link key={q.href + q.label} href={q.href} className="stitch-quick-action">
                  <Zap className="h-4 w-4" />
                  {q.label}
                  <ArrowRight className="h-3 w-3 opacity-50" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
