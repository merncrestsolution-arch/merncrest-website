import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { fullName: true, email: true, company: true } },
      project: { select: { id: true, name: true, projectCode: true } },
      order: { select: { orderNumber: true } },
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountCents: true,
          method: true,
          status: true,
          isAdvance: true,
          referenceNumber: true,
          receiptNumber: true,
          createdAt: true,
        },
      },
    },
  });

  if (!invoice) return apiError("NOT_FOUND", "Invoice not found", 404);

  return apiSuccess({
    ...serializeInvoice(invoice),
    orderNumber: invoice.order.orderNumber,
  });
}

const patchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "VOID", "CANCELLED"]).optional(),
  dueAt: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "billing.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing billing.manage permission", 403);

  const { id } = await context.params;
  const existing = await prisma.invoice.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return apiError("NOT_FOUND", "Invoice not found", 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid update");

  const data: Record<string, unknown> = { updatedBy: auth.user.id };
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.dueAt !== undefined) {
    data.dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
  }
  if (parsed.data.notes !== undefined) {
    try {
      const meta = existing.lineItemsJson ? JSON.parse(existing.lineItemsJson) : {};
      meta.notes = parsed.data.notes;
      data.lineItemsJson = JSON.stringify(meta);
    } catch {
      data.lineItemsJson = JSON.stringify({ notes: parsed.data.notes });
    }
  }

  await prisma.invoice.update({ where: { id }, data });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "invoice.update",
    module: "billing",
    entityType: "Invoice",
    entityId: id,
    summary: `Updated invoice ${existing.invoiceNumber}`,
  });

  const invoice = await prisma.invoice.findFirst({
    where: { id },
    include: {
      user: { select: { fullName: true, email: true, company: true } },
      project: { select: { id: true, name: true, projectCode: true } },
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return apiSuccess(serializeInvoice(invoice!));
}
