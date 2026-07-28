"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Eye, Loader2, Save } from "lucide-react";
import type { ProjectCredentialEntry } from "@/lib/security/project-secrets";

type Resource = {
  id: string;
  gitRepoUrl: string | null;
  sourceCodeNotes: string | null;
  docsUrl: string | null;
  apiDocsUrl: string | null;
  deploymentMethod: string | null;
  lastDeployedAt: string | null;
  lastDeployedVersion: string | null;
  hostingAccountId: string | null;
  domainId: string | null;
  hostingAccount: { id: string; label: string; panelUrl: string | null; serverIp: string | null } | null;
  domain: { id: string; fqdn: string } | null;
  hasEnvVars: boolean;
  hasCredentials: boolean;
  envVarsMasked: Record<string, string>;
  credentialsMasked: ProjectCredentialEntry[];
};

export function ProjectResourcesPanel({ projectId }: { projectId: string }) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [form, setForm] = useState({
    gitRepoUrl: "",
    sourceCodeNotes: "",
    docsUrl: "",
    apiDocsUrl: "",
    deploymentMethod: "",
    lastDeployedVersion: "",
    envVarsText: "",
    credentialsJson: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/staff/projects/${projectId}/resources`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        const row = d.data as Resource;
        setResource(row);
        setForm({
          gitRepoUrl: row.gitRepoUrl ?? "",
          sourceCodeNotes: row.sourceCodeNotes ?? "",
          docsUrl: row.docsUrl ?? "",
          apiDocsUrl: row.apiDocsUrl ?? "",
          deploymentMethod: row.deploymentMethod ?? "",
          lastDeployedVersion: row.lastDeployedVersion ?? "",
          envVarsText: Object.entries(row.envVarsMasked)
            .map(([k, v]) => `${k}=${v}`)
            .join("\n"),
          credentialsJson: JSON.stringify(row.credentialsMasked, null, 2),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const envVars: Record<string, string> = {};
      form.envVarsText.split("\n").forEach((line) => {
        const idx = line.indexOf("=");
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (key && val && !val.startsWith("•")) envVars[key] = val;
        }
      });

      let credentials: ProjectCredentialEntry[] | undefined;
      if (form.credentialsJson.trim()) {
        try {
          credentials = JSON.parse(form.credentialsJson) as ProjectCredentialEntry[];
        } catch {
          throw new Error("Credentials must be valid JSON array");
        }
      }

      const res = await fetch(`/api/staff/projects/${projectId}/resources`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gitRepoUrl: form.gitRepoUrl || null,
          sourceCodeNotes: form.sourceCodeNotes || null,
          docsUrl: form.docsUrl || null,
          apiDocsUrl: form.apiDocsUrl || null,
          deploymentMethod: form.deploymentMethod || null,
          lastDeployedVersion: form.lastDeployedVersion || null,
          ...(Object.keys(envVars).length ? { envVars } : {}),
          ...(credentials ? { credentials } : {}),
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function reveal(field: "envVars" | "credentials") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/resources/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      setRevealed({ field, value: d.data.value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--sp-muted)] flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading resources…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error ? <p className="stitch-auth-error text-sm">{error}</p> : null}

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Repository &amp; documentation</h3>
          <button type="button" className="stitch-btn-primary-sm" disabled={busy} onClick={save}>
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
        <div className="stitch-section-body grid gap-3 max-w-2xl">
          <input
            className="stitch-input"
            placeholder="Git repository URL"
            value={form.gitRepoUrl}
            onChange={(e) => setForm({ ...form, gitRepoUrl: e.target.value })}
          />
          <textarea
            className="stitch-input min-h-[80px]"
            placeholder="Source code location / notes"
            value={form.sourceCodeNotes}
            onChange={(e) => setForm({ ...form, sourceCodeNotes: e.target.value })}
          />
          <input
            className="stitch-input"
            placeholder="Documentation URL"
            value={form.docsUrl}
            onChange={(e) => setForm({ ...form, docsUrl: e.target.value })}
          />
          <input
            className="stitch-input"
            placeholder="API documentation URL"
            value={form.apiDocsUrl}
            onChange={(e) => setForm({ ...form, apiDocsUrl: e.target.value })}
          />
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Deployment</h3>
        </div>
        <div className="stitch-section-body grid gap-3 max-w-2xl">
          <input
            className="stitch-input"
            placeholder="Deployment method (e.g. Lightsail, Vercel)"
            value={form.deploymentMethod}
            onChange={(e) => setForm({ ...form, deploymentMethod: e.target.value })}
          />
          <input
            className="stitch-input"
            placeholder="Last deployed version"
            value={form.lastDeployedVersion}
            onChange={(e) => setForm({ ...form, lastDeployedVersion: e.target.value })}
          />
          {resource?.lastDeployedAt ? (
            <p className="text-xs text-[var(--sp-muted)]">
              Last deployed: {new Date(resource.lastDeployedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Linked infrastructure</h3>
        </div>
        <div className="stitch-section-body space-y-2 text-sm">
          {resource?.hostingAccount ? (
            <p>
              Hosting:{" "}
              <Link href={`/staff/hosting/${resource.hostingAccount.id}`} className="text-violet-400">
                {resource.hostingAccount.label}
              </Link>
              {resource.hostingAccount.serverIp ? ` · ${resource.hostingAccount.serverIp}` : ""}
            </p>
          ) : (
            <p className="text-[var(--sp-muted)]">No hosting account linked — set via API or ERP.</p>
          )}
          {resource?.domain ? (
            <p>
              Domain:{" "}
              <Link href={`/staff/domains/${resource.domain.id}`} className="text-violet-400">
                {resource.domain.fqdn}
              </Link>
            </p>
          ) : (
            <p className="text-[var(--sp-muted)]">No domain linked.</p>
          )}
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Environment variables</h3>
          {resource?.hasEnvVars ? (
            <button type="button" className="stitch-btn-sm" disabled={busy} onClick={() => reveal("envVars")}>
              <Eye className="h-3.5 w-3.5" /> Reveal
            </button>
          ) : null}
        </div>
        <div className="stitch-section-body">
          <textarea
            className="stitch-input min-h-[120px] font-mono text-xs"
            placeholder="KEY=value (one per line)"
            value={form.envVarsText}
            onChange={(e) => setForm({ ...form, envVarsText: e.target.value })}
          />
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Project credentials</h3>
          {resource?.hasCredentials ? (
            <button
              type="button"
              className="stitch-btn-sm"
              disabled={busy}
              onClick={() => reveal("credentials")}
            >
              <Eye className="h-3.5 w-3.5" /> Reveal
            </button>
          ) : null}
        </div>
        <div className="stitch-section-body">
          <textarea
            className="stitch-input min-h-[140px] font-mono text-xs"
            placeholder='[{"label":"Admin","username":"","password":""}]'
            value={form.credentialsJson}
            onChange={(e) => setForm({ ...form, credentialsJson: e.target.value })}
          />
        </div>
      </section>

      {revealed ? (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Revealed: {revealed.field as string}</h3>
            <button type="button" className="stitch-btn-sm" onClick={() => setRevealed(null)}>
              Close
            </button>
          </div>
          <div className="stitch-section-body">
            <pre className="text-xs font-mono whitespace-pre-wrap bg-[var(--sp-surface-2)] p-3 rounded-lg">
              {JSON.stringify(revealed.value, null, 2)}
            </pre>
          </div>
        </section>
      ) : null}
    </div>
  );
}
