import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { routeNewConversation, tryAssignAgent } from "@/lib/chat/agent-router";
import { ensureLeadFromChannel } from "@/lib/crm/channels";
import { autoLinkSessionCustomer, extractIdentifiersFromText } from "@/lib/chat/identify-customer";
import { publishChatEvent } from "@/lib/chat/events";
import {
  sanitizeChatMessageBody,
  sanitizeChatMessages,
} from "@/lib/chat/message-sanitize";

export async function createConversation(opts: {
  visitorId: string;
  userId?: string | null;
  locale?: string;
  channel?: "WEB" | "FLUTTER";
  pageContext?: string | null;
}) {
  const organizationId = await getPrimaryOrganizationId();
  const route = await routeNewConversation({ organizationId });

  const session = await prisma.chatSession.create({
    data: {
      visitorId: opts.visitorId,
      userId: opts.userId || null,
      organizationId,
      locale: opts.locale || "en",
      channel: opts.channel || "WEB",
      status: "OPEN",
      handlerType: route.handlerType,
      agentId: route.handlerType === "AGENT" ? route.agent.id : null,
      aiProvider: route.handlerType === "AI" ? route.aiProvider : null,
    },
  });

  const greeting = sanitizeChatMessageBody(
    route.handlerType === "AGENT" ? "AGENT" : "AI",
    route.handlerType === "AGENT"
      ? `Hi! You're connected with ${route.agent.displayName}. How can we help you today?`
      : `Hello! I'm Aira, your senior technology consultant at MernCrest. What business challenge can I help you solve today — software, ERP, AI, cloud, or hosting?`
  );

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: route.handlerType === "AGENT" ? "AGENT" : "AI",
      body: greeting,
    },
  });

  return {
    session,
    route,
    pageContext: opts.pageContext ?? null,
  };
}

export async function getOrCreateOpenSession(opts: {
  visitorId: string;
  userId?: string | null;
  locale?: string;
  channel?: "WEB" | "FLUTTER";
  sessionId?: string | null;
}) {
  if (opts.sessionId) {
    const existing = await prisma.chatSession.findFirst({
      where: {
        id: opts.sessionId,
        visitorId: opts.visitorId,
        status: { in: ["OPEN", "HANDOFF", "PENDING"] },
      },
    });
    if (existing) return existing;
  }

  const open = await prisma.chatSession.findFirst({
    where: {
      visitorId: opts.visitorId,
      status: { in: ["OPEN", "HANDOFF", "PENDING"] },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (open) return open;

  const { session } = await createConversation(opts);
  return session;
}

export async function listMessages(sessionId: string, take = 100) {
  const rows = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take,
  });
  return sanitizeChatMessages(rows);
}

export async function appendUserMessage(opts: {
  sessionId: string;
  body: string;
  clientMessageId?: string | null;
  attachmentUrl?: string | null;
  userId?: string | null;
  visitorName?: string | null;
}) {
  if (opts.clientMessageId) {
    const dup = await prisma.chatMessage.findFirst({
      where: { sessionId: opts.sessionId, clientMessageId: opts.clientMessageId },
    });
    if (dup) return { message: dup, duplicate: true as const };
  }

  const message = await prisma.chatMessage.create({
    data: {
      sessionId: opts.sessionId,
      role: "USER",
      body: opts.body,
      clientMessageId: opts.clientMessageId || null,
      attachmentUrl: opts.attachmentUrl || null,
    },
  });

  const session = await prisma.chatSession.findUnique({ where: { id: opts.sessionId } });
  if (session) {
    const extracted = extractIdentifiersFromText(opts.body);
    const lead = await ensureLeadFromChannel({
      channel: "LIVE_CHAT",
      fullName: opts.visitorName || "Live chat visitor",
      email: extracted.emails[0] || null,
      phone: extracted.phones[0] || null,
      interest: "Live chat",
      activityType: "CHAT",
      activityBody: opts.body.slice(0, 240),
      channelRef: opts.sessionId,
      userId: opts.userId,
    });
    if (!session.leadId) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { leadId: lead.id, updatedAt: new Date() },
      });
    } else {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      });
    }
    void autoLinkSessionCustomer(opts.sessionId);
    publishChatEvent({ type: "message", sessionId: opts.sessionId, messageId: message.id });
    publishChatEvent({ type: "inbox_updated" });
  }

  return { message, duplicate: false as const };
}

export async function appendSystemMessage(sessionId: string, body: string) {
  const safeBody = sanitizeChatMessageBody("SYSTEM", body);
  const msg = await prisma.chatMessage.create({
    data: { sessionId, role: "SYSTEM", body: safeBody },
  });
  publishChatEvent({ type: "message", sessionId, messageId: msg.id });
  publishChatEvent({ type: "inbox_updated" });
  return msg;
}

export async function appendAgentMessage(opts: {
  sessionId: string;
  body: string;
  clientMessageId?: string | null;
}) {
  if (opts.clientMessageId) {
    const dup = await prisma.chatMessage.findFirst({
      where: { sessionId: opts.sessionId, clientMessageId: opts.clientMessageId },
    });
    if (dup) return dup;
  }
  return prisma.chatMessage.create({
    data: {
      sessionId: opts.sessionId,
      role: "AGENT",
      body: sanitizeChatMessageBody("AGENT", opts.body),
      clientMessageId: opts.clientMessageId || null,
    },
  }).then((msg) => {
    publishChatEvent({ type: "message", sessionId: opts.sessionId, messageId: msg.id });
    publishChatEvent({ type: "inbox_updated" });
    return msg;
  });
}

export async function requestHandoff(sessionId: string, reason?: string) {
  const result = await tryAssignAgent(sessionId);
  if (result.handlerType === "AGENT") {
    await appendSystemMessage(
      sessionId,
      `Connecting you with ${result.agent.displayName}…${reason ? ` (${reason})` : ""}`
    );
  } else {
    const name = result.assistantName || "Aira";
    const body = sanitizeChatMessageBody(
      "AI",
      `No live agent is online right now — I'm ${name}, and I'll keep helping. Ask about services, pricing, billing, or support, or leave your email/phone and a teammate will follow up as soon as someone is available.`
    );
    const msg = await prisma.chatMessage.create({
      data: { sessionId, role: "AI", body },
    });
    publishChatEvent({ type: "message", sessionId, messageId: msg.id });
    publishChatEvent({ type: "inbox_updated" });
  }
  return result;
}

export function sessionHandlerPayload(session: {
  id: string;
  handlerType: string;
  agentId: string | null;
  aiProvider: string | null;
  status: string;
  handoffRequested: boolean;
}) {
  return {
    sessionId: session.id,
    handlerType: session.handlerType,
    agentId: session.agentId,
    aiProvider: session.aiProvider,
    status: session.status,
    handoffRequested: session.handoffRequested,
  };
}
