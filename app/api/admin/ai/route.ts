import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffOrAdmin } from "@/lib/admin/require-admin";
import { isFeatureEnabled } from "@/lib/admin/feature-flags";

/** Admin AI assistant — summarize ops (rule-based; LLM later) */
export async function POST(request: Request) {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  if (!(await isFeatureEnabled("ai.assistant", true))) {
    return NextResponse.json({ error: "AI assistant disabled" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const intent = (body.intent as string) || "summary";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [
    todayRevenue,
    monthRevenue,
    newCustomers,
    newOrders,
    pendingPayments,
    pendingTickets,
    newLeads,
    projects,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: startOfDay } },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: startOfMonth } },
      _sum: { amountCents: true },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: startOfDay } },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.payment.count({
      where: { status: { in: ["PENDING", "AWAITING_VERIFICATION"] } },
    }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.crmLead.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.erpProject.count({ where: { status: { in: ["PLANNING", "ACTIVE"] } } }),
  ]);

  const todayCents = todayRevenue._sum.amountCents ?? 0;
  const monthCents = monthRevenue._sum.amountCents ?? 0;

  const issues: string[] = [];
  if (pendingPayments > 5) issues.push(`${pendingPayments} payments awaiting verification`);
  if (pendingTickets > 10) issues.push(`${pendingTickets} open support tickets`);
  if (todayCents === 0 && newOrders === 0) {
    issues.push("No revenue or orders recorded today yet");
  }

  const suggestions: string[] = [];
  if (pendingPayments > 0) {
    suggestions.push("Review /admin/payments for manual bank transfer approvals");
  }
  if (newLeads > 0) {
    suggestions.push("Assign new leads in CRM Kanban before end of day");
  }
  if (pendingTickets > 0) {
    suggestions.push("Triage open tickets in Support queue");
  }
  suggestions.push("Confirm provider sync health under Providers");

  if (intent === "issues") {
    return NextResponse.json({
      title: "Detected issues",
      body: issues.length ? issues.join(". ") : "No critical issues detected from current KPIs.",
      issues,
      suggestions,
    });
  }

  if (intent === "growth") {
    const growthHint =
      monthCents > 0
        ? `Month-to-date revenue is LKR ${(monthCents / 100).toLocaleString()}. Sustain pipeline by converting ${newLeads || "new"} leads and clearing payment backlog.`
        : "Month-to-date revenue is still at zero — focus on closing open quotations and verifying pending payments.";
    return NextResponse.json({
      title: "Growth outlook",
      body: growthHint,
      metrics: { monthCents, todayCents, newLeads, projects },
      suggestions,
    });
  }

  return NextResponse.json({
    title: "Operations summary",
    body: `Today: LKR ${(todayCents / 100).toLocaleString()} revenue, ${newOrders} orders, ${newCustomers} new customers, ${newLeads} leads. MTD revenue LKR ${(monthCents / 100).toLocaleString()}. ${pendingPayments} pending payments · ${pendingTickets} open tickets · ${projects} active projects.`,
    metrics: {
      todayCents,
      monthCents,
      newCustomers,
      newOrders,
      pendingPayments,
      pendingTickets,
      newLeads,
      projects,
    },
    issues,
    suggestions,
  });
}
