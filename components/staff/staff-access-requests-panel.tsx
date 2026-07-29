"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatSriLankaDateTime } from "@/lib/timezone";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";

type AccessRequest = {
  id: string;
  reason: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  requester?: { fullName: string; email: string };
  client?: { fullName: string; email: string; company: string | null };
  project?: { name: string } | null;
};

export function StaffAccessRequestsPanel() {
  const [rows, setRows] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/staff/access-requests?limit=50")
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setRows(d.data ?? []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const r = await fetch(`/api/staff/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState label="Loading access requests…" />;

  return (
    <div>
      <h1 className="stitch-page-title">Access Requests</h1>
      <p className="stitch-page-sub">
        Sales agents can request access to clients outside their assignment. Owner, Admin, or HR
        can approve.
      </p>

      {rows.length === 0 ? (
        <EmptyState title="No access requests" description="Pending requests will appear here." />
      ) : (
        <div className="stitch-section-card">
          <div className="stitch-section-body p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Client</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.requester?.fullName ?? "—"}</td>
                    <td>{row.client?.company || row.client?.fullName || "—"}</td>
                    <td className="max-w-[200px] truncate">{row.reason}</td>
                    <td>
                      <span className="stitch-chip stitch-chip-violet">{row.status}</span>
                    </td>
                    <td>{formatSriLankaDateTime(row.createdAt)}</td>
                    <td>
                      {row.status === "PENDING" ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="stitch-btn-primary-sm !text-xs"
                            disabled={busy === row.id}
                            onClick={() => review(row.id, "approve")}
                          >
                            {busy === row.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            type="button"
                            className="stitch-btn-sm !text-xs"
                            disabled={busy === row.id}
                            onClick={() => review(row.id, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
