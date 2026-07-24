import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const [reviews, targets, entries] = await Promise.all([
    prisma.performanceReview.findMany({
      where: {
        OR: [{ subjectId: auth.user.id }, { reviewerId: auth.user.id }],
      },
      include: {
        subject: { select: { fullName: true } },
        reviewer: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.kpiTarget.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.kpiEntry.findMany({
      where: { userId: auth.user.id },
      orderBy: { recordedAt: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({ reviews, targets, entries });
}

const reviewSchema = z.object({
  action: z.enum(["SELF", "CREATE"]),
  reviewId: z.string().optional(),
  periodLabel: z.string().optional(),
  selfScore: z.number().int().min(1).max(5).optional(),
  selfNotes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  if (parsed.data.action === "CREATE") {
    const review = await prisma.performanceReview.create({
      data: {
        subjectId: auth.user.id,
        periodLabel: parsed.data.periodLabel || new Date().toISOString().slice(0, 7),
        status: "DRAFT",
      },
    });
    return NextResponse.json({ review }, { status: 201 });
  }

  if (!parsed.data.reviewId) {
    return NextResponse.json({ error: "reviewId required" }, { status: 400 });
  }

  const review = await prisma.performanceReview.update({
    where: { id: parsed.data.reviewId },
    data: {
      selfScore: parsed.data.selfScore,
      selfNotes: parsed.data.selfNotes,
      status: "SELF_DONE",
    },
  });
  return NextResponse.json({ review });
}
