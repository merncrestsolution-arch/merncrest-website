"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Check, Loader2, X } from "lucide-react";
import { formatSriLankaDateTime } from "@/lib/timezone";

type DnsChangeRequest = {
  id: string;
  domainName: string | null;
  status: string;
  clientNotes: string | null;
  reviewNotes: string | null;
  proposedRecords: unknown;
  project: { id: string; name: string; erpProjectId: string | null } | null;
  requester: { fullName: string; email: string } | null;
  createdAt: string;
};

export function StaffDnsChangeRequestsPanel() {
  const [rows, setRows] = useState<DnsChangeRequest[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<DnsChangeRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (filter) params.set("status", filter);
    fetch(`/api/staff/dns-change-requests?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setRows(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, action: "approve" | "reject" | "apply") {
    setBusy(id + action);
    setError("");
    try {
      const r = await fetch(`/api/staff/dns-change-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNotes }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      setSelected(null);
      setReviewNotes("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="stitch-page-title">DNS Change Requests</h1>
        <p className="stitch-page-sub">
          Review and apply client-submitted DNS changes for MernCrest-managed domains.
        </p>
      </div>

      <div className="stitch-tab-row">
        {["PENDING", "APPROVED", "APPLIED", "REJECTED", ""].map((s) => (
          <button
            key={s || "all"}
            type="button"
            className={filter === s ? "active" : ""}
            onClick={() => setFilter(s)}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {error ? <p className="stitch-auth-error text-sm">{error}</p> : null}

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            {loading ? (
              <p className="p-6 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : (
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[var(--sp-muted)]">
                        No requests.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr
                        key={r.id}
                        className={selected?.id === r.id ? "bg-violet-500/5" : "cursor-pointer"}
                        onClick={() => setSelected(r)}
                      >
                        <td className="font-mono">{r.domainName}</td>
                        <td className="text-xs">{r.requester?.fullName}</td>
                        <td>{r.status}</td>
                        <td className="text-xs">{formatSriLankaDateTime(r.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Request details</h3>
          </div>
          <div className="stitch-section-body space-y-4 text-sm">
            {!selected ? (
              <p className="text-[var(--sp-muted)]">Select a request to review.</p>
            ) : (
              <>
                <div>
                  <p className="font-medium m-0 font-mono">{selected.domainName}</p>
                  {selected.project?.erpProjectId ? (
                    <Link
                      href={`/staff/projects/${selected.project.erpProjectId}`}
                      className="text-violet-400 text-xs"
                    >
                      {selected.project.name}
                    </Link>
                  ) : null}
                </div>
                {selected.clientNotes ? (
                  <div>
                    <p className="text-xs text-[var(--sp-muted)] mb-1">Client notes</p>
                    <p className="m-0">{selected.clientNotes}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-[var(--sp-muted)] mb-1">Proposed DNS records</p>
                  <pre className="text-xs font-mono bg-[var(--sp-surface-2)] p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selected.proposedRecords, null, 2)}
                  </pre>
                </div>
                <textarea
                  className="stitch-input min-h-[80px]"
                  placeholder="Review notes (required for rejection)"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                {selected.status === "PENDING" || selected.status === "APPROVED" ? (
                  <div className="flex flex-wrap gap-2">
                    {selected.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          className="stitch-btn-primary-sm"
                          disabled={!!busy}
                          onClick={() => review(selected.id, "approve")}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          className="stitch-btn-outline-sm"
                          disabled={!!busy}
                          onClick={() => review(selected.id, "reject")}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="stitch-btn-sm"
                      disabled={!!busy}
                      onClick={() => review(selected.id, "apply")}
                    >
                      Apply DNS changes
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
