"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import type { CloudDashboardPayload } from "@/lib/cloud/aws-dashboard";
import {
  Cloud,
  Server,
  Globe,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function statusChip(status: string) {
  const s = status.toUpperCase();
  if (["ACTIVE", "RUNNING", "ONLINE", "UP"].includes(s)) return "stitch-chip stitch-chip-success";
  if (["MAINTENANCE", "PENDING", "PROVISIONING"].includes(s)) return "stitch-chip stitch-chip-violet";
  return "stitch-chip";
}

export function StaffCloudPanel() {
  const [data, setData] = useState<CloudDashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/cloud");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load cloud dashboard");
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
    const t = setInterval(load, 120_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <p className="stitch-page-sub">Loading AWS cloud dashboard…</p>;
  if (error) return <p className="stitch-auth-error">{error}</p>;
  if (!data) return null;

  const { account, summary, services, resources, costNotes } = data;

  return (
    <div>
      <div className="stitch-page-head">
        <div>
          <div className="stitch-breadcrumb">Infrastructure &gt; AWS Cloud</div>
          <h1 className="stitch-page-title">AWS Cloud Infrastructure</h1>
          <p className="stitch-page-sub">
            {account.label} · {account.region}
            {account.accountId ? ` · ${account.accountId}` : ""}
            {!account.configured ? " · demo / DB-synced view" : " · API connected"}
          </p>
        </div>
        <div className="stitch-toolbar-actions">
          <button type="button" className="stitch-btn-sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Link href="/staff/monitoring" className="stitch-btn-primary-sm">
            Monitoring
          </Link>
        </div>
      </div>

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card stitch-stat-card-luminous">
          <Cloud className="h-5 w-5 stitch-stat-icon" />
          <div className="stitch-stat-num">{summary.totalResources}</div>
          <div className="stitch-stat-label">Total resources</div>
        </div>
        <div className="stitch-stat-card stitch-stat-card-luminous">
          <CheckCircle2 className="h-5 w-5 stitch-stat-icon text-emerald-400" />
          <div className="stitch-stat-num">{summary.running}</div>
          <div className="stitch-stat-label">Running / active</div>
        </div>
        <div className="stitch-stat-card stitch-stat-card-luminous">
          <AlertTriangle className={`h-5 w-5 stitch-stat-icon ${summary.alerts ? "text-amber-400" : ""}`} />
          <div className="stitch-stat-num">{summary.alerts}</div>
          <div className="stitch-stat-label">Alerts</div>
        </div>
        <div className="stitch-stat-card stitch-stat-card-luminous">
          <Server className="h-5 w-5 stitch-stat-icon" />
          <div className="stitch-stat-num">{services.lightsail + services.ec2}</div>
          <div className="stitch-stat-label">Compute instances</div>
        </div>
        <div className="stitch-stat-card stitch-stat-card-luminous">
          <Globe className="h-5 w-5 stitch-stat-icon" />
          <div className="stitch-stat-num">{services.domains}</div>
          <div className="stitch-stat-label">Domains</div>
        </div>
        <div className="stitch-stat-card stitch-stat-card-luminous">
          <HardDrive className="h-5 w-5 stitch-stat-icon" />
          <div className="stitch-stat-num">{services.hosting}</div>
          <div className="stitch-stat-label">Hosting accounts</div>
        </div>
      </div>

      <div className="stitch-bento stitch-bento-6 mb-6">
        <section className="stitch-section-card col-span-2">
          <div className="stitch-section-head">
            <h3>Service breakdown</h3>
          </div>
          <div className="stitch-section-body space-y-2 text-sm">
            <div className="stitch-row">
              <span>Lightsail</span>
              <span>{services.lightsail}</span>
            </div>
            <div className="stitch-row">
              <span>EC2 / providers</span>
              <span>{services.ec2}</span>
            </div>
            <div className="stitch-row">
              <span>Route 53</span>
              <span>{services.route53}</span>
            </div>
            <div className="stitch-row">
              <span>S3</span>
              <span>{services.s3}</span>
            </div>
            <div className="stitch-row">
              <span>RDS</span>
              <span>{services.rds}</span>
            </div>
          </div>
        </section>

        <section className="stitch-section-card col-span-4">
          <div className="stitch-section-head">
            <h3>Notes</h3>
          </div>
          <div className="stitch-section-body">
            <ul className="text-sm space-y-2" style={{ color: "var(--sp-muted)" }}>
              {costNotes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
            <p className="text-xs mt-4" style={{ color: "var(--sp-muted)" }}>
              Last sync: {new Date(account.lastSyncAt).toLocaleString()}
            </p>
          </div>
        </section>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Resource inventory</h3>
          <Link href="/admin/domains" className="stitch-btn-sm">
            Domain admin
          </Link>
        </div>
        <div className="stitch-section-body">
          {resources.length === 0 ? (
            <p className="stitch-page-sub">No cloud resources on record.</p>
          ) : (
            resources.map((r) => (
              <div key={r.id} className="stitch-row">
                <span>
                  <strong>{r.name}</strong>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--sp-muted)" }}>
                    {r.type} · {r.region}
                    {r.detail ? ` · ${r.detail}` : ""}
                  </span>
                </span>
                {r.href ? (
                  <Link href={r.href} className={statusChip(r.status)}>
                    {r.status}
                  </Link>
                ) : (
                  <span className={statusChip(r.status)}>{r.status}</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
