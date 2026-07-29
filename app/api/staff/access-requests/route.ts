import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";
import { notifyUser } from "@/lib/support/notify";

const createSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional().nullable(),
  reason: z.string().min(5).max(2000),
});

async function canReviewAccessRequests(userId: string, role: string) {
  if (isAdminRole(role as "ADMIN")) return true;
  const employee = await prisma.employee.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { orgRole: true },
  });
  return employee?.orgRole === "HR";
}

function serializeAccessRequest(row: {
  id: string;
  requesterId: string;
  clientId: string;
  projectId: string | null;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  requester?: { id: string; fullName: string; email: string };
  client?: { id: string; fullName: string; email: string; company: string | null };
  project?: { id: string; name: string } | null;
  reviewer?: { id: string; fullName: string; email: string } | null;
}) {
  return {
    id: row.id,
    requesterId: row.requesterId,
    clientId: row.clientId,
    projectId: row.projectId,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewedBy,
    reviewNotes: row.reviewNotes,
    requester: row.requester,
    client: row.client,
    project: row.project,
    reviewer: row.reviewer,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const { page, limit, skip } = parsePagination(searchParams);

  const canReview = await canReviewAccessRequests(auth.user.id, auth.user.role);

  const where = {
    ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
    ...(clientId ? { clientId } : {}),
    ...(!canReview ? { requesterId: auth.user.id } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.crossClientAccessRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, fullName: true, email: true } },
        client: { select: { id: true, fullName: true, email: true, company: true } },
        project: { select: { id: true, name: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.crossClientAccessRequest.count({ where }),
  ]);

  return apiSuccess(
    rows.map(serializeAccessRequest),
    paginationMeta(page, total, limit)
  );
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const client = await prisma.user.findFirst({
    where: { id: parsed.data.clientId, role: "CUSTOMER" },
  });
  if (!client) return apiError("NOT_FOUND", "Client not found", 404);

  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: parsed.data.projectId,
        clientId: parsed.data.clientId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!project) return apiError("NOT_FOUND", "Service project not found for client", 404);
  }

  const existingAssignment = await prisma.salesClientAssignment.findUnique({
    where: {
      agentId_clientId: {
        agentId: auth.user.id,
        clientId: parsed.data.clientId,
      },
    },
  });
  if (existingAssignment) {
    return apiError("CONFLICT", "You already have access to this client", 409);
  }

  const pending = await prisma.crossClientAccessRequest.findFirst({
    where: {
      requesterId: auth.user.id,
      clientId: parsed.data.clientId,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (pending) {
    return apiError("CONFLICT", "A pending access request already exists for this client", 409);
  }

  const row = await prisma.crossClientAccessRequest.create({
    data: {
      requesterId: auth.user.id,
      clientId: parsed.data.clientId,
      projectId: parsed.data.projectId ?? null,
      reason: parsed.data.reason,
    },
    include: {
      requester: { select: { id: true, fullName: true, email: true } },
      client: { select: { id: true, fullName: true, email: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  });

  const approvers = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ["OWNER", "ADMIN"] } },
        { employee: { orgRole: "HR", status: "ACTIVE" } },
      ],
    },
    select: { id: true },
    take: 50,
  });

  await Promise.all(
    approvers.map((u) =>
      notifyUser({
        userId: u.id,
        title: "Client access request",
        body: `${auth.user.fullName} requested access to ${client.fullName || client.email}`,
        category: "ACCESS_REQUEST",
        href: "/staff/access-requests",
      })
    )
  );

  return apiSuccess(serializeAccessRequest(row), undefined, 201);
}
