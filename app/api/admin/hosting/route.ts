import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffOrAdmin } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const expiringDays = Number(searchParams.get("expiringDays") || "30");
  const cutoff = new Date(Date.now() + expiringDays * 86400000);

  const accounts = await prisma.hostingAccount.findMany({
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      provider: { select: { name: true } },
    },
    orderBy: { renewsAt: "asc" },
    take: 200,
  });

  const sslIssues = accounts.filter((a) =>
    ["PENDING", "EXPIRED", "FAILED", "NONE", "MISSING"].includes(a.sslStatus)
  );
  const expiring = accounts.filter((a) => a.renewsAt && a.renewsAt <= cutoff);

  const avgCpu =
    accounts.length > 0
      ? Math.round(accounts.reduce((s, a) => s + a.cpuPercent, 0) / accounts.length)
      : 0;

  return NextResponse.json({
    accounts,
    expiring,
    sslIssues,
    stats: {
      total: accounts.length,
      active: accounts.filter((a) => a.status === "ACTIVE").length,
      avgCpuPercent: avgCpu,
    },
  });
}
