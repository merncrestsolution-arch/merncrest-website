import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { aiReply } from "@/lib/support/ai-replies";

export async function GET() {
  const auth = await requirePermission(["erp.ai.view", "erp.ai.manage"]);
  if (auth.error) return auth.error;

  const insights = await prisma.aiInsight.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ insights });
}

export async function POST(request: Request) {
  const auth = await requirePermission(["erp.ai.view", "erp.ai.manage"]);
  if (auth.error) return auth.error;

  const body = await request.json();
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const [income, expense, employees, projects, openTickets] = await Promise.all([
    prisma.financeEntry.aggregate({ where: { type: "INCOME" }, _sum: { amountCents: true } }),
    prisma.financeEntry.aggregate({ where: { type: "EXPENSE" }, _sum: { amountCents: true } }),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.erpProject.count({ where: { status: "ACTIVE" } }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  const context = `ERP snapshot: income=${income._sum.amountCents ?? 0}, expense=${expense._sum.amountCents ?? 0}, employees=${employees}, activeProjects=${projects}, openTickets=${openTickets}.`;
  const base = aiReply(prompt, "en");
  const summary = `${base}\n\n${context}\n\n(AI Enterprise stub — connect LLM provider for production reports/forecasts.)`;

  const insight = await prisma.aiInsight.create({
    data: {
      title: prompt.slice(0, 80),
      category: body.category || "ASSISTANT",
      summary,
      payload: JSON.stringify({ income, expense, employees, projects, openTickets }),
    },
  });

  return NextResponse.json({ insight, reply: summary }, { status: 201 });
}
