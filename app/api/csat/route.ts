import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requireStaff } from "@/lib/commerce";
import { z } from "zod";

const schema = z.object({
  channel: z.enum(["TICKET", "CALL", "MEETING", "PROJECT", "CHAT", "GENERAL"]),
  referenceId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  npsScore: z.number().int().min(0).max(10).optional(),
  feedback: z.string().max(2000).optional(),
  suggestions: z.string().max(2000).optional(),
  userId: z.string().optional(),
  leadId: z.string().optional(),
});

/** Collect CSAT / NPS after ticket, call, meeting, project */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid CSAT payload" }, { status: 400 });
  }

  const auth = await requireUser();
  if (auth.error && !parsed.data.userId) return auth.error;

  const record = await prisma.customerSatisfaction.create({
    data: {
      userId: auth.user?.id || parsed.data.userId || null,
      leadId: parsed.data.leadId,
      channel: parsed.data.channel,
      referenceId: parsed.data.referenceId,
      rating: parsed.data.rating,
      npsScore: parsed.data.npsScore,
      feedback: parsed.data.feedback,
      suggestions: parsed.data.suggestions,
    },
  });

  return NextResponse.json({ satisfaction: record }, { status: 201 });
}

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const rows = await prisma.customerSatisfaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const avg =
    rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10
      : null;

  return NextResponse.json({ rows, avg, count: rows.length });
}
