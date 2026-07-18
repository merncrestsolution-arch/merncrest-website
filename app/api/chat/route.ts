import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { nextNumber } from "@/lib/commerce";
import { aiReply, wantsHumanHandoff } from "@/lib/support/ai-replies";
import { notifyUser } from "@/lib/support/notify";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";

function visitorCookie(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/mc_visitor=([^;]+)/);
  return match?.[1] || null;
}

export async function GET(request: Request) {
  const visitorId = visitorCookie(request);
  if (!visitorId) {
    return NextResponse.json({ messages: [], sessionId: null });
  }

  const session = await prisma.chatSession.findFirst({
    where: { visitorId, status: { in: ["OPEN", "HANDOFF"] } },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    sessionId: session?.id ?? null,
    status: session?.status ?? null,
    messages: session?.messages ?? [],
  });
}

const postSchema = z.object({
  message: z.string().min(1).max(2000),
  locale: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const user = await getSessionUser();
    let visitorId = visitorCookie(request);
    const setCookies: string[] = [];

    if (!visitorId) {
      visitorId = createHash("sha256").update(randomUUID()).digest("hex").slice(0, 24);
      setCookies.push(`mc_visitor=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax`);
    }

    let session =
      (parsed.data.sessionId
        ? await prisma.chatSession.findUnique({ where: { id: parsed.data.sessionId } })
        : null) ||
      (await prisma.chatSession.findFirst({
        where: { visitorId, status: { in: ["OPEN", "HANDOFF"] } },
        orderBy: { updatedAt: "desc" },
      }));

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          visitorId,
          userId: user?.id,
          locale: parsed.data.locale ?? "en",
          status: "OPEN",
        },
      });
    }

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "USER",
        body: parsed.data.message,
      },
    });

    const handoff = wantsHumanHandoff(parsed.data.message);
    let reply = aiReply(parsed.data.message, parsed.data.locale ?? session.locale);
    let ticketNumber: string | null = null;

    if (handoff) {
      const dept =
        /bill|invoice|pay/i.test(parsed.data.message)
          ? "Billing"
          : /host|server|vps/i.test(parsed.data.message)
            ? "Hosting"
            : /domain|dns/i.test(parsed.data.message)
              ? "Domain"
              : /sale|quote|website|erp/i.test(parsed.data.message)
                ? "Sales"
                : "Technical Support";
      reply = `Connecting you with ${dept}. I've opened a support ticket from this chat — our team will follow up shortly.`;
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { status: "HANDOFF", userId: user?.id ?? session.userId, department: dept },
      });

      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: nextNumber("TKT"),
          userId: user?.id,
          guestEmail: user?.email,
          guestName: user?.fullName || "Live chat visitor",
          subject: `Live chat → ${dept}: ${parsed.data.message.slice(0, 60)}`,
          department:
            dept === "Billing"
              ? "BILLING"
              : dept === "Hosting"
                ? "HOSTING"
                : dept === "Domain"
                  ? "DOMAIN"
                  : dept === "Sales"
                    ? "SALES"
                    : "TECHNICAL",
          priority: "HIGH",
          channel: "LIVE_CHAT",
          status: "OPEN",
          messages: {
            create: {
              authorId: user?.id,
              authorName: user?.fullName || "Visitor",
              authorRole: "CUSTOMER",
              body: parsed.data.message,
            },
          },
        },
      });
      ticketNumber = ticket.ticketNumber;

      if (user) {
        await notifyUser({
          userId: user.id,
          title: `Chat escalated · ${ticket.ticketNumber}`,
          body: `Routed to ${dept}. An agent will reply on your ticket shortly.`,
          category: "SUPPORT",
          href: "/portal/tickets",
        });
      }
    }

    const aiMsg = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: handoff ? "SYSTEM" : "AI",
        body: reply,
      },
    });

    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date(), userId: user?.id ?? session.userId },
    });

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 40,
    });

    const res = NextResponse.json({
      sessionId: session.id,
      messages,
      latest: aiMsg,
      ticketNumber,
      handoff,
    });
    setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  } catch (error) {
    console.error("[chat]", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
