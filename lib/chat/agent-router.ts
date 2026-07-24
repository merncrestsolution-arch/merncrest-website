import { AgentStatus, type SupportAgent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

export type RouteResult =
  | {
      handlerType: "AGENT";
      agent: Pick<SupportAgent, "id" | "displayName" | "avatarUrl" | "userId">;
      aiProvider: null;
    }
  | {
      handlerType: "AI";
      agent: null;
      aiProvider: string | null;
      assistantName: string;
    };

/**
 * Pick least-loaded ONLINE agent under maxConcurrent; tie-break longest idle.
 * If none available → AI handler.
 */
export async function routeNewConversation(opts?: {
  organizationId?: string;
}): Promise<RouteResult> {
  const organizationId = opts?.organizationId ?? (await getPrimaryOrganizationId());

  const agents = await prisma.supportAgent.findMany({
    where: {
      organizationId,
      status: AgentStatus.ONLINE,
    },
    orderBy: [{ activeChats: "asc" }, { lastSeenAt: "asc" }],
  });

  const available = agents.find((a) => a.activeChats < a.maxConcurrent);

  if (available) {
    await prisma.supportAgent.update({
      where: { id: available.id },
      data: { activeChats: { increment: 1 }, lastSeenAt: new Date() },
    });
    return {
      handlerType: "AGENT",
      agent: {
        id: available.id,
        displayName: available.displayName,
        avatarUrl: available.avatarUrl,
        userId: available.userId,
      },
      aiProvider: null,
    };
  }

  const assistant = await prisma.aiAssistantConfig.findUnique({
    where: { organizationId },
  });
  const primaryProvider = await prisma.aiProviderConfig.findFirst({
    where: { organizationId, isActive: true },
    orderBy: { priority: "asc" },
  });

  return {
    handlerType: "AI",
    agent: null,
    aiProvider: primaryProvider?.provider ?? null,
    assistantName: assistant?.displayName ?? "Aira",
  };
}

/** Re-run routing for handoff mid-conversation. */
export async function tryAssignAgent(sessionId: string): Promise<RouteResult> {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found");

  // Release previous agent slot if any
  if (session.agentId) {
    await releaseAgentChat(session.agentId);
  }

  const result = await routeNewConversation({
    organizationId: session.organizationId ?? undefined,
  });

  if (result.handlerType === "AGENT") {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        handlerType: "AGENT",
        agentId: result.agent.id,
        aiProvider: null,
        handoffRequested: false,
        status: "HANDOFF",
      },
    });
  } else {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        handlerType: "AI",
        agentId: null,
        aiProvider: result.aiProvider,
        handoffRequested: true,
        status: "OPEN",
      },
    });
  }

  return result;
}

export async function releaseAgentChat(agentId: string) {
  await prisma.supportAgent.updateMany({
    where: { id: agentId, activeChats: { gt: 0 } },
    data: { activeChats: { decrement: 1 }, lastSeenAt: new Date() },
  });
}

/**
 * If the session is assigned to an agent who is no longer ONLINE,
 * fall back to Aira so the visitor always gets replies.
 */
export async function ensureLiveHandler(sessionId: string): Promise<"AI" | "AGENT"> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { agent: { select: { id: true, status: true } } },
  });
  if (!session) return "AI";

  if (session.handlerType === "AGENT" && session.agent?.status === AgentStatus.ONLINE) {
    return "AGENT";
  }

  if (session.handlerType === "AGENT") {
    if (session.agentId) await releaseAgentChat(session.agentId);
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        handlerType: "AI",
        agentId: null,
        status: session.status === "HANDOFF" ? "OPEN" : session.status,
      },
    });
  }

  return "AI";
}

export async function closeConversation(sessionId: string) {
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) return;
  if (session.agentId) await releaseAgentChat(session.agentId);
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
}
