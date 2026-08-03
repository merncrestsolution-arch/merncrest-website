import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { isStaffRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

const submitSchema = z.object({
  projectServiceId: z.string().min(1),
  fullName: z.string().min(1).max(200),
  companyName: z.string().max(200).optional().nullable(),
  purpose: z.string().min(1).max(2000),
  phone: z.string().min(5).max(40),
  email: z.string().email(),
  letterheadUrl: z.string().url().optional().nullable(),
  supportingDocsJson: z.unknown().optional(),
  idDocsJson: z.unknown().optional(),
});

function serializeSubmission(row: {
  id: string;
  projectServiceId: string;
  fullName: string;
  companyName: string | null;
  purpose: string;
  phone: string;
  email: string;
  letterheadUrl: string | null;
  supportingDocsJson: unknown;
  idDocsJson: unknown;
  status: string;
  reviewNotes: string | null;
  reviewedBy: string | null;
  submittedBy: string;
  createdAt: Date;
  updatedAt: Date;
  projectService?: {
    id: string;
    serviceType: string;
    project?: { id: string; name: string; clientId: string; erpProjectId: string | null };
  };
  submitter?: { id: string; fullName: string; email: string };
  reviewer?: { id: string; fullName: string; email: string } | null;
}) {
  return {
    id: row.id,
    projectServiceId: row.projectServiceId,
    fullName: row.fullName,
    companyName: row.companyName,
    purpose: row.purpose,
    phone: row.phone,
    email: row.email,
    letterheadUrl: row.letterheadUrl,
    supportingDocsJson: row.supportingDocsJson,
    idDocsJson: row.idDocsJson,
    status: row.status,
    reviewNotes: row.reviewNotes,
    reviewedBy: row.reviewedBy,
    submittedBy: row.submittedBy,
    projectService: row.projectService,
    submitter: row.submitter,
    reviewer: row.reviewer,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function assertServiceAccess(
  userId: string,
  role: string,
  projectServiceId: string
) {
  const service = await prisma.projectService.findFirst({
    where: {
      id: projectServiceId,
      deletedAt: null,
      serviceType: "DOMAIN_REGISTRATION",
    },
    include: {
      project: { select: { id: true, clientId: true, deletedAt: true } },
    },
  });

  if (!service || service.project.deletedAt) {
    return { error: apiError("NOT_FOUND", "Domain registration service not found", 404) };
  }

  if (!isStaffRole(role as "STAFF") && service.project.clientId !== userId) {
    return { error: apiError("FORBIDDEN", "You cannot submit for this service", 403) };
  }

  return { service };
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const projectServiceId = searchParams.get("projectServiceId");
  const status = searchParams.get("status");
  const { page, limit, skip } = parsePagination(searchParams);

  const staff = isStaffRole(auth.user.role);
  if (staff) {
    const canView = await hasStaffPermission(auth.user, "documents.view");
    if (!canView) return apiError("FORBIDDEN", "Missing documents.view permission", 403);
  }

  const where = {
    deletedAt: null,
    ...(projectServiceId ? { projectServiceId } : {}),
    ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "CORRECTIONS_REQUESTED" } : {}),
    ...(!staff
      ? {
          projectService: {
            project: { clientId: auth.user.id, deletedAt: null },
          },
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.domainRegistrationSubmission.findMany({
      where,
      include: {
        projectService: {
          select: {
            id: true,
            serviceType: true,
            project: { select: { id: true, name: true, clientId: true, erpProjectId: true } },
          },
        },
        submitter: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.domainRegistrationSubmission.count({ where }),
  ]);

  return apiSuccess(
    rows.map(serializeSubmission),
    paginationMeta(page, total, limit)
  );
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const access = await assertServiceAccess(
    auth.user.id,
    auth.user.role,
    parsed.data.projectServiceId
  );
  if ("error" in access) return access.error;

  if (isStaffRole(auth.user.role)) {
    const canManage = await hasStaffPermission(auth.user, "documents.manage");
    if (!canManage) {
      return apiError("FORBIDDEN", "Missing documents.manage permission", 403);
    }
  }

  const submission = await prisma.domainRegistrationSubmission.create({
    data: {
      projectServiceId: parsed.data.projectServiceId,
      fullName: parsed.data.fullName,
      companyName: parsed.data.companyName ?? null,
      purpose: parsed.data.purpose,
      phone: parsed.data.phone,
      email: parsed.data.email,
      letterheadUrl: parsed.data.letterheadUrl ?? null,
      supportingDocsJson: parsed.data.supportingDocsJson ?? undefined,
      idDocsJson: parsed.data.idDocsJson ?? undefined,
      submittedBy: auth.user.id,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    },
    include: {
      projectService: {
        select: {
          id: true,
          serviceType: true,
          project: { select: { id: true, name: true, clientId: true, erpProjectId: true } },
        },
      },
      submitter: { select: { id: true, fullName: true, email: true } },
    },
  });

  return apiSuccess(serializeSubmission(submission), undefined, 201);
}
