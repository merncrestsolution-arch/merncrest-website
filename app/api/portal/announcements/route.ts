import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { startsAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ announcements });
}
