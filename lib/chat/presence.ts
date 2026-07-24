import { AgentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

const AWAY_AFTER_MS = 15 * 60 * 1000; // 15 minutes inactivity → AWAY

export async function ensureSupportAgent(userId: string, displayName: string) {
  const organizationId = await getPrimaryOrganizationId();
  return prisma.supportAgent.upsert({
    where: { userId },
    create: {
      userId,
      organizationId,
      displayName,
      status: AgentStatus.OFFLINE,
    },
    update: {
      displayName,
      lastSeenAt: new Date(),
    },
  });
}

export async function setAgentStatus(
  userId: string,
  status: AgentStatus,
  displayName?: string
) {
  const agent = await ensureSupportAgent(userId, displayName || "Agent");
  return prisma.supportAgent.update({
    where: { id: agent.id },
    data: { status, lastSeenAt: new Date() },
  });
}

export async function heartbeatAgent(userId: string) {
  const agent = await prisma.supportAgent.findUnique({ where: { userId } });
  if (!agent) return null;
  return prisma.supportAgent.update({
    where: { id: agent.id },
    data: {
      lastSeenAt: new Date(),
      // Keep ONLINE if they were online; don't auto-revive OFFLINE
      status:
        agent.status === AgentStatus.AWAY ? AgentStatus.ONLINE : agent.status,
    },
  });
}

/** Mark stale ONLINE agents as AWAY (call periodically from presence GET). */
export async function markStaleAgentsAway(organizationId?: string) {
  const orgId = organizationId ?? (await getPrimaryOrganizationId());
  const cutoff = new Date(Date.now() - AWAY_AFTER_MS);
  await prisma.supportAgent.updateMany({
    where: {
      organizationId: orgId,
      status: AgentStatus.ONLINE,
      lastSeenAt: { lt: cutoff },
    },
    data: { status: AgentStatus.AWAY },
  });
}

export async function setAgentOfflineOnLogout(userId: string) {
  await prisma.supportAgent.updateMany({
    where: { userId },
    data: { status: AgentStatus.OFFLINE, lastSeenAt: new Date() },
  });
}
