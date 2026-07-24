import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffOrAdmin } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const expiringDays = Number(searchParams.get("expiringDays") || "30");
  const cutoff = new Date(Date.now() + expiringDays * 86400000);

  const [domains, stats] = await Promise.all([
    prisma.domain.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        provider: { select: { name: true } },
      },
      orderBy: { expiresAt: "asc" },
      take: 200,
    }),
    prisma.domain.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const expiring = domains.filter((d) => d.expiresAt && d.expiresAt <= cutoff);

  return NextResponse.json({
    domains,
    expiring,
    stats: Object.fromEntries(stats.map((s) => [s.status, s._count])),
    total: domains.length,
  });
}
