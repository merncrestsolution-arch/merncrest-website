"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { FileCheck, Loader2, Search } from "lucide-react";
import { formatSriLankaDateTime } from "@/lib/timezone";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";

type Submission = {
  id: string;
  projectServiceId: string;
  fullName: string;
  companyName: string | null;
  purpose: string;
  phone: string;
  email: string;
  letterheadUrl: string | null;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  projectService?: {
    id: string;
    serviceType: string;
    project?: { id: string; name: string; clientId: string };
  };
  submitter?: { id: string; fullName: string; email: string };
};

function statusChip(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "stitch-chip stitch-badge-done";
  if (s === "PENDING") return "stitch-chip stitch-badge-pending";
  if (s === "REJECTED") return "stitch-chip stitch-badge-danger";
  if (s === "CORRECTIONS_REQUESTED") return "stitch-chip stitch-badge-progress";
  return "stitch-chip";
}

export function DomainDocsReviewPanel() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/domain-docs?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setRows(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.companyName?.toLowerCase().includes(q) ?? false) ||
        (r.projectService?.project?.name.toLowerCase().includes(q) ?? false)
    );
  }, [rows, search]);

  const stats = useMemo(
    () => ({
      pending: rows.filter((r) => r.status === "PENDING").length,
      approved: rows.filter((r) => r.status === "APPROVED").length,
      rejected: rows.filter((r) => r.status === "REJECTED").length,
      corrections: rows.filter((r) => r.status === "CORRECTIONS_REQUESTED").length,
    }),
    [rows]
  );

  async function review(action: "approve" | "reject" | "request_corrections") {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/domain-docs/${selected.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNotes: reviewNotes || undefined }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Review failed");

      setSelected(null);
      setReviewNotes("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Domain docs review</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-5">
        <h1 className="stitch-page-title">Domain registration documents</h1>
        <p className="stitch-page-sub !mb-0">
          Review client-submitted domain registration paperwork before registrar submission.
        </p>
      </div>

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-amber-400">{stats.pending}</div>
          <div className="stitch-kpi-label">Pending review</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-emerald-500">{stats.approved}</div>
          <div className="stitch-kpi-label">Approved</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-red-400">{stats.rejected}</div>
          <div className="stitch-kpi-label">Rejected</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{stats.corrections}</div>
          <div className="stitch-kpi-label">Corrections requested</div>
        </div>
      </div>

      <div className="stitch-toolbar mb-4">
        <div className="stitch-search-wrap !max-w-none flex-1">
          <Search className="stitch-search-icon" />
          <input
            type="search"
            placeholder="Search name, email, project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="stitch-input !w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CORRECTIONS_REQUESTED">Corrections requested</option>
        </select>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No submissions"
          description="Domain registration document submissions appear here for staff review."
        />
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Project</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-medium">{r.fullName}</span>
                      {r.companyName ? (
                        <span className="text-xs text-[var(--sp-muted)] block">{r.companyName}</span>
                      ) : null}
                      <span className="text-xs text-[var(--sp-muted)] block">{r.email}</span>
                    </td>
                    <td>
                      {r.projectService?.project ? (
                        <Link
                          href={
                            r.projectService.project.erpProjectId
                              ? `/staff/projects/${r.projectService.project.erpProjectId}#services`
                              : `/staff/service-projects/${r.projectService.project.id}`
                          }
                          className="hover:text-violet-400"
                        >
                          {r.projectService.project.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{formatSriLankaDateTime(r.createdAt)}</td>
                    <td>
                      <span className={statusChip(r.status)}>{r.status.replace(/_/g, " ")}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="stitch-btn-outline-sm"
                        onClick={() => {
                          setSelected(r);
                          setReviewNotes(r.reviewNotes ?? "");
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected ? (
        <div className="stitch-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="stitch-modal stitch-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Review submission — {selected.fullName}</h3>
              <button type="button" className="stitch-btn-sm" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="stitch-modal-body space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[var(--sp-muted)]">Phone</span>
                  <p className="font-medium">{selected.phone}</p>
                </div>
                <div>
                  <span className="text-[var(--sp-muted)]">Email</span>
                  <p className="font-medium">{selected.email}</p>
                </div>
              </div>
              <div>
                <span className="text-[var(--sp-muted)]">Purpose</span>
                <p className="whitespace-pre-wrap">{selected.purpose}</p>
              </div>
              {selected.letterheadUrl ? (
                <div>
                  <span className="text-[var(--sp-muted)]">Letterhead</span>
                  <p>
                    <a
                      href={selected.letterheadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:underline"
                    >
                      View document
                    </a>
                  </p>
                </div>
              ) : null}
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Review notes</span>
                <textarea
                  className="stitch-input w-full min-h-[100px]"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Required when rejecting…"
                />
              </label>
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <button
                  type="button"
                  className="stitch-btn-outline-sm"
                  disabled={busy}
                  onClick={() => review("request_corrections")}
                >
                  Request corrections
                </button>
                <button
                  type="button"
                  className="stitch-btn-outline-sm text-red-400"
                  disabled={busy}
                  onClick={() => review("reject")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="stitch-btn-primary-sm"
                  disabled={busy}
                  onClick={() => review("approve")}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
