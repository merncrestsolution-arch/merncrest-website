import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveVisitor } from "@/lib/chat/visitor";
import { appendSystemMessage } from "@/lib/chat/conversations";
import { publishChatEvent } from "@/lib/chat/events";

const schema = z.object({
  sessionId: z.string().min(1).max(64),
  requestCsat: z.boolean().optional(),
});

/** Visitor ends their chat (e.g. on browser close) — optional CSAT request. */
export async function POST(request: Request) {
  try {
    const visitor = await resolveVisitor(request);
    const raw =
      request.headers.get("content-type")?.includes("application/json")
        ? await request.json()
        : JSON.parse(await request.text());

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        id: parsed.data.sessionId,
        visitorId: visitor.visitorId,
        status: { in: ["OPEN", "HANDOFF", "PENDING"] },
      },
    });

    if (!session) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const requestCsat = parsed.data.requestCsat !== false;

    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        csatRequestedAt: requestCsat ? new Date() : null,
      },
    });

    if (requestCsat) {
      await appendSystemMessage(
        session.id,
        "Thanks for chatting with us! If you have a moment, we'd love your feedback — rate your experience when you return."
      );
    }

    publishChatEvent({ type: "session_closed", sessionId: session.id });
    publishChatEvent({ type: "inbox_updated" });

    const res = NextResponse.json({ ok: true, sessionId: session.id, requestCsat });
    visitor.setCookies.forEach((c) => res.headers.append("Set-Cookie", c));
    return res;
  } catch (error) {
    console.error("[chat/end-session]", error);
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}
