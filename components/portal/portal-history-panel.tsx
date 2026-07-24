"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";

export function PortalHistoryPanel() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "projects" ? "projects" : "payments";
  const [tab, setTab] = useState<"payments" | "projects">(initialTab);

  useEffect(() => {
    setTab(searchParams.get("tab") === "projects" ? "projects" : "payments");
  }, [searchParams]);
  const [payments, setPayments] = useState<
    {
      id: string;
      amountCents: number;
      status: string;
      method: string;
      createdAt: string;
      order?: { orderNumber: string } | null;
      invoice?: { invoiceNumber: string; dueAt: string | null } | null;
    }[]
  >([]);
  const [projects, setProjects] = useState<
    {
      id: string;
      projectCode: string;
      name: string;
      status: string;
      nextPaymentAt: string | null;
      nextPaymentCents: number;
      overdueCount: number;
      schedule: {
        label: string;
        amountCents: number;
        dueDate: string;
        status: string;
      }[];
      milestones: { title: string; status: string; dueDate: string | null }[];
    }[]
  >([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/portal/history");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setPayments(data.payments ?? []);
    setProjects(data.projects ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={
            tab === "payments"
              ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
              : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
          }
          onClick={() => setTab("payments")}
        >
          Payment history
        </button>
        <button
          type="button"
          className={
            tab === "projects"
              ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
              : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
          }
          onClick={() => setTab("projects")}
        >
          Project history
        </button>
      </div>

      {tab === "payments" && (
        <section className="rlk-section rlk-section-accent-teal">
          <div className="rlk-section-head">
            <h2>All payments</h2>
            <Link href="/portal/invoices" className="rlk-link text-sm">
              Invoices
            </Link>
          </div>
          <div className="rlk-section-body">
            {payments.length === 0 ? (
              <p className="rlk-empty">No payments yet.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="rlk-row">
                  <div>
                    <p className="font-medium text-[13px]">
                      {formatMoney(p.amountCents)} · {p.method}
                    </p>
                    <p className="text-xs text-[#666]">
                      {p.order?.orderNumber || "—"}
                      {p.invoice ? ` · ${p.invoice.invoiceNumber}` : ""}
                      {p.invoice?.dueAt
                        ? ` · due ${new Date(p.invoice.dueAt).toLocaleDateString()}`
                        : ""}
                      {" · "}
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="rlk-badge">{p.status}</span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "projects" && (
        <section className="rlk-section rlk-section-accent-orange">
          <div className="rlk-section-head">
            <h2>Your projects</h2>
            <Link href="/portal/projects" className="rlk-link text-sm">
              Projects
            </Link>
          </div>
          <div className="rlk-section-body space-y-3">
            {projects.length === 0 ? (
              <p className="rlk-empty">No projects linked yet.</p>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="border-b border-[#e0e0e0] pb-3 last:border-0">
                  <div className="rlk-row !mb-1">
                    <div>
                      <p className="font-medium">
                        <span className="text-[#17a2b8]">{p.projectCode}</span> · {p.name}
                      </p>
                      <p className="text-xs text-[#666]">
                        {p.status}
                        {p.nextPaymentAt
                          ? ` · next due ${new Date(p.nextPaymentAt).toLocaleDateString()} (${formatMoney(p.nextPaymentCents)})`
                          : ""}
                        {p.overdueCount ? ` · ${p.overdueCount} overdue` : ""}
                      </p>
                    </div>
                  </div>
                  {p.schedule.map((s, i) => (
                    <div key={i} className="rlk-row text-sm pl-2">
                      <span>
                        {s.label} · {formatMoney(s.amountCents)}
                      </span>
                      <span className="text-xs text-[#666]">
                        {new Date(s.dueDate).toLocaleDateString()} · {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </>
  );
}
