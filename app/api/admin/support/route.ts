import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const [openTickets, pendingCallbacks, chatHandoffs, recentWhatsApp, missedCalls, pipeline] =
      await Promise.all([
        prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
        prisma.callbackRequest.count({ where: { status: "PENDING" } }),
        prisma.chatSession.count({ where: { status: "HANDOFF" } }),
        prisma.whatsAppMessage.count({
          where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.callRecord.count({ where: { status: { in: ["MISSED", "VOICEMAIL"] } } }),
        prisma.crmLead.groupBy({ by: ["stage"], _count: { _all: true } }),
      ]);

    const tickets = await prisma.ticket.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    });

    const callbacks = await prisma.callbackRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      stats: {
        openTickets,
        pendingCallbacks,
        chatHandoffs,
        recentWhatsApp,
        missedCalls,
        pipeline: Object.fromEntries(pipeline.map((p) => [p.stage, p._count._all])),
      },
      tickets,
      callbacks,
    });
  } catch (error) {
    console.error("[admin/support]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
