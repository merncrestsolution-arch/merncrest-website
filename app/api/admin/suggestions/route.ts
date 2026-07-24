import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { logSuggestionAction, suggestForLead } from "@/lib/ai/suggestion-engine";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const leadId = url.searchParams.get("leadId") || undefined;
  const sessionId = url.searchParams.get("sessionId") || undefined;
  const requestText = url.searchParams.get("q") || undefined;

  const suggestions = await suggestForLead({
    leadId,
    sessionId,
    requestText,
    actorId: auth.user.id,
  });

  return NextResponse.json({ suggestions });
}

const postSchema = z.object({
  action: z.enum(["ACCEPTED", "DISMISSED"]),
  eventId: z.string().optional(),
  leadId: z.string().optional(),
  sessionId: z.string().optional(),
  suggestionJson: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  await logSuggestionAction({ ...parsed.data, actorId: auth.user.id });
  return NextResponse.json({ ok: true });
}
