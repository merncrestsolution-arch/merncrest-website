import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, formatMoney } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Payslip HTML for in-app viewing (staff ESS). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const slip = await prisma.salarySlip.findUnique({ where: { id } });
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const employee = await prisma.employee.findUnique({
    where: { id: slip.employeeId },
    select: {
      fullName: true,
      jobTitle: true,
      employeeNumber: true,
      userId: true,
      department: { select: { name: true } },
    },
  });

  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const isOwner = employee.userId === auth.user.id;
  if (!isOwner && !isAdminRole(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let meta: Record<string, unknown> = {};
  if (slip.metaJson) {
    try {
      meta = JSON.parse(slip.metaJson) as Record<string, unknown>;
    } catch {
      meta = {};
    }
  }

  const rows = [
    ["Gross salary", slip.grossCents],
    ["Deductions", slip.deductionsCents],
    ["Net pay", slip.netCents],
  ];

  const metaRows = Object.entries(meta)
    .filter(([, v]) => typeof v === "number")
    .map(([k, v]) => [k.replace(/Cents$/, "").replace(/([A-Z])/g, " $1").trim(), v as number]);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(slip.slipNumber)} — Payslip</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 20px; color: #0f172a; background: #fff; }
    h1 { font-size: 18px; margin: 0; }
    .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
    td:last-child { text-align: right; font-weight: 600; }
    .net { font-size: 18px; color: #059669; }
    .brand { color: #7c3aed; font-weight: 700; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="brand">MernCrest Solutions</div>
  <h1>Salary Payslip</h1>
  <p class="sub">${escapeHtml(slip.periodLabel)} · ${escapeHtml(slip.slipNumber)} · ${escapeHtml(slip.status)}</p>
  <p class="sub">${escapeHtml(employee.fullName)} · ${escapeHtml(employee.jobTitle ?? "Staff")} · ${escapeHtml(employee.department?.name ?? "")}</p>
  <table>
    ${rows.map(([label, cents]) => `<tr><td>${escapeHtml(label as string)}</td><td>${formatMoney(cents as number, slip.currency)}</td></tr>`).join("")}
    ${metaRows.map(([label, cents]) => `<tr><td>${escapeHtml(label as string)}</td><td>${formatMoney(cents as number, slip.currency)}</td></tr>`).join("")}
    <tr><td><strong>Net pay</strong></td><td class="net">${formatMoney(slip.netCents, slip.currency)}</td></tr>
  </table>
  <p class="sub">Issued ${escapeHtml(new Date(slip.issuedAt).toLocaleDateString("en-LK"))}</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
