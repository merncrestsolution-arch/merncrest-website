import { subscribeChatEvents } from "@/lib/chat/events";
import { requireStaff } from "@/lib/commerce";

/** SSE stream for staff live-chat inbox updates */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: "connected", scope: "inbox" });

      const unsub = subscribeChatEvents({ inbox: true }, (event) => {
        send(event);
      });

      const heartbeat = setInterval(() => {
        send({ type: "ping", at: Date.now() });
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
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
