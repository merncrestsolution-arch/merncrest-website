"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import type { MonitoringDashboardPayload } from "@/lib/monitoring/dashboard";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Globe,
  RefreshCw,
  Server,
} from "lucide-react";

function overallChip(status: string) {
  if (status === "healthy") return "stitch-chip stitch-chip-success";
  if (status === "maintenance") return "stitch-chip stitch-chip-violet";
  return "stitch-chip";
}

function checkStatusClass(status: string) {
  if (status === "UP") return "stitch-chip stitch-chip-success";
  if (status === "MAINTENANCE") return "stitch-chip stitch-chip-violet";
  if (status === "DEGRADED") return "stitch-chip";
  return "stitch-chip !border-red-500/50 !text-red-300";
}

export function StaffMonitoringPanel({
  breadcrumb = "Infrastructure > Monitoring",
}: {
  breadcrumb?: string;
}) {
  const [data, setData] = useState<MonitoringDashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/monitoring");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load monitoring");
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

  if (loading) return <p className="stitch-page-sub">Loading monitoring dashboard…</p>;
  if (error) return <p className="stitch-auth-error">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <div className="stitch-page-head">
        <div>
          <div className="stitch-breadcrumb">{breadcrumb}</div>
          <h1 className="stitch-page-title">Server &amp; Website Monitoring</h1>
          <p className="stitch-page-sub">
            Uptime {data.uptimePercent}% · {data.server.platform}
          </p>
        </div>
        <div className="stitch-toolbar-actions">
          <span className={overallChip(data.overall)}>{data.overall}</span>
          <button type="button" className="stitch-btn-sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Link href="/staff/cloud" className="stitch-btn-primary-sm">
            AWS Cloud
          </Link>
        </div>
      </div>

      <div className="stitch-stat-grid mb-6">
        {data.server.metrics.map((m) => (
          <div key={m.label} className="stitch-stat-card stitch-stat-card-luminous">
            <Activity className="h-5 w-5 stitch-stat-icon" />
            <div className="stitch-stat-num">
              {m.value}
              {m.unit}
            </div>
            <div className="stitch-stat-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="stitch-dash-grid-2 mb-6">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Health checks</h3>
          </div>
          <div className="stitch-section-body">
            {data.checks.map((c) => (
              <div key={c.id} className="stitch-row">
                <span>
                  <strong>{c.name}</strong>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--sp-muted)" }}>
                    {c.kind} · {c.target}
                    {c.responseMs != null ? ` · ${c.responseMs}ms` : ""}
                  </span>
                </span>
                <span className={checkStatusClass(c.status)}>{c.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Incidents &amp; alerts</h3>
          </div>
          <div className="stitch-section-body">
            {data.incidents.length === 0 ? (
              <p className="stitch-page-sub flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                No active incidents
              </p>
            ) : (
              data.incidents.map((inc) => (
                <div key={inc.id} className="stitch-announcement-item">
                  <h4 className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    {inc.title}
                  </h4>
                  <p className="text-xs" style={{ color: "var(--sp-muted)" }}>
                    {inc.source} · {inc.severity}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="stitch-dash-grid-2">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <Server className="inline h-4 w-4 mr-1" />
              Containers / services
            </h3>
          </div>
          <div className="stitch-section-body">
            {data.server.containers.map((c) => (
              <div key={c.name} className="stitch-row">
                <span>{c.name}</span>
                <span className="stitch-chip stitch-chip-success">{c.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <Globe className="inline h-4 w-4 mr-1" />
              Website probes
            </h3>
          </div>
          <div className="stitch-section-body">
            {data.websites.map((w) => (
              <div key={w.url} className="stitch-row">
                <span className="text-sm truncate max-w-[200px]">{w.url}</span>
                <span className={w.status === "up" ? "stitch-chip stitch-chip-success" : "stitch-chip"}>
                  {w.status}
                  {w.responseMs != null ? ` · ${w.responseMs}ms` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
