import { subscribeChatEvents } from "@/lib/chat/events";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { resolveVisitor } from "@/lib/chat/visitor";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/** SSE stream for live chat session updates (replaces polling) */
export async function GET(request: Request, ctx: Ctx) {
  const { id: sessionId } = await ctx.params;
  const user = await getSessionUser();
  const visitor = await resolveVisitor(request);

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const isStaff = user && isStaffRole(user.role);
  const isOwner = session.visitorId === visitor.visitorId || session.userId === user?.id;
  if (!isStaff && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: "connected", sessionId });

      const unsub = subscribeChatEvents({ sessionId }, (event) => {
        send(event);
      });

      const heartbeat = setInterval(() => {
        send({ type: "ping", at: Date.now() });
      }, 25000);

      const onAbort = () => {
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
