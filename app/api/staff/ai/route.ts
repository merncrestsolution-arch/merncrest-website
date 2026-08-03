import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { aiReply } from "@/lib/support/ai-replies";

/** Staff AIRA assistant — no ERP AI permission required. */
export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const locale = String(body.locale || auth.user.preferredLanguage || "en");

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
    include: { department: true },
  });

  const [openTasks, openTickets, unreadNotifications] = await Promise.all([
    prisma.projectTask.count({
      where: {
        assigneeId: auth.user.id,
        status: { notIn: ["DONE", "BLOCKED"] },
      },
    }),
    prisma.ticket.count({
      where: {
        assigneeId: auth.user.id,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.notification.count({
      where: { userId: auth.user.id, readAt: null },
    }),
  ]);

  const base = aiReply(prompt, locale);
  const staffLine = employee
    ? `Staff context: ${employee.fullName}, ${employee.jobTitle ?? "Staff"}, ${employee.department?.name ?? "—"}.`
    : `Staff context: ${auth.user.fullName ?? auth.user.email}.`;
  const opsLine = `Open tasks: ${openTasks}, open tickets: ${openTickets}, unread notifications: ${unreadNotifications}.`;
  const reply = `${base}\n\n— AIRA · ${staffLine} ${opsLine}`;

  return NextResponse.json({
    reply,
    context: { openTasks, openTickets, unreadNotifications },
  });
}
