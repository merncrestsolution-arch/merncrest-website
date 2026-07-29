import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { serializeServiceDomain } from "@/lib/services/service-domains";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const domains = await prisma.serviceDomain.findMany({
    where: {
      deletedAt: null,
      projectService: {
        deletedAt: null,
        project: { clientId: auth.user.id, deletedAt: null },
      },
    },
    orderBy: { domainName: "asc" },
  });

  return apiSuccess(domains.map((d) => serializeServiceDomain(d)));
}
