import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/envelope";

const patchSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNotes: z.string().max(2000).optional(),
});

async function canReviewAccessRequests(userId: string, role: string) {
  if (isAdminRole(role as "ADMIN")) return true;
  const employee = await prisma.employee.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { orgRole: true },
  });
  return employee?.orgRole === "HR";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canReview = await canReviewAccessRequests(auth.user.id, auth.user.role);
  if (!canReview) {
    return apiError("FORBIDDEN", "Only OWNER, ADMIN, or HR can review access requests", 403);
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const existing = await prisma.crossClientAccessRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, fullName: true, email: true } },
      client: { select: { id: true, fullName: true, email: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!existing) return apiError("NOT_FOUND", "Access request not found", 404);
  if (existing.status !== "PENDING") {
    return apiError("CONFLICT", "This access request has already been reviewed", 409);
  }

  const status = parsed.data.action === "approve" ? "APPROVED" : "REJECTED";

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.crossClientAccessRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: auth.user.id,
        reviewNotes: parsed.data.reviewNotes?.trim() || null,
      },
      include: {
        requester: { select: { id: true, fullName: true, email: true } },
        client: { select: { id: true, fullName: true, email: true, company: true } },
        project: { select: { id: true, name: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (parsed.data.action === "approve") {
      await tx.salesClientAssignment.upsert({
        where: {
          agentId_clientId: {
            agentId: existing.requesterId,
            clientId: existing.clientId,
          },
        },
        create: {
          agentId: existing.requesterId,
          clientId: existing.clientId,
          createdBy: auth.user.id,
        },
        update: {},
      });
    }

    return row;
  });

  return apiSuccess({
    id: updated.id,
    requesterId: updated.requesterId,
    clientId: updated.clientId,
    projectId: updated.projectId,
    reason: updated.reason,
    status: updated.status,
    reviewedBy: updated.reviewedBy,
    reviewNotes: updated.reviewNotes,
    requester: updated.requester,
    client: updated.client,
    project: updated.project,
    reviewer: updated.reviewer,
    updatedAt: updated.updatedAt,
  });
}
