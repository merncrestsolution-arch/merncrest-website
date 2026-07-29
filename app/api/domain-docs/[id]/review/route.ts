import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { sendDomainDocApprovedEmail, sendDomainDocRejectedEmail } from "@/lib/email/system-mails";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "request_corrections"]),
  reviewNotes: z.string().max(4000).optional(),
});

const STATUS_MAP = {
  approve: "APPROVED",
  reject: "REJECTED",
  request_corrections: "CORRECTIONS_REQUESTED",
} as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "documents.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing documents.manage permission", 403);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  if (parsed.data.action === "reject" && !parsed.data.reviewNotes?.trim()) {
    return apiError("VALIDATION", "Review notes are required when rejecting a submission");
  }

  const existing = await prisma.domainRegistrationSubmission.findFirst({
    where: { id, deletedAt: null },
    include: {
      submitter: { select: { id: true, fullName: true, email: true } },
      projectService: {
        include: {
          project: { select: { id: true, name: true } },
          serviceDomain: { select: { domainName: true } },
        },
      },
    },
  });

  if (!existing) return apiError("NOT_FOUND", "Submission not found", 404);

  const status = STATUS_MAP[parsed.data.action];

  const updated = await prisma.domainRegistrationSubmission.update({
    where: { id },
    data: {
      status,
      reviewNotes: parsed.data.reviewNotes?.trim() || null,
      reviewedBy: auth.user.id,
      updatedBy: auth.user.id,
    },
    include: {
      submitter: { select: { id: true, fullName: true, email: true } },
      reviewer: { select: { id: true, fullName: true, email: true } },
      projectService: {
        select: {
          id: true,
          serviceType: true,
          project: { select: { id: true, name: true, clientId: true } },
        },
      },
    },
  });

  if (parsed.data.action === "reject") {
    const domainName =
      existing.projectService.serviceDomain?.domainName ||
      existing.projectService.project.name;
    const notes = parsed.data.reviewNotes?.trim() || "";

    void sendDomainDocRejectedEmail({
      to: existing.submitter.email,
      name: existing.submitter.fullName,
      domainName,
      reason: notes,
    });
  }

  if (parsed.data.action === "approve") {
    const domainName =
      existing.projectService.serviceDomain?.domainName ||
      existing.projectService.project.name;
    void sendDomainDocApprovedEmail({
      to: existing.submitter.email,
      name: existing.submitter.fullName,
      domainName,
    });
  }

  return apiSuccess({
    id: updated.id,
    projectServiceId: updated.projectServiceId,
    fullName: updated.fullName,
    companyName: updated.companyName,
    purpose: updated.purpose,
    phone: updated.phone,
    email: updated.email,
    status: updated.status,
    reviewNotes: updated.reviewNotes,
    reviewedBy: updated.reviewedBy,
    submitter: updated.submitter,
    reviewer: updated.reviewer,
    projectService: updated.projectService,
    updatedAt: updated.updatedAt,
  });
}
