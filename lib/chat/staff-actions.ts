import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { ensureLeadFromChannel } from "@/lib/crm/channels";
import { writeAuditLog } from "@/lib/erp/audit";
import { appendSystemMessage } from "@/lib/chat/conversations";
import { publishChatEvent } from "@/lib/chat/events";
import { publishChatEvent } from "@/lib/chat/events";

export async function convertChatToTicket(params: {
  sessionId: string;
  staffUserId: string;
  staffName: string;
  subject?: string;
}) {
  const session = await prisma.chatSession.findUnique({
    where: { id: params.sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 30 },
      lead: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
  });
  if (!session) throw new Error("Chat not found");

  const transcript = session.messages
    .map((m) => `[${m.role}] ${m.body}`)
    .join("\n")
    .slice(0, 4000);

  const userId =
    session.userId ||
    (session.lead?.email
      ? (
          await prisma.user.findFirst({
            where: { email: session.lead.email },
            select: { id: true },
          })
        )?.id
      : null);

  if (!userId) {
    throw new Error("No customer account linked — convert to lead first or capture visitor email");
  }

  const subject =
    params.subject ||
    `Live chat · ${session.lead?.fullName || session.visitorId.slice(-8)}`;

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: nextNumber("TKT"),
      userId,
      subject,
      department: session.department || "GENERAL",
      category: "LIVE_CHAT",
      priority: session.handoffRequested ? "HIGH" : "MEDIUM",
      channel: "LIVE_CHAT",
      status: "OPEN",
      responseDueAt: new Date(Date.now() + 4 * 3600_000),
      resolveDueAt: new Date(Date.now() + 24 * 3600_000),
      assigneeId: params.staffUserId,
      assigneeName: params.staffName,
      messages: {
        create: [
          {
            authorId: params.staffUserId,
            authorName: params.staffName,
            authorRole: "SYSTEM",
            body: `Converted from live chat session ${session.id}`,
            internal: true,
          },
          {
            authorId: params.staffUserId,
            authorName: "Chat transcript",
            authorRole: "SYSTEM",
            body: transcript || "(empty transcript)",
            internal: true,
          },
        ],
      },
    },
  });

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  publishChatEvent({ type: "session_closed", sessionId: session.id });
  publishChatEvent({ type: "inbox_updated" });

  await writeAuditLog({
    actorId: params.staffUserId,
    actorName: params.staffName,
    action: "CHAT_TO_TICKET",
    module: "CHAT",
    entityType: "Ticket",
    entityId: ticket.id,
    summary: `Chat → ${ticket.ticketNumber}`,
  });

  return ticket;
}

export async function convertChatToLead(params: {
  sessionId: string;
  staffUserId: string;
  staffName: string;
}) {
  const session = await prisma.chatSession.findUnique({
    where: { id: params.sessionId },
    include: { lead: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!session) throw new Error("Chat not found");

  if (session.leadId && session.lead) {
    return session.lead;
  }

  const lead = await ensureLeadFromChannel({
    channel: "LIVE_CHAT",
    fullName: session.lead?.fullName || `Visitor ${session.visitorId.slice(-6)}`,
    email: session.lead?.email || undefined,
    phone: session.lead?.phone || undefined,
    activityType: "CHAT_CONVERT",
    activityBody: `Staff converted chat to CRM lead`,
    channelRef: session.id,
    userId: params.staffUserId,
  });

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { leadId: lead.id },
  });

  await writeAuditLog({
    actorId: params.staffUserId,
    actorName: params.staffName,
    action: "CHAT_TO_LEAD",
    module: "CRM",
    entityType: "CrmLead",
    entityId: lead.id,
    summary: `Chat → lead ${lead.leadNumber || lead.id}`,
  });

  return lead;
}

export async function transferChatToAgent(params: {
  sessionId: string;
  targetAgentId: string;
  staffUserId: string;
  staffName: string;
}) {
  const session = await prisma.chatSession.findUnique({ where: { id: params.sessionId } });
  if (!session) throw new Error("Chat not found");

  const agent = await prisma.supportAgent.findUnique({
    where: { id: params.targetAgentId },
  });
  if (!agent) throw new Error("Agent not found");

  await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      agentId: agent.id,
      handlerType: "AGENT",
      handoffRequested: false,
      status: "HANDOFF",
    },
  });

  const msg = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "SYSTEM",
      body: `Chat transferred to ${agent.displayName} by ${params.staffName}.`,
    },
  });
  publishChatEvent({ type: "message", sessionId: session.id, messageId: msg.id });
  publishChatEvent({ type: "inbox_updated" });

  return { agentId: agent.id, displayName: agent.displayName };
}

export async function closeChatSession(params: {
  sessionId: string;
  staffUserId: string;
  staffName: string;
  requestCsat?: boolean;
}) {
  const session = await prisma.chatSession.findUnique({ where: { id: params.sessionId } });
  if (!session) throw new Error("Chat not found");
  if (session.status === "CLOSED") return session;

  const requestCsat = params.requestCsat !== false;

  await prisma.chatSession.update({
    where: { id: params.sessionId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      csatRequestedAt: requestCsat ? new Date() : null,
    },
  });

  await appendSystemMessage(
    params.sessionId,
    requestCsat
      ? "This chat has been closed. How was your experience? Please rate us below — your feedback helps us improve."
      : "This chat has been closed. Thank you for contacting MernCrest!"
  );

  publishChatEvent({ type: "session_closed", sessionId: params.sessionId });
  publishChatEvent({ type: "inbox_updated" });

  await writeAuditLog({
    actorId: params.staffUserId,
    actorName: params.staffName,
    action: "CHAT_CLOSED",
    module: "CHAT",
    entityType: "ChatSession",
    entityId: params.sessionId,
    summary: `Closed live chat${requestCsat ? " (CSAT requested)" : ""}`,
  });

  return prisma.chatSession.findUnique({ where: { id: params.sessionId } });
}
