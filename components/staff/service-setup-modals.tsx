"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

export function ServiceSetupModals({
  erpProjectId,
  serviceProjectId,
  setup,
  serviceId,
  onDone,
}: {
  erpProjectId: string;
  serviceProjectId: string;
  setup: string;
  serviceId: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [domainForm, setDomainForm] = useState({
    domainName: "",
    registrar: "",
    registrationDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    purchasedViaMernCrest: true,
    autoRenew: true,
  });
  const [hostingForm, setHostingForm] = useState({
    packageName: "",
    diskQuotaMb: "5120",
    bandwidthQuotaMb: "51200",
    serverLocation: "",
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });

  async function setupDomain(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/projects/${serviceProjectId}/services/${serviceId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domainForm.domainName,
          registrar: domainForm.registrar || null,
          purchasedViaMernCrest: domainForm.purchasedViaMernCrest,
          registrationDate: new Date(`${domainForm.registrationDate}T00:00:00.000Z`).toISOString(),
          expiryDate: new Date(`${domainForm.expiryDate}T00:00:00.000Z`).toISOString(),
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to create domain");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setupHosting(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/projects/${serviceProjectId}/services/${serviceId}/hosting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: hostingForm.packageName,
          diskQuotaMb: Number(hostingForm.diskQuotaMb),
          bandwidthQuotaMb: Number(hostingForm.bandwidthQuotaMb),
          serverLocation: hostingForm.serverLocation || null,
          expiryDate: new Date(`${hostingForm.expiryDate}T00:00:00.000Z`).toISOString(),
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to create hosting");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const cancelHref = `/staff/projects/${erpProjectId}#services`;

  if (setup === "domain") {
    const parts = domainForm.domainName.split(".");
    const extension = parts.length > 1 ? parts.slice(1).join(".") : "";

    return (
      <div className="stitch-modal-backdrop">
        <div className="stitch-modal max-w-lg">
          <div className="stitch-modal-head">
            <h3>Domain service setup</h3>
            <Link href={cancelHref} className="stitch-btn-sm">
              Cancel
            </Link>
          </div>
          <form onSubmit={setupDomain} className="stitch-modal-body space-y-4 text-sm">
            {error ? <p className="stitch-auth-error">{error}</p> : null}
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Domain name</span>
              <input
                className="stitch-input w-full font-mono"
                value={domainForm.domainName}
                onChange={(e) => setDomainForm((f) => ({ ...f, domainName: e.target.value }))}
                placeholder="example.lk"
                required
              />
            </label>
            {extension ? (
              <p className="text-xs text-[var(--sp-muted)] m-0">Extension: .{extension}</p>
            ) : null}
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Registrar</span>
              <input
                className="stitch-input w-full"
                value={domainForm.registrar}
                onChange={(e) => setDomainForm((f) => ({ ...f, registrar: e.target.value }))}
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Registration date</span>
                <input
                  type="date"
                  className="stitch-input w-full"
                  value={domainForm.registrationDate}
                  onChange={(e) =>
                    setDomainForm((f) => ({ ...f, registrationDate: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Expiry date</span>
                <input
                  type="date"
                  className="stitch-input w-full"
                  value={domainForm.expiryDate}
                  onChange={(e) => setDomainForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  required
                />
              </label>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={domainForm.purchasedViaMernCrest}
                onChange={(e) =>
                  setDomainForm((f) => ({ ...f, purchasedViaMernCrest: e.target.checked }))
                }
              />
              <span>Purchased via MernCrest (full lifecycle management)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={domainForm.autoRenew}
                onChange={(e) => setDomainForm((f) => ({ ...f, autoRenew: e.target.checked }))}
              />
              <span>Auto renewal enabled</span>
            </label>
            <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create domain service"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (setup === "hosting") {
    return (
      <div className="stitch-modal-backdrop">
        <div className="stitch-modal max-w-lg">
          <div className="stitch-modal-head">
            <h3>Hosting service setup</h3>
            <Link href={cancelHref} className="stitch-btn-sm">
              Cancel
            </Link>
          </div>
          <form onSubmit={setupHosting} className="stitch-modal-body space-y-4 text-sm">
            {error ? <p className="stitch-auth-error">{error}</p> : null}
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Package name</span>
              <input
                className="stitch-input w-full"
                value={hostingForm.packageName}
                onChange={(e) => setHostingForm((f) => ({ ...f, packageName: e.target.value }))}
                required
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Disk quota (MB)</span>
                <input
                  type="number"
                  min={1}
                  className="stitch-input w-full"
                  value={hostingForm.diskQuotaMb}
                  onChange={(e) => setHostingForm((f) => ({ ...f, diskQuotaMb: e.target.value }))}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Bandwidth (MB)</span>
                <input
                  type="number"
                  min={1}
                  className="stitch-input w-full"
                  value={hostingForm.bandwidthQuotaMb}
                  onChange={(e) =>
                    setHostingForm((f) => ({ ...f, bandwidthQuotaMb: e.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Server location</span>
              <input
                className="stitch-input w-full"
                value={hostingForm.serverLocation}
                onChange={(e) => setHostingForm((f) => ({ ...f, serverLocation: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Expiry date</span>
              <input
                type="date"
                className="stitch-input w-full"
                value={hostingForm.expiryDate}
                onChange={(e) => setHostingForm((f) => ({ ...f, expiryDate: e.target.value }))}
                required
              />
            </label>
            <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create hosting service"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
