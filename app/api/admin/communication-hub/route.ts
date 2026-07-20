import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";

/**
 * Omnichannel Communication Hub — one feed for all channels into CRM.
 * Website · WhatsApp · Live Chat · Email · IVR · Callbacks · Portal
 */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");
  const limit = Math.min(Number(searchParams.get("limit") || 40), 100);

  try {
    const [
      activities,
      whatsapp,
      chats,
      tickets,
      calls,
      callbacks,
      csat,
      openChats,
      openTickets,
      missedCalls,
    ] = await Promise.all([
      prisma.crmActivity.findMany({
        where: email
          ? { lead: { email: { equals: email, mode: "insensitive" } } }
          : undefined,
        include: {
          lead: { select: { fullName: true, email: true, leadNumber: true, company: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.whatsAppMessage.findMany({
        where: phone ? { phone: { contains: phone.replace(/\D/g, "").slice(-9) } } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.chatSession.findMany({
        where: { status: { in: ["OPEN", "HANDOFF"] } },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 3 },
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.ticket.findMany({
        where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } },
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.callRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.callbackRequest.findMany({
        where: { status: { in: ["PENDING", "SCHEDULED"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.customerSatisfaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.chatSession.count({ where: { status: { in: ["OPEN", "HANDOFF"] } } }),
      prisma.ticket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } },
      }),
      prisma.callRecord.count({ where: { status: { in: ["MISSED", "VOICEMAIL", "CALLBACK"] } } }),
    ]);

    const feed = [
      ...activities.map((a) => ({
        id: `crm-${a.id}`,
        channel: a.type,
        title: a.lead?.fullName || "CRM",
        body: a.body,
        at: a.createdAt,
        meta: { leadNumber: a.lead?.leadNumber, email: a.lead?.email },
      })),
      ...whatsapp.map((w) => ({
        id: `wa-${w.id}`,
        channel: "WHATSAPP",
        title: w.phone,
        body: w.body.slice(0, 160),
        at: w.createdAt,
        meta: { direction: w.direction, status: w.status },
      })),
      ...chats.map((c) => ({
        id: `chat-${c.id}`,
        channel: "LIVE_CHAT",
        title: c.user?.fullName || c.visitorId,
        body: c.messages[0]?.body?.slice(0, 160) || c.status,
        at: c.updatedAt,
        meta: { status: c.status, department: c.department },
      })),
      ...tickets.map((t) => ({
        id: `tkt-${t.id}`,
        channel: "TICKET",
        title: t.ticketNumber,
        body: t.subject,
        at: t.updatedAt,
        meta: { status: t.status, department: t.department },
      })),
      ...calls.map((c) => ({
        id: `call-${c.id}`,
        channel: "IVR",
        title: c.callNumber,
        body: `${c.department} · ${c.status}`,
        at: c.createdAt,
        meta: { phone: c.phone, language: c.language },
      })),
      ...callbacks.map((c) => ({
        id: `cb-${c.id}`,
        channel: "CALLBACK",
        title: c.fullName,
        body: `${c.reason} · ${c.phone}`,
        at: c.createdAt,
        meta: { status: c.status },
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, limit);

    const avgCsat =
      csat.length > 0
        ? Math.round((csat.reduce((s, c) => s + c.rating, 0) / csat.length) * 10) / 10
        : null;

    return NextResponse.json({
      feed,
      stats: {
        openChats,
        openTickets,
        missedCalls,
        pendingCallbacks: callbacks.length,
        whatsappToday: whatsapp.filter(
          (w) => w.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        avgCsat,
        csatCount: csat.length,
      },
      channels: ["WEBSITE", "WHATSAPP", "LIVE_CHAT", "EMAIL", "IVR", "CALLBACK", "PORTAL"],
    });
  } catch (error) {
    console.error("[communication-hub]", error);
    return NextResponse.json({ error: "Hub unavailable" }, { status: 500 });
  }
}
