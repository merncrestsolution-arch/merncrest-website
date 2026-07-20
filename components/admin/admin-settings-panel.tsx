"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type Setting = {
  id: string;
  key: string;
  value: string;
  valueType: string;
  group: string;
  label: string | null;
  description: string | null;
};

type Flag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  tier: string;
};

const TABS = [
  "company",
  "branding",
  "regional",
  "security",
  "email",
  "maintenance",
  "localization",
  "storage",
  "flags",
  "integrations",
] as const;

export function AdminSettingsPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("company");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [integrations, setIntegrations] = useState<{
    apiKeys: { id: string; name: string; keyPrefix: string; status: string }[];
    webhooks: { id: string; name: string; url: string; active: boolean }[];
    templates: { id: string; key: string; name: string; subject: string }[];
  } | null>(null);
  const [secretOnce, setSecretOnce] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [sRes, fRes, iRes] = await Promise.all([
      fetch("/api/admin/settings"),
      fetch("/api/admin/feature-flags"),
      fetch("/api/admin/integrations"),
    ]);
    const sData = await sRes.json();
    const fData = await fRes.json();
    const iData = await iRes.json();
    if (!sRes.ok) {
      setError(sData.error || "Admin access required for settings");
      return;
    }
    setSettings(sData.settings ?? []);
    const map: Record<string, string> = {};
    for (const s of sData.settings ?? []) map[s.key] = s.value;
    setDraft(map);
    if (fRes.ok) setFlags(fData.flags ?? []);
    if (iRes.ok) setIntegrations(iData);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groupSettings = useMemo(
    () => settings.filter((s) => s.group === tab),
    [settings, tab]
  );

  async function saveGroup() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const updates = groupSettings.map((s) => ({
        key: s.key,
        value: draft[s.key] ?? s.value,
      }));
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Settings saved");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFlag(key: string, enabled: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(`Flag ${key} ${enabled ? "enabled" : "disabled"}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createApiKey() {
    setBusy(true);
    setSecretOnce("");
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apiKey", name: `Key ${new Date().toISOString().slice(0, 10)}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSecretOnce(data.apiKey?.secretOnce || "");
      setMessage("API key created — copy the secret now (shown once)");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Database-driven platform configuration. Changes are audited. Related:{" "}
        <Link href="/admin/users" className="text-accent underline-offset-2 hover:underline">
          Users
        </Link>
        {" · "}
        <Link href="/admin/cms" className="text-accent underline-offset-2 hover:underline">
          CMS
        </Link>
        {" · "}
        <Link href="/admin/media" className="text-accent underline-offset-2 hover:underline">
          Media
        </Link>
        {" · "}
        <Link href="/admin/monitoring" className="text-accent underline-offset-2 hover:underline">
          Monitoring
        </Link>
        {" · "}
        <Link href="/admin/erp/audit" className="text-accent underline-offset-2 hover:underline">
          Audit
        </Link>
      </p>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${
              tab === t
                ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                : "border-white/10 text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "flags" && (
        <ul className="space-y-2">
          {flags.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-sm">{f.name}</p>
                <p className="text-xs font-mono text-accent mt-0.5">{f.key}</p>
                <p className="text-xs text-muted mt-1">{f.description}</p>
                <span className="text-[10px] uppercase tracking-wider text-muted">{f.tier}</span>
              </div>
              <Button
                size="sm"
                variant={f.enabled ? "default" : "outline"}
                disabled={busy}
                onClick={() => toggleFlag(f.key, !f.enabled)}
              >
                {f.enabled ? "Enabled" : "Disabled"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {tab === "integrations" && integrations && (
        <div className="space-y-6">
          {secretOnce && (
            <p className="text-xs font-mono break-all rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              Secret (copy once): {secretOnce}
            </p>
          )}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Platform API keys</h3>
              <Button size="sm" disabled={busy} onClick={createApiKey}>
                Create key
              </Button>
            </div>
            <ul className="space-y-1 text-sm">
              {integrations.apiKeys.map((k) => (
                <li key={k.id} className="border-b border-white/5 py-2 flex justify-between">
                  <span>
                    {k.name} · <span className="font-mono text-xs">{k.keyPrefix}…</span>
                  </span>
                  <span className="text-xs text-muted">{k.status}</span>
                </li>
              ))}
              {integrations.apiKeys.length === 0 && (
                <li className="text-muted text-sm">No API keys yet.</li>
              )}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold text-sm mb-2">Webhooks</h3>
            <ul className="space-y-1 text-sm">
              {integrations.webhooks.map((w) => (
                <li key={w.id} className="border-b border-white/5 py-2">
                  {w.name} · {w.url} · {w.active ? "active" : "off"}
                </li>
              ))}
              {integrations.webhooks.length === 0 && (
                <li className="text-muted text-sm">No webhooks. Add via API POST action=webhook.</li>
              )}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold text-sm mb-2">Email templates</h3>
            <ul className="space-y-1 text-sm">
              {integrations.templates.map((t) => (
                <li key={t.id} className="border-b border-white/5 py-2">
                  {t.key} · {t.subject}
                </li>
              ))}
              {integrations.templates.length === 0 && (
                <li className="text-muted text-sm">No DB templates yet (SMTP still uses env + code defaults).</li>
              )}
            </ul>
          </section>
          <p className="text-xs text-muted">
            Reseller provider credentials stay under{" "}
            <Link href="/admin/providers" className="text-accent">
              Providers
            </Link>
            .
          </p>
        </div>
      )}

      {tab !== "flags" && tab !== "integrations" && (
        <div className="space-y-3">
          {groupSettings.map((s) => (
            <label key={s.key} className="block rounded-xl border border-white/10 p-4">
              <span className="text-sm font-medium">{s.label || s.key}</span>
              {s.description && (
                <span className="block text-xs text-muted mt-0.5">{s.description}</span>
              )}
              {s.valueType === "BOOLEAN" ? (
                <select
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={draft[s.key] ?? s.value}
                  onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              ) : (
                <input
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={draft[s.key] ?? s.value}
                  onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                />
              )}
              <span className="text-[10px] font-mono text-muted mt-1 block">{s.key}</span>
            </label>
          ))}
          {groupSettings.length === 0 && (
            <p className="text-sm text-muted">No settings in this group.</p>
          )}
          <Button size="sm" disabled={busy || groupSettings.length === 0} onClick={saveGroup}>
            Save {tab}
          </Button>
        </div>
      )}
    </div>
  );
}
