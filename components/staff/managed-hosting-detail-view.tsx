"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { formatSriLankaDate, formatSriLankaDateTime } from "@/lib/timezone";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";

type HistoryEntry = {
  id: string;
  action: string;
  createdAt: string;
  createdBy: string;
};

type HostingDetail = {
  id: string;
  projectServiceId: string;
  packageName: string;
  diskQuotaMb: number;
  bandwidthQuotaMb: number;
  diskUsedMb: number;
  bandwidthUsedMb: number;
  serverLocation: string | null;
  hostingStatus: string;
  renewalDate: string | null;
  expiryDate: string | null;
  history?: HistoryEntry[];
  usage: {
    disk: { usedMb: number; quotaMb: number; percentage: number };
    bandwidth: { usedMb: number; quotaMb: number; percentage: number };
  };
};

type UsageData = {
  disk: { usedMb: number; quotaMb: number; percentage: number };
  bandwidth: { usedMb: number; quotaMb: number; percentage: number };
};

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  if (status === "EXPIRED" || status === "CANCELLED") return "destructive";
  return "secondary";
}

function UsageBar({
  label,
  usedMb,
  quotaMb,
  percentage,
}: {
  label: string;
  usedMb: number;
  quotaMb: number;
  percentage: number;
}) {
  const pct = Math.min(100, percentage);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-[var(--sp-muted)]">
          {usedMb.toLocaleString()} / {quotaMb.toLocaleString()} MB ({percentage}%)
        </span>
      </div>
      <div className="stitch-wave-progress">
        <div className="stitch-wave-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ManagedHostingDetailView({ hostingId }: { hostingId: string }) {
  const [data, setData] = useState<HostingDetail | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`/api/hosting/${hostingId}`).then((r) => r.json()),
      fetch(`/api/hosting/${hostingId}/usage`).then((r) => r.json()),
    ])
      .then(([detailRes, usageRes]) => {
        if (!detailRes.success) throw new Error(detailRes.error?.message ?? "Failed");
        setData(detailRes.data);
        if (usageRes.success) setUsage(usageRes.data);
        else setUsage(detailRes.data.usage);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [hostingId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ErrorState message="Hosting account not found" onRetry={load} />;

  const disk = usage?.disk ?? data.usage.disk;
  const bandwidth = usage?.bandwidth ?? data.usage.bandwidth;

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff/hosting">Hosting</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{data.packageName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title !mb-1">{data.packageName}</h1>
          <Badge variant={statusVariant(data.hostingStatus)}>
            {data.hostingStatus}
          </Badge>
        </div>
        <Link href="/staff/hosting" className="stitch-btn-outline-sm">
          <ArrowLeft className="h-4 w-4" />
          All hosting
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Resource usage</h3>
          </div>
          <div className="stitch-section-body space-y-5">
            <UsageBar
              label="Disk"
              usedMb={disk.usedMb}
              quotaMb={disk.quotaMb}
              percentage={disk.percentage}
            />
            <UsageBar
              label="Bandwidth"
              usedMb={bandwidth.usedMb}
              quotaMb={bandwidth.quotaMb}
              percentage={bandwidth.percentage}
            />
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Account details</h3>
          </div>
          <div className="stitch-section-body grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--sp-muted)]">Server location</span>
              <p className="font-medium">{data.serverLocation || "—"}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Renewal</span>
              <p className="font-medium">{formatSriLankaDate(data.renewalDate)}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Expires</span>
              <p className="font-medium">{formatSriLankaDate(data.expiryDate)}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Service ID</span>
              <p className="font-mono text-xs">{data.projectServiceId}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Activity history</h3>
        </div>
        <div className="stitch-section-body overflow-x-auto !p-0">
          <table className="stitch-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {(data.history ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-[var(--sp-muted)] py-8">
                    No history entries.
                  </td>
                </tr>
              ) : (
                (data.history ?? []).map((h) => (
                  <tr key={h.id}>
                    <td>{formatSriLankaDateTime(h.createdAt)}</td>
                    <td className="font-medium">{h.action.replace(/_/g, " ")}</td>
                    <td className="font-mono text-xs">{h.createdBy.slice(0, 8)}…</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
