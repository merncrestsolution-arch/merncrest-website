"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/commerce-format";
import { Download } from "lucide-react";

type Slip = {
  id: string;
  slipNumber: string;
  periodLabel: string;
  grossCents: number;
  netCents: number;
  deductionsCents: number;
  currency: string;
  metaJson?: string | null;
};

type LineItem = { label: string; cents: number };

function parseMeta(metaJson?: string | null): {
  earnings: LineItem[];
  deductions: LineItem[];
} | null {
  if (!metaJson) return null;
  try {
    const m = JSON.parse(metaJson) as {
      earnings?: LineItem[];
      deductions?: LineItem[];
      basicCents?: number;
      allowancesCents?: number;
    };
    if (m.earnings?.length || m.deductions?.length) {
      return { earnings: m.earnings ?? [], deductions: m.deductions ?? [] };
    }
    return null;
  } catch {
    return null;
  }
}

function buildBreakdown(slip: Slip) {
  const parsed = parseMeta(slip.metaJson);
  if (parsed) {
    const earningsTotal = parsed.earnings.reduce((s, e) => s + e.cents, 0);
    const deductionsTotal = parsed.deductions.reduce((s, d) => s + d.cents, 0);
    return {
      earnings: parsed.earnings,
      deductions: parsed.deductions,
      earningsTotal: earningsTotal || slip.grossCents,
      deductionsTotal: deductionsTotal || slip.deductionsCents,
      basicCents: parsed.earnings.find((e) => /basic/i.test(e.label))?.cents ?? slip.grossCents,
      allowancesCents: parsed.earnings
        .filter((e) => !/basic/i.test(e.label))
        .reduce((s, e) => s + e.cents, 0),
    };
  }

  const basicCents = Math.round(slip.grossCents * 0.75);
  const allowancesCents = slip.grossCents - basicCents;
  const epf = Math.round(basicCents * 0.08);
  const etf = Math.round(basicCents * 0.03);
  const other = Math.max(0, slip.deductionsCents - epf - etf);

  return {
    basicCents,
    allowancesCents,
    earnings: [
      { label: "Basic Salary", cents: basicCents },
      { label: "Transport", cents: Math.round(allowancesCents * 0.4) },
      { label: "Meal", cents: Math.round(allowancesCents * 0.35) },
      { label: "Other", cents: allowancesCents - Math.round(allowancesCents * 0.75) },
    ],
    deductions: [
      { label: "EPF (8%)", cents: epf },
      { label: "ETF (3%)", cents: etf },
      { label: "Tax", cents: other > 0 ? Math.round(other * 0.6) : 0 },
      { label: "Other", cents: other > 0 ? other - Math.round(other * 0.6) : 0 },
    ].filter((d) => d.cents > 0),
    earningsTotal: slip.grossCents,
    deductionsTotal: slip.deductionsCents,
  };
}

export function StaffPayslipPanel() {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/staff")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        const list: Slip[] = d.salarySlips ?? [];
        setSlips(list);
        if (list.length) setSelectedId(list[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => slips.find((s) => s.id === selectedId) ?? slips[0] ?? null,
    [slips, selectedId]
  );

  const breakdown = useMemo(
    () => (selected ? buildBreakdown(selected) : null),
    [selected]
  );

  function downloadSlip() {
    if (!selected || !breakdown) return;
    const lines = [
      `Payslip — ${selected.periodLabel}`,
      `Slip #: ${selected.slipNumber}`,
      "",
      "EARNINGS",
      ...breakdown.earnings.map((e) => `${e.label}: ${formatMoney(e.cents, selected.currency)}`),
      `Total Earnings: ${formatMoney(breakdown.earningsTotal, selected.currency)}`,
      "",
      "DEDUCTIONS",
      ...breakdown.deductions.map((d) => `${d.label}: ${formatMoney(d.cents, selected.currency)}`),
      `Total Deductions: ${formatMoney(breakdown.deductionsTotal, selected.currency)}`,
      "",
      `Net Salary: ${formatMoney(selected.netCents, selected.currency)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-${selected.slipNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Payslip</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Payslip</h1>
          <p className="stitch-page-sub">View and download your salary slips.</p>
        </div>
        <div className="stitch-toolbar-actions">
          <select
            className="stitch-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={!slips.length}
          >
            {slips.length === 0 ? (
              <option value="">No payslips</option>
            ) : (
              slips.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.periodLabel}
                </option>
              ))
            )}
          </select>
          {selected ? (
            <button type="button" className="stitch-btn-primary-sm" onClick={downloadSlip}>
              <Download className="h-3.5 w-3.5" />
              Download Payslip
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      {!selected ? (
        <p className="stitch-page-sub">No payslips available yet.</p>
      ) : (
        <>
          <div className="stitch-stat-grid mb-6">
            <div className="stitch-stat-card">
              <div className="stitch-stat-label">Basic Salary</div>
              <div className="stitch-stat-num text-base">
                {formatMoney(breakdown?.basicCents ?? 0, selected.currency)}
              </div>
            </div>
            <div className="stitch-stat-card">
              <div className="stitch-stat-label">Allowances</div>
              <div className="stitch-stat-num text-base">
                {formatMoney(breakdown?.allowancesCents ?? 0, selected.currency)}
              </div>
            </div>
            <div className="stitch-stat-card">
              <div className="stitch-stat-label">Deductions</div>
              <div className="stitch-stat-num text-base">
                {formatMoney(selected.deductionsCents, selected.currency)}
              </div>
            </div>
            <div className="stitch-stat-card border-[var(--stitch-success)]">
              <div className="stitch-stat-label">Net Salary</div>
              <div className="stitch-stat-num text-base" style={{ color: "var(--stitch-success)" }}>
                {formatMoney(selected.netCents, selected.currency)}
              </div>
            </div>
          </div>

          <div className="stitch-payslip-tables mb-6">
            <section className="stitch-section-card">
              <div className="stitch-section-head">
                <h3>Earnings</h3>
              </div>
              <div className="stitch-section-body !p-0">
                <table className="stitch-table">
                  <tbody>
                    {breakdown?.earnings.map((e) => (
                      <tr key={e.label}>
                        <td>{e.label}</td>
                        <td className="text-right">{formatMoney(e.cents, selected.currency)}</td>
                      </tr>
                    ))}
                    <tr className="stitch-table-total">
                      <td>Total Earnings</td>
                      <td className="text-right font-semibold">
                        {formatMoney(breakdown?.earningsTotal ?? 0, selected.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="stitch-section-card">
              <div className="stitch-section-head">
                <h3>Deductions</h3>
              </div>
              <div className="stitch-section-body !p-0">
                <table className="stitch-table">
                  <tbody>
                    {breakdown?.deductions.map((d) => (
                      <tr key={d.label}>
                        <td>{d.label}</td>
                        <td className="text-right">{formatMoney(d.cents, selected.currency)}</td>
                      </tr>
                    ))}
                    <tr className="stitch-table-total">
                      <td>Total Deductions</td>
                      <td className="text-right font-semibold">
                        {formatMoney(breakdown?.deductionsTotal ?? 0, selected.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="stitch-payslip-net">
            <span>Net Salary</span>
            <strong>{formatMoney(selected.netCents, selected.currency)}</strong>
          </div>
        </>
      )}
    </div>
  );
}
