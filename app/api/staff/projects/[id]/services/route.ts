import { z } from "zod";
import type { BillingCycle, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { ensureServiceProjectForErp } from "@/lib/staff/ensure-service-project";
import {
  createProjectService,
  serializeProjectService,
} from "@/lib/services/project-services";
import { serializeServiceDomain } from "@/lib/services/service-domains";
import { serializeServiceHosting } from "@/lib/services/service-hosting";
import { calculateServiceDates, FREE_PERIOD_PRESETS } from "@/shared/renewal-calculator";

const attachSchema = z.object({
  serviceType: z.string().min(1),
  startDate: z.string().datetime(),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"]).optional(),
  freePeriodDays: z.number().int().min(0).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
  assignedStaffId: z.string().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "projects.view");
  if (!canView) return apiError("FORBIDDEN", "Missing projects.view permission", 403);

  const { id: erpProjectId } = await context.params;

  const erpProject = await prisma.erpProject.findUnique({
    where: { id: erpProjectId },
    select: { id: true, customerId: true },
  });
  if (!erpProject) return apiError("NOT_FOUND", "Project not found", 404);

  const serviceProject = await prisma.project.findFirst({
    where: { erpProjectId, deletedAt: null },
    include: {
      services: {
        where: { deletedAt: null },
        include: { serviceDomain: true, serviceHosting: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return apiSuccess({
    serviceProjectId: serviceProject?.id ?? null,
    services: (serviceProject?.services ?? []).map((s) => ({
      ...serializeProjectService(s),
      domain: s.serviceDomain ? serializeServiceDomain(s.serviceDomain) : null,
      hosting: s.serviceHosting ? serializeServiceHosting(s.serviceHosting) : null,
    })),
    freePeriodPresets: FREE_PERIOD_PRESETS,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const { id: erpProjectId } = await context.params;
  const body = await request.json();
  const parsed = attachSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  let serviceProjectId: string;
  try {
    const ensured = await ensureServiceProjectForErp(erpProjectId, auth.user.id);
    serviceProjectId = ensured.id;
  } catch (err) {
    return apiError("NOT_FOUND", err instanceof Error ? err.message : "Project not found", 404);
  }

  const startDate = new Date(parsed.data.startDate);
  const billingCycle = (parsed.data.billingCycle ?? "ANNUAL") as BillingCycle;
  const metadata = {
    ...(parsed.data.metadata ?? {}),
    ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
    ...(parsed.data.assignedStaffId ? { assignedStaffId: parsed.data.assignedStaffId } : {}),
  };

  const dates = calculateServiceDates({
    startDate,
    freePeriodDays: parsed.data.freePeriodDays ?? 0,
    billingCycle,
  });

  const result = await createProjectService({
    projectId: serviceProjectId,
    serviceType: parsed.data.serviceType as ServiceType,
    startDate,
    freePeriodDays: parsed.data.freePeriodDays,
    billingCycle,
    expiryDate: dates.expiryDate,
    metadata: Object.keys(metadata).length ? metadata : undefined,
    actorId: auth.user.id,
  });

  if (result && "error" in result) {
    return apiError("NOT_FOUND", "Service project not found", 404);
  }

  return apiSuccess(
    {
      ...serializeProjectService(result),
      serviceProjectId,
      computedDates: {
        renewalDate: dates.renewalDate,
        expiryDate: dates.expiryDate,
        nextBillingDate: dates.nextBillingDate,
      },
    },
    undefined,
    201
  );
}
