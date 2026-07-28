import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/commerce";
import { suggestAgentReplies } from "@/lib/ai/suggestion-engine";
import { buildChatSupportContext } from "@/lib/chat/support-context";
import { sanitizeChatReply } from "@/lib/support/sanitize-chat-reply";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const [{ replies, source }, ctx] = await Promise.all([
    suggestAgentReplies({ sessionId, actorId: auth.user.id }),
    buildChatSupportContext(sessionId),
  ]);

  return NextResponse.json({
    replies: replies.map((r) => sanitizeChatReply(r)),
    source,
    diagnostics: ctx?.diagnostics || [],
    detectedCategories: ctx?.detectedCategories || [],
  });
}
