import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { resolveVisitor } from "@/lib/chat/visitor";
import { sanitizeChatMessages } from "@/lib/chat/message-sanitize";
import {
  appendUserMessage,
  getOrCreateOpenSession,
  listMessages,
  requestHandoff,
} from "@/lib/chat/conversations";
import { clientIp, rateLimit } from "@/lib/chat/rate-limit";
import { wantsHumanHandoff } from "@/lib/support/ai-replies";
import { z } from "zod";

/** Legacy adapter — prefer /api/chat/conversations */

export async function GET(request: Request) {
  const visitor = await resolveVisitor(request);
  const url = new URL(request.url);
  const storedSessionId = url.searchParams.get("sessionId");

  const openWhere = {
    visitorId: visitor.visitorId,
    status: { in: ["OPEN", "HANDOFF", "PENDING"] as string[] },
  };

  let session = await prisma.chatSession.findFirst({
    where: openWhere,
    include: {
      agent: { select: { id: true, displayName: true, avatarUrl: true, status: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 40 },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Return recently closed session so visitor can submit CSAT
  if (!session && storedSessionId) {
    session = await prisma.chatSession.findFirst({
      where: {
        id: storedSessionId,
        visitorId: visitor.visitorId,
        status: "CLOSED",
        csatRequestedAt: { not: null },
        csatRating: null,
      },
      include: {
        agent: { select: { id: true, displayName: true, avatarUrl: true, status: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 40 },
      },
    });
  }

  const res = NextResponse.json({
    sessionId: session?.id ?? null,
    status: session?.status ?? null,
    handlerType: session?.handlerType ?? null,
    csatRequested: Boolean(session?.csatRequestedAt && !session?.csatRating),
    csatRating: session?.csatRating ?? null,
    agent: session?.agent
      ? {
          id: session.agent.id,
          displayName: session.agent.displayName,
          avatarUrl: session.agent.avatarUrl,
          online: session.agent.status === "ONLINE",
        }
      : null,
    messages: sanitizeChatMessages(session?.messages ?? []),
  });
  visitor.setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
  return res;
}

const postSchema = z.object({
  message: z.string().min(1).max(2000),
  locale: z.string().max(16).optional(),
  sessionId: z.string().max(64).optional(),
  clientMessageId: z.string().min(1).max(120).optional(),
  pageContext: z.string().max(500).optional(),
  visitorName: z.string().max(120).optional(),
  visitorEmail: z.string().max(200).optional(),
  visitorPhone: z.string().max(40).optional(),
  visitorInterest: z.string().max(200).optional(),
});

function normalizeChatBody(raw: unknown) {
  if (!raw || typeof raw !== "object") return raw;
  const body = { ...(raw as Record<string, unknown>) };
  if (typeof body.message === "string") body.message = body.message.trim().slice(0, 2000);
  if (typeof body.pageContext === "string") body.pageContext = body.pageContext.slice(0, 500);
  if (typeof body.visitorName === "string") body.visitorName = body.visitorName.slice(0, 120);
  if (typeof body.visitorEmail === "string") body.visitorEmail = body.visitorEmail.slice(0, 200);
  if (typeof body.visitorPhone === "string") body.visitorPhone = body.visitorPhone.slice(0, 40);
  if (typeof body.visitorInterest === "string") body.visitorInterest = body.visitorInterest.slice(0, 200);
  if (typeof body.clientMessageId === "string") {
    body.clientMessageId = body.clientMessageId.slice(0, 120);
    if (body.clientMessageId.length < 1) delete body.clientMessageId;
  } else {
    delete body.clientMessageId;
  }
  if (body.sessionId === "" || body.sessionId == null) delete body.sessionId;
  return body;
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const rl = rateLimit({ key: `chat:legacy:${ip}`, limit: 60, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = normalizeChatBody(await request.json());
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[chat] invalid body", parsed.error.flatten());
      return NextResponse.json({ error: "Invalid message", details: parsed.error.flatten() }, { status: 400 });
    }

    const user = await getSessionUser();
    const visitor = await resolveVisitor(request);

    const session = await getOrCreateOpenSession({
      visitorId: visitor.visitorId,
      userId: user?.id,
      locale: parsed.data.locale,
      sessionId: parsed.data.sessionId,
      channel: "WEB",
    });

    if (
      !session.leadId &&
      parsed.data.visitorName &&
      (parsed.data.visitorEmail || parsed.data.visitorPhone)
    ) {
      const { linkChatVisitorToCrm } = await import("@/lib/chat/link-visitor-lead");
      await linkChatVisitorToCrm({
        sessionId: session.id,
        fullName: parsed.data.visitorName,
        email: parsed.data.visitorEmail,
        phone: parsed.data.visitorPhone,
        interest: parsed.data.visitorInterest,
        userId: user?.id,
        activityBody: `Chat message: ${parsed.data.message.slice(0, 200)}`,
      });
    }

    await appendUserMessage({
      sessionId: session.id,
      body: parsed.data.message,
      clientMessageId: parsed.data.clientMessageId,
      userId: user?.id,
      visitorName: parsed.data.visitorName || user?.fullName,
    });

    let handoff = false;
    let ticketNumber: string | null = null;
    let assignedToLiveAgent = false;

    // If assigned agent went offline, reclaim for Aira before answering
    const { ensureLiveHandler } = await import("@/lib/chat/agent-router");
    await ensureLiveHandler(session.id);

    if (wantsHumanHandoff(parsed.data.message)) {
      const route = await requestHandoff(session.id, "Customer requested human");
      handoff = true;
      assignedToLiveAgent = route.handlerType === "AGENT";
    }

    let aiMsg = null;
    const fresh = await prisma.chatSession.findUnique({ where: { id: session.id } });
    // Aira replies whenever no live agent is on the chat (including failed handoff,
    // where requestHandoff already posted her "no agent online" message).
    if (fresh?.handlerType === "AI" && !assignedToLiveAgent && !handoff) {
      const { handleAiTurn } = await import("@/lib/ai/chat-orchestrator");
      aiMsg = await handleAiTurn({
        sessionId: session.id,
        userMessage: parsed.data.message,
        pageContext: parsed.data.pageContext,
        locale: parsed.data.locale ?? session.locale,
      });
    }

    const messages = await listMessages(session.id, 40);
    const latestAi =
      aiMsg ||
      [...messages].reverse().find((m) => m.role === "AI") ||
      null;
    const res = NextResponse.json({
      sessionId: session.id,
      messages,
      latest: latestAi,
      ticketNumber,
      handoff,
      handlerType: fresh?.handlerType ?? session.handlerType,
    });
    visitor.setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  } catch (error) {
    console.error("[chat]", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
