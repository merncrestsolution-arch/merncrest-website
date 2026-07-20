import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";

/** ERP / system audit log (searchable) */
export async function GET(request: Request) {
  const auth = await requirePermission(["erp.analytics.view", "erp.permissions.manage"]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const module = searchParams.get("module");
  const action = searchParams.get("action");
  const q = searchParams.get("q");
  const take = Math.min(Number(searchParams.get("limit") || 50), 200);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(module ? { module } : {}),
      ...(action ? { action } : {}),
      ...(q
        ? {
            OR: [
              { summary: { contains: q, mode: "insensitive" } },
              { actorEmail: { contains: q, mode: "insensitive" } },
              { actorName: { contains: q, mode: "insensitive" } },
              { entityId: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const byModule = await prisma.auditLog.groupBy({
    by: ["module"],
    _count: { _all: true },
  });

  return NextResponse.json({
    logs,
    stats: Object.fromEntries(byModule.map((m) => [m.module, m._count._all])),
  });
}
