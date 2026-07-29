import { prisma } from "@/lib/db";

export async function ensureServiceProjectForErp(
  erpProjectId: string,
  actorId: string
): Promise<{ id: string; created: boolean }> {
  const erpProject = await prisma.erpProject.findUnique({
    where: { id: erpProjectId },
    select: { id: true, name: true, customerId: true },
  });
  if (!erpProject) throw new Error("ERP project not found");
  if (!erpProject.customerId) throw new Error("ERP project has no linked client");

  const existing = await prisma.project.findFirst({
    where: { erpProjectId, deletedAt: null },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  const project = await prisma.project.create({
    data: {
      clientId: erpProject.customerId,
      name: erpProject.name,
      status: "ACTIVE",
      erpProjectId,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: { id: true },
  });

  return { id: project.id, created: true };
}
