import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

/** Collision-safe sequential numbers per organization. */
export async function nextOrgNumber(
  kind: "ORDER" | "INVOICE",
  prefix?: string
): Promise<string> {
  const organizationId = await getPrimaryOrganizationId();
  const defaultPrefix = kind === "ORDER" ? "ORD" : "INV";
  const p = prefix || defaultPrefix;

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.orgNumberSequence.findUnique({
      where: { organizationId_kind: { organizationId, kind } },
    });
    if (!existing) {
      return tx.orgNumberSequence.create({
        data: { organizationId, kind, prefix: p, nextValue: 2 },
      });
    }
    return tx.orgNumberSequence.update({
      where: { id: existing.id },
      data: { nextValue: { increment: 1 } },
    });
  });

  const n = (seq.nextValue - 1).toString().padStart(6, "0");
  const year = new Date().getFullYear();
  return `${seq.prefix}-${year}-${n}`;
}
