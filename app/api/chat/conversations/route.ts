import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { resolveVisitor } from "@/lib/chat/visitor";
import { createConversation, listMessages } from "@/lib/chat/conversations";
import { clientIp, rateLimit } from "@/lib/chat/rate-limit";
import { prisma } from "@/lib/db";

const postSchema = z.object({
  locale: z.string().optional(),
  channel: z.enum(["WEB", "FLUTTER"]).optional(),
  pageContext: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const rl = rateLimit({ key: `chat:new:${ip}`, limit: 20, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const user = await getSessionUser();
    const visitor = await resolveVisitor(request);
    const { session, route } = await createConversation({
      visitorId: visitor.visitorId,
      userId: user?.id,
      locale: parsed.data.locale,
      channel: parsed.data.channel,
      pageContext: parsed.data.pageContext,
    });

    const messages = await listMessages(session.id);

    let agent: { id: string; displayName: string; avatarUrl: string | null } | null = null;
    let assistantName: string | null = null;
    if (route.handlerType === "AGENT") {
      agent = {
        id: route.agent.id,
        displayName: route.agent.displayName,
        avatarUrl: route.agent.avatarUrl,
      };
    } else {
      assistantName = route.assistantName;
    }

    const res = NextResponse.json({
      sessionId: session.id,
      visitorToken: visitor.visitorToken,
      handlerType: session.handlerType,
      status: session.status,
      agent,
      assistantName,
      aiProvider: session.aiProvider,
      messages,
    });
    visitor.setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  } catch (error) {
    console.error("[chat/conversations POST]", error);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const visitor = await resolveVisitor(request);
    const session = await prisma.chatSession.findFirst({
      where: {
        visitorId: visitor.visitorId,
        status: { in: ["OPEN", "HANDOFF", "PENDING"] },
      },
      include: {
        agent: { select: { id: true, displayName: true, avatarUrl: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!session) {
      const res = NextResponse.json({ sessionId: null, messages: [] });
      visitor.setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
      return res;
    }

    const messages = await listMessages(session.id);
    const assistant =
      session.handlerType === "AI" && session.organizationId
        ? await prisma.aiAssistantConfig.findUnique({
            where: { organizationId: session.organizationId },
          })
        : null;

    const res = NextResponse.json({
      sessionId: session.id,
      visitorToken: visitor.visitorToken,
      handlerType: session.handlerType,
      status: session.status,
      handoffRequested: session.handoffRequested,
      agent: session.agent
        ? {
            id: session.agent.id,
            displayName: session.agent.displayName,
            avatarUrl: session.agent.avatarUrl,
            online: session.agent.status === "ONLINE",
          }
        : null,
      assistantName: assistant?.displayName ?? "Aira",
      aiProvider: session.aiProvider,
      messages,
    });
    visitor.setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  } catch (error) {
    console.error("[chat/conversations GET]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
