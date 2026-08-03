import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { resolveVisitor } from "@/lib/chat/visitor";
import {
  appendAgentMessage,
  appendUserMessage,
  listMessages,
  requestHandoff,
} from "@/lib/chat/conversations";
import { clientIp, rateLimit } from "@/lib/chat/rate-limit";
import { prisma } from "@/lib/db";
import { wantsHumanHandoff } from "@/lib/support/ai-replies";
import { validateChatAttachmentUrl } from "@/lib/security/upload-policy";

const postSchema = z.object({
  message: z.string().min(1).max(4000),
  clientMessageId: z.string().min(8).max(80).optional(),
  attachmentUrl: z.string().url().optional().or(z.literal("")),
  pageContext: z.string().max(500).optional(),
  visitorName: z.string().max(120).optional(),
  asAgent: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  const visitor = await resolveVisitor(request);

  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: { agent: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isStaff = user && isStaffRole(user.role);
  const isOwner = session.visitorId === visitor.visitorId || session.userId === user?.id;
  if (!isStaff && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await listMessages(id);
  return NextResponse.json({
    sessionId: id,
    handlerType: session.handlerType,
    status: session.status,
    agent: session.agent
      ? {
          id: session.agent.id,
          displayName: session.agent.displayName,
          avatarUrl: session.agent.avatarUrl,
        }
      : null,
    messages,
  });
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const ip = clientIp(request);
    const rl = rateLimit({ key: `chat:msg:${ip}`, limit: 60, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    if (parsed.data.attachmentUrl) {
      const fileCheck = validateChatAttachmentUrl(parsed.data.attachmentUrl);
      if (!fileCheck.ok) {
        return NextResponse.json({ error: fileCheck.reason }, { status: 400 });
      }
    }

    const user = await getSessionUser();
    const visitor = await resolveVisitor(request);
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: { agent: true },
    });
    if (!session || ["CLOSED", "RESOLVED"].includes(session.status)) {
      return NextResponse.json({ error: "Conversation closed" }, { status: 400 });
    }

    const isStaff = user && isStaffRole(user.role);
    const isOwner = session.visitorId === visitor.visitorId || session.userId === user?.id;

    // Agent reply
    if (parsed.data.asAgent) {
      if (!isStaff || !user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const { ensureSupportAgent } = await import("@/lib/chat/presence");
      const agent = await ensureSupportAgent(user.id, user.fullName);
      const msg = await appendAgentMessage({
        sessionId: id,
        body: parsed.data.message,
        clientMessageId: parsed.data.clientMessageId,
      });
      await prisma.chatSession.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          status: "HANDOFF",
          handlerType: "AGENT",
          agentId: agent.id,
          handoffRequested: false,
        },
      });
      // Mark agent online while they are actively replying
      await prisma.supportAgent.update({
        where: { id: agent.id },
        data: { status: "ONLINE", lastSeenAt: new Date() },
      });
      const messages = await listMessages(id);
      return NextResponse.json({
        sessionId: id,
        messages,
        latest: msg,
        handlerType: "AGENT",
      });
    }

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { message, duplicate } = await appendUserMessage({
      sessionId: id,
      body: parsed.data.message,
      clientMessageId: parsed.data.clientMessageId,
      attachmentUrl: parsed.data.attachmentUrl || null,
      userId: user?.id,
      visitorName: parsed.data.visitorName || user?.fullName,
    });

    if (duplicate) {
      const messages = await listMessages(id);
      return NextResponse.json({ sessionId: id, messages, latest: message, duplicate: true });
    }

    const { ensureLiveHandler } = await import("@/lib/chat/agent-router");
    await ensureLiveHandler(id);

    // Explicit human request
    let handoff = false;
    let assignedToLiveAgent = false;
    const live = await prisma.chatSession.findUnique({ where: { id } });
    if (wantsHumanHandoff(parsed.data.message) && live?.handlerType !== "AGENT") {
      const route = await requestHandoff(id, "Customer requested human");
      handoff = true;
      assignedToLiveAgent = route.handlerType === "AGENT";
    }

    // Aira replies when no live agent is handling the chat
    let aiLatest = null;
    const fresh = await prisma.chatSession.findUnique({ where: { id } });
    if (fresh?.handlerType === "AI" && !assignedToLiveAgent && !handoff) {
      const { handleAiTurn } = await import("@/lib/ai/chat-orchestrator");
      aiLatest = await handleAiTurn({
        sessionId: id,
        userMessage: parsed.data.message,
        pageContext: parsed.data.pageContext,
        locale: session.locale,
      });
    }

    const messages = await listMessages(id);
    const latestAi =
      aiLatest ||
      [...messages].reverse().find((m) => m.role === "AI") ||
      message;
    const res = NextResponse.json({
      sessionId: id,
      messages,
      latest: latestAi,
      handoff,
      handlerType: fresh?.handlerType ?? session.handlerType,
    });
    visitor.setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  } catch (error) {
    console.error("[chat/messages POST]", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
