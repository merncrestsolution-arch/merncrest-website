import type { StaffScope } from "@/lib/erp/staff-scope";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { prisma } from "@/lib/db";

/** Fields to stamp on new records for tenant + branch isolation. */
export function scopeCreateFields(scope: StaffScope): {
  organizationId: string;
  branchId: string;
} {
  return {
    organizationId: scope.organizationId,
    branchId: scope.branchId ?? "",
  };
}

/** Default tenant stamp for portal/customer-created records. */
export async function defaultTenantStamp(): Promise<{
  organizationId: string;
  branchId: string;
}> {
  const organizationId = await getPrimaryOrganizationId();
  const branch =
    (await prisma.branch.findFirst({
      where: { organizationId, isHeadOffice: true, deletedAt: null },
      select: { id: true },
    })) ||
    (await prisma.branch.findFirst({
      where: { organizationId, deletedAt: null },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }));
  return { organizationId, branchId: branch?.id ?? "" };
}
