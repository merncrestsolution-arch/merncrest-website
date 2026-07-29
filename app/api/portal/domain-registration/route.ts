import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { getServiceTypeLabel } from "@/shared/service-types";

/** Customer portal — domain registration services + doc submission status */
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const services = await prisma.projectService.findMany({
    where: {
      deletedAt: null,
      serviceType: "DOMAIN_REGISTRATION",
      project: { clientId: auth.user.id, deletedAt: null },
    },
    include: {
      project: { select: { id: true, name: true } },
      serviceDomain: { select: { id: true, domainName: true } },
      domainDocSubmissions: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          reviewNotes: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(
    services.map((s) => ({
      projectServiceId: s.id,
      projectId: s.project.id,
      projectName: s.project.name,
      serviceType: s.serviceType,
      serviceLabel: getServiceTypeLabel(s.serviceType),
      domainName: s.serviceDomain?.domainName ?? null,
      latestSubmission: s.domainDocSubmissions[0] ?? null,
    }))
  );
}
