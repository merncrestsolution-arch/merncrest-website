import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/commerce";
import { buildChatSupportContext } from "@/lib/chat/support-context";

/** Smart Live Support Panel — session-scoped customer 360 + diagnostics */
export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { sessionId } = await context.params;
  const ctx = await buildChatSupportContext(sessionId);

  if (!ctx) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ context: ctx });
}
