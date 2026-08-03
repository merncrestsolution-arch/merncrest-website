import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { prisma } from "@/lib/db";
import { ensureSupportAgent } from "@/lib/chat/presence";
import {
  convertChatToLead,
  convertChatToTicket,
  transferChatToAgent,
  closeChatSession,
} from "@/lib/chat/staff-actions";
import { getSessionCustomerHint } from "@/lib/chat/support-context";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const agent = await ensureSupportAgent(auth.user.id, auth.user.fullName);

  const pinnedRows = await prisma.chatSessionPin.findMany({
    where: { agentId: agent.id },
    select: { sessionId: true },
  });
  const pinnedSet = new Set(pinnedRows.map((p) => p.sessionId));

  const sessions = await prisma.chatSession.findMany({
    where: {
      status: { in: ["OPEN", "HANDOFF", "PENDING"] },
      channel: { in: ["WEB", "FLUTTER"] },
      OR: [
        { agentId: agent.id },
        { handoffRequested: true },
        { handlerType: "AI" },
        { handlerType: "AGENT" },
      ],
    },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      lead: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          company: true,
          stage: true,
        },
      },
      agent: { select: { id: true, displayName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return NextResponse.json({
    agentId: agent.id,
    conversations: await Promise.all(
      sessions.map(async (s) => {
        const hint = await getSessionCustomerHint(s.id);
        return {
          id: s.id,
          status: s.status,
          handlerType: s.handlerType,
          channel: s.channel,
          handoffRequested: s.handoffRequested,
          visitorId: s.visitorId,
          lead: s.lead,
          agent: s.agent,
          lastMessage: s.messages[0] || null,
          updatedAt: s.updatedAt,
          pinned: pinnedSet.has(s.id),
          isKnownCustomer: hint.isKnownCustomer,
          customerCode: hint.customerCode,
        };
      })
    ),
  });
}

const actionSchema = z.object({
  sessionId: z.string(),
  action: z.enum(["to_ticket", "to_lead", "transfer", "close", "pin", "unpin"]),
  targetAgentId: z.string().optional(),
  subject: z.string().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const { sessionId, action } = parsed.data;
    const agent = await ensureSupportAgent(auth.user.id, auth.user.fullName);

    if (action === "pin") {
      await prisma.chatSessionPin.upsert({
        where: { agentId_sessionId: { agentId: agent.id, sessionId } },
        create: { agentId: agent.id, sessionId },
        update: {},
      });
      return NextResponse.json({ ok: true, pinned: true });
    }

    if (action === "unpin") {
      await prisma.chatSessionPin.deleteMany({
        where: { agentId: agent.id, sessionId },
      });
      return NextResponse.json({ ok: true, pinned: false });
    }

    if (action === "to_ticket") {
      const ticket = await convertChatToTicket({
        sessionId,
        staffUserId: auth.user.id,
        staffName: auth.user.fullName,
        subject: parsed.data.subject,
      });
      return NextResponse.json({ ticket });
    }

    if (action === "to_lead") {
      const lead = await convertChatToLead({
        sessionId,
        staffUserId: auth.user.id,
        staffName: auth.user.fullName,
      });
      return NextResponse.json({ lead });
    }

    if (action === "transfer") {
      if (!parsed.data.targetAgentId) {
        return NextResponse.json({ error: "targetAgentId required" }, { status: 400 });
      }
      const result = await transferChatToAgent({
        sessionId,
        targetAgentId: parsed.data.targetAgentId,
        staffUserId: auth.user.id,
        staffName: auth.user.fullName,
      });
      return NextResponse.json(result);
    }

    if (action === "close") {
      await closeChatSession({
        sessionId,
        staffUserId: auth.user.id,
        staffName: auth.user.fullName,
        requestCsat: true,
      });
      return NextResponse.json({ ok: true, csatRequested: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Action failed" },
      { status: 400 }
    );
  }
}
