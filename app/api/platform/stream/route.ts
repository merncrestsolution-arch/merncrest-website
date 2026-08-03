import { getSessionUser, hashToken, isStaffRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publishStaffKpiSnapshot } from "@/lib/platform/publish";
import {
  subscribePlatformSync,
  type PlatformSyncEvent,
} from "@/lib/platform/sync-events";

async function resolveStreamUser(request: Request) {
  const user = await getSessionUser(request);
  if (user) return user;

  const url = new URL(request.url);
  const token = url.searchParams.get("access_token")?.trim();
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    fullName: session.user.fullName,
    company: session.user.company,
    role: session.user.role as "OWNER" | "ADMIN" | "STAFF" | "CUSTOMER",
    emailVerifiedAt: session.user.emailVerifiedAt,
  };
}

/**
 * SSE auto-sync stream — website · system · mobile (Bearer via `?access_token=` for mobile).
 */
export async function GET(request: Request) {
  const user = await resolveStreamUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const staff = isStaffRole(user.role);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: PlatformSyncEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({
        type: "connected",
        userId: user.id,
        surface: staff ? "staff" : "customer",
      });

      void publishStaffKpiSnapshot(user.id);

      const unsubUser = subscribePlatformSync({ userId: user.id }, (event) => {
        if (event.type !== "ping" && event.type !== "connected") send(event);
      });

      const unsubStaff = staff
        ? subscribePlatformSync({ staff: true }, (event) => {
            if (
              event.type === "chat_inbox" ||
              event.type === "chat_message" ||
              event.type === "announcement" ||
              event.type === "ticket" ||
              event.type === "crm_update"
            ) {
              send(event);
            }
          })
        : () => undefined;

      const heartbeat = setInterval(() => {
        send({ type: "ping", at: Date.now() });
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubUser();
        unsubStaff();
        try {
          controller.close();
        } catch {
          /* closed */
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
