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
    }),
  ]);

  return NextResponse.json({
    domains,
    hosting,
    subscriptions,
    projects,
    software: subscriptions.filter((s) =>
      /software|erp|crm|growth|website|ai/i.test(s.productSlug + s.productName)
    ),
  });
}
