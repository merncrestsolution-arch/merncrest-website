import { z } from "zod";
import { requireUser } from "@/lib/commerce";
import { isStaffRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import {
  createDnsChangeRequest,
  serializeDnsChangeRequest,
} from "@/lib/dns/dns-change-requests";
import { prisma } from "@/lib/db";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";
import { DNS_RECORDS_SCHEMA } from "@/shared/service-types";

const submitSchema = z.object({
  serviceDomainId: z.string().min(1),
  proposedRecords: DNS_RECORDS_SCHEMA,
  clientNotes: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);

  const where = {
    deletedAt: null,
    ...(isStaffRole(auth.user.role) ? {} : { requestedBy: auth.user.id }),
  };

  const [rows, total] = await Promise.all([
    prisma.dnsChangeRequest.findMany({
      where,
      include: {
        serviceDomain: {
          select: {
            id: true,
            domainName: true,
            purchasedViaMernCrest: true,
            projectService: {
              select: {
                project: {
                  select: { id: true, name: true, erpProjectId: true, clientId: true },
                },
              },
            },
          },
        },
        requester: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.dnsChangeRequest.count({ where }),
  ]);

  return apiSuccess(
    rows.map(serializeDnsChangeRequest),
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

  const result = await createDnsChangeRequest({
    serviceDomainId: parsed.data.serviceDomainId,
    requestedBy: auth.user.id,
    proposedRecords: parsed.data.proposedRecords,
    clientNotes: parsed.data.clientNotes,
  });

  if ("error" in result) {
    if (result.error === "NOT_FOUND") return apiError("NOT_FOUND", "Domain not found", 404);
    if (result.error === "NOT_MANAGED") {
      return apiError(
        "FORBIDDEN",
        "This domain is not managed by MernCrest. Manage DNS through your registrar.",
        403
      );
    }
    if (result.error === "PENDING_EXISTS") {
      return apiError("CONFLICT", "A pending DNS change request already exists for this domain", 409);
    }
    return apiError("VALIDATION", "Invalid DNS records");
  }

  return apiSuccess(result, undefined, 201);
}
