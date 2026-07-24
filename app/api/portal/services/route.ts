import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";

/** Unified active services view for portal */
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const userId = auth.user.id;
  const [domains, hosting, subscriptions, projects] = await Promise.all([
    prisma.domain.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.hostingAccount.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.erpProject.findMany({
      where: { members: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        milestones: { select: { id: true, title: true, status: true, dueDate: true } },
        tasks: { select: { status: true } },
      },
    }),
  ]);

  return NextResponse.json({
    domains,
    hosting,
    subscriptions,
    projects: projects.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      description: p.description,
      status: p.status,
      progressPct:
        p.milestones.length > 0
          ? Math.round(
              (p.milestones.filter((m) => m.status === "DONE").length / p.milestones.length) * 100
            )
          : p.tasks.length > 0
            ? Math.round((p.tasks.filter((t) => t.status === "DONE").length / p.tasks.length) * 100)
            : p.status === "COMPLETED"
              ? 100
              : 25,
      milestonesDone: p.milestones.filter((m) => m.status === "DONE").length,
      milestonesTotal: p.milestones.length,
    })),
    software: subscriptions.filter((s) =>
      /software|erp|crm|growth|website|ai/i.test(s.productSlug + s.productName)
    ),
  });
}
