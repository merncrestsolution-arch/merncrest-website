import { NextResponse } from "next/server";
import { AgentStatus } from "@prisma/client";
import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import {
  ensureSupportAgent,
  heartbeatAgent,
  markStaleAgentsAway,
  setAgentStatus,
} from "@/lib/chat/presence";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  await markStaleAgentsAway();
  await heartbeatAgent(auth.user.id);

  const organizationId = await getPrimaryOrganizationId();
  const me = await ensureSupportAgent(auth.user.id, auth.user.fullName);
  const agents = await prisma.supportAgent.findMany({
    where: { organizationId },
    include: { user: { select: { email: true, fullName: true } } },
    orderBy: { displayName: "asc" },
  });

  return NextResponse.json({
    me: {
      id: me.id,
      status: me.status,
      activeChats: me.activeChats,
      maxConcurrent: me.maxConcurrent,
      displayName: me.displayName,
    },
    agents: agents.map((a) => ({
      id: a.id,
      displayName: a.displayName,
      status: a.status,
      activeChats: a.activeChats,
      maxConcurrent: a.maxConcurrent,
      lastSeenAt: a.lastSeenAt,
      email: a.user.email,
    })),
  });
}

const patchSchema = z.object({
  status: z.enum(["ONLINE", "AWAY", "OFFLINE"]),
  displayName: z.string().min(1).max(80).optional(),
  maxConcurrent: z.number().int().min(1).max(50).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let agent = await setAgentStatus(
    auth.user.id,
    parsed.data.status as AgentStatus,
    parsed.data.displayName || auth.user.fullName
  );

  if (parsed.data.maxConcurrent != null) {
    agent = await prisma.supportAgent.update({
      where: { id: agent.id },
      data: { maxConcurrent: parsed.data.maxConcurrent },
    });
  }

  return NextResponse.json({
    me: {
      id: agent.id,
      status: agent.status,
      activeChats: agent.activeChats,
      maxConcurrent: agent.maxConcurrent,
      displayName: agent.displayName,
    },
  });
}
