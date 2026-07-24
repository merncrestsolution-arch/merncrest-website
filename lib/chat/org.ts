import { prisma } from "@/lib/db";

let cachedOrgId: string | null = null;

/** Primary tenant (MCS). Never take organizationId from the client. */
export async function getPrimaryOrganizationId(): Promise<string> {
  if (cachedOrgId) return cachedOrgId;

  const org =
    (await prisma.organization.findFirst({
      where: { isPrimary: true, deletedAt: null },
      select: { id: true },
    })) ||
    (await prisma.organization.findUnique({
      where: { code: "MCS" },
      select: { id: true },
    })) ||
    (await prisma.organization.create({
      data: {
        code: "MCS",
        name: "MernCrest Solutions",
        isPrimary: true,
        status: "ACTIVE",
      },
      select: { id: true },
    }));

  cachedOrgId = org.id;
  return org.id;
}
