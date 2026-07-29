"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Globe2, Loader2, Server, Shield } from "lucide-react";
import { formatMoney } from "@/lib/commerce-format";
import { formatSriLankaDate } from "@/lib/timezone";
import { PortalDnsChangeRequestForm } from "@/components/portal/portal-dns-change-request-form";

type HubData = {
  project: {
    id: string;
    name: string;
    projectCode: string;
    status: string;
    clientBrief?: string | null;
    nextSteps?: string | null;
    nextProcess?: string | null;
  };
  progress: { percent: number; completedMilestones: number; totalMilestones: number };
  milestones: Array<{ id: string; title: string; status: string; dueDate?: string | null }>;
  clientUpdates: Array<{ id: string; title: string; body: string; createdAt: string }>;
  domains: Array<{ id: string; label: string; domain: Record<string, unknown> | null }>;
  hosting: Array<{ id: string; label: string; hosting: Record<string, unknown> | null }>;
  billing: { invoicedCents: number; paidCents: number; balanceCents: number };
  invoices: Array<{ invoiceNumber: string; status: string; totalCents: number }>;
  renewals: Array<{ label: string; renewalDate: string | null }>;
  dnsSummary: { totalDomains: number; managedDomains: number; totalRecords: number };
  deployment: {
    method: string | null;
    lastDeployedAt: string | null;
    lastDeployedVersion: string | null;
    devUrl: string | null;
    productionUrl: string | null;
  } | null;
  git: {
    provider: string | null;
    url: string | null;
    defaultBranch: string | null;
    deploymentBranch: string | null;
    latestCommitSha: string | null;
    latestCommitMessage: string | null;
    latestCommitAt: string | null;
    repositoryStatus: string | null;
  } | null;
  documentation: { docsUrl: string | null; apiDocsUrl: string | null };
  activity: Array<{ id: string; title: string; body?: string; at: string }>;
};

export function PortalProjectHubView({ projectId }: { projectId: string }) {
  const [hub, setHub] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/portal/projects/${projectId}/hub`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setHub(d.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-sm text-muted flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading project…
      </p>
    );
  }

  if (error || !hub) {
    return (
      <div>
        <p className="text-red-400 text-sm mb-4">{error || "Project not found"}</p>
        <Link href="/portal/projects" className="rlk-btn rlk-btn-outline text-sm">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/portal/projects" className="rlk-link text-sm inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
          <h1 className="font-display text-2xl font-semibold">{hub.project.name}</h1>
          <p className="text-sm text-muted font-mono">{hub.project.projectCode}</p>
        </div>
        <span className="rlk-badge rlk-badge-open">{hub.project.status.replace("_", " ")}</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rlk-card p-4">
          <p className="text-2xl font-semibold">{hub.progress.percent}%</p>
          <p className="text-xs text-muted">Progress</p>
        </div>
        <div className="rlk-card p-4">
          <p className="text-2xl font-semibold">
            {hub.progress.completedMilestones}/{hub.progress.totalMilestones}
          </p>
          <p className="text-xs text-muted">Milestones</p>
        </div>
        <div className="rlk-card p-4">
          <p className="text-2xl font-semibold">{hub.domains.length}</p>
          <p className="text-xs text-muted">Domains</p>
        </div>
        <div className="rlk-card p-4">
          <p className="text-lg font-semibold">{formatMoney(hub.billing.paidCents)}</p>
          <p className="text-xs text-muted">Paid</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rlk-card p-5 space-y-3">
          <h2 className="font-display font-semibold">Development status</h2>
          {hub.project.nextProcess ? <p className="text-sm">{hub.project.nextProcess}</p> : null}
          {hub.project.nextSteps ? (
            <p className="text-sm text-muted whitespace-pre-wrap">{hub.project.nextSteps}</p>
          ) : null}
          <ul className="space-y-2 text-sm">
            {hub.milestones.map((m) => (
              <li key={m.id} className="flex justify-between gap-2">
                <span>{m.title}</span>
                <span className="text-muted">{m.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rlk-card p-5 space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Globe2 className="h-4 w-4" /> Connected domains
          </h2>
          {hub.domains.length === 0 ? (
            <p className="text-sm text-muted">No domains linked yet.</p>
          ) : (
            hub.domains.map((d) => (
              <div key={d.id} className="text-sm border border-white/10 rounded-lg p-3">
                <p className="font-mono font-medium">
                  {(d.domain?.domainName as string) ?? d.label}
                </p>
                {d.domain ? (
                  <p className="text-xs text-muted mt-1">
                    SSL: {(d.domain.sslCertificateStatus as string) ?? "—"} · Auto-renew:{" "}
                    {d.domain.autoRenew ? "Yes" : "No"}
                  </p>
                ) : null}
              </div>
            ))
          )}
          {hub.dnsSummary.managedDomains > 0 ? (
            <PortalDnsChangeRequestForm onSubmitted={load} />
          ) : null}
        </section>

        <section className="rlk-card p-5 space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Server className="h-4 w-4" /> Hosting
          </h2>
          {hub.hosting.length === 0 ? (
            <p className="text-sm text-muted">No hosting services linked.</p>
          ) : (
            hub.hosting.map((h) => (
              <div key={h.id} className="text-sm border border-white/10 rounded-lg p-3">
                <p className="font-medium">{(h.hosting?.packageName as string) ?? h.label}</p>
                {h.hosting ? (
                  <p className="text-xs text-muted mt-1">
                    Disk: {h.hosting.diskUsedMb as number}/{h.hosting.diskQuotaMb as number} MB ·
                    Uptime: {h.hosting.uptimePct as number}%
                  </p>
                ) : null}
              </div>
            ))
          )}
        </section>

        <section className="rlk-card p-5 space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" /> Billing & renewals
          </h2>
          <div className="text-sm space-y-1">
            <p>Outstanding: {formatMoney(hub.billing.balanceCents)}</p>
            <p className="text-muted">Invoiced: {formatMoney(hub.billing.invoicedCents)}</p>
          </div>
          {hub.renewals.slice(0, 5).map((r, i) => (
            <p key={i} className="text-xs text-muted">
              {r.label} — {r.renewalDate ? formatSriLankaDate(r.renewalDate) : "—"}
            </p>
          ))}
        </section>

        {hub.git ? (
          <section className="rlk-card p-5 space-y-3 lg:col-span-2">
            <h2 className="font-display font-semibold">Git repository (view only)</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <p>
                Provider: <strong>{hub.git.provider}</strong>
              </p>
              <p>
                Branch: <strong>{hub.git.defaultBranch ?? "—"}</strong>
              </p>
              <p className="sm:col-span-2 font-mono text-xs break-all">
                <a href={hub.git.url ?? "#"} target="_blank" rel="noopener noreferrer" className="rlk-link">
                  {hub.git.url}
                </a>
              </p>
              {hub.git.latestCommitSha ? (
                <p className="sm:col-span-2 text-muted">
                  Latest: {hub.git.latestCommitSha.slice(0, 7)} — {hub.git.latestCommitMessage}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {hub.deployment ? (
          <section className="rlk-card p-5 space-y-3 lg:col-span-2">
            <h2 className="font-display font-semibold">Deployment status</h2>
            <div className="text-sm grid sm:grid-cols-2 gap-2">
              <p>Method: {hub.deployment.method ?? "—"}</p>
              <p>Version: {hub.deployment.lastDeployedVersion ?? "—"}</p>
              {hub.deployment.productionUrl ? (
                <p className="sm:col-span-2">
                  Production:{" "}
                  <a href={hub.deployment.productionUrl} className="rlk-link" target="_blank" rel="noopener noreferrer">
                    {hub.deployment.productionUrl}
                  </a>
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="rlk-card p-5 space-y-3 lg:col-span-2">
          <h2 className="font-display font-semibold">Recent updates</h2>
          {hub.clientUpdates.length === 0 ? (
            <p className="text-sm text-muted">No updates yet.</p>
          ) : (
            hub.clientUpdates.map((u) => (
              <div key={u.id} className="border-l-2 border-accent/40 pl-3 text-sm">
                <p className="font-medium">{u.title}</p>
                <p className="text-xs text-muted">{formatSriLankaDate(u.createdAt)}</p>
                <p className="text-muted mt-1">{u.body}</p>
              </div>
            ))
          )}
        </section>
      </div>

      <p className="text-xs text-muted">
        View-only access. To request DNS, hosting, or deployment changes, use the request form above
        or contact your account manager.
      </p>
    </div>
  );
}
