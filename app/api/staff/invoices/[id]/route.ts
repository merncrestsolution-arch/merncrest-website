import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";
import { writeAuditLog } from "@/lib/erp/audit";
import { isBillingAdmin } from "@/lib/billing/billing-admin";
import {
  applyInvoiceLineUpdate,
  deriveInvoiceStatusFromPayments,
  unlinkInvoiceSchedules,
  type InvoiceLineInput,
} from "@/lib/billing/update-invoice";

const lineSchema = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unitCents: z.number().int().positive(),
  discountCents: z.number().int().nonnegative().optional(),
});

const patchSchema = z.object({
  status: z
    .enum(["DRAFT", "SENT", "PAID", "PARTIALLY_PAID", "OVERDUE", "VOID", "CANCELLED"])
    .optional(),
  dueAt: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(lineSchema).min(1).optional(),
  discountCents: z.number().int().nonnegative().optional(),
  taxCents: z.number().int().nonnegative().optional(),
  vatRatePercent: z.number().min(0).max(100).optional(),
  advanceCents: z.number().int().nonnegative().optional(),
});

async function loadInvoice(id: string) {
  return prisma.invoice.findFirst({
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
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const invoice = await loadInvoice(id);
  if (!invoice) return apiError("NOT_FOUND", "Invoice not found", 404);

  return apiSuccess({
    ...serializeInvoice(invoice),
    orderNumber: invoice.order.orderNumber,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  if (!isBillingAdmin(auth.user)) {
    return apiError("FORBIDDEN", "Only platform owner or super admin can edit invoices", 403);
  }

  const { id } = await context.params;
  const existing = await prisma.invoice.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return apiError("NOT_FOUND", "Invoice not found", 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid update");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const dueAtValue =
        parsed.data.dueAt !== undefined
          ? parsed.data.dueAt
            ? new Date(parsed.data.dueAt)
            : null
          : existing.dueAt;

      if (parsed.data.lineItems) {
        await applyInvoiceLineUpdate(
          tx,
          { ...existing, dueAt: dueAtValue },
          parsed.data.lineItems as InvoiceLineInput[],
          {
            discountCents: parsed.data.discountCents,
            taxCents: parsed.data.taxCents,
            vatRatePercent: parsed.data.vatRatePercent,
            notes: parsed.data.notes,
            updatedBy: auth.user.id,
            explicitStatus: parsed.data.status,
            advanceCents: parsed.data.advanceCents,
          }
        );
      }

      const data: Prisma.InvoiceUpdateInput = { updatedBy: auth.user.id };

      if (parsed.data.status && !parsed.data.lineItems) {
        if (["VOID", "CANCELLED"].includes(parsed.data.status)) {
          data.status = parsed.data.status;
          data.paidAt = null;
        } else if (existing.paidCents > 0) {
          const derived = deriveInvoiceStatusFromPayments(
            existing.paidCents,
            existing.totalCents,
            dueAtValue,
            parsed.data.status
          );
          data.status = derived.status;
          data.paidAt = derived.paidAt;
        } else {
          data.status = parsed.data.status;
        }
      }

      if (parsed.data.dueAt !== undefined) {
        data.dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
      }

      if (parsed.data.notes !== undefined && !parsed.data.lineItems) {
        try {
          const meta = existing.lineItemsJson ? JSON.parse(existing.lineItemsJson) : {};
          meta.notes = parsed.data.notes;
          data.lineItemsJson = JSON.stringify(meta);
        } catch {
          data.lineItemsJson = JSON.stringify({ notes: parsed.data.notes });
        }
      }

      if (Object.keys(data).length > 1) {
        await tx.invoice.update({ where: { id }, data });
      }
    });
  } catch (err) {
    return apiError(
      "VALIDATION",
      err instanceof Error ? err.message : "Update failed",
      400
    );
  }

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "invoice.update",
    module: "billing",
    entityType: "Invoice",
    entityId: id,
    summary: `Updated invoice ${existing.invoiceNumber}`,
  });

  const invoice = await loadInvoice(id);
  return apiSuccess(serializeInvoice(invoice!));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  if (!isBillingAdmin(auth.user)) {
    return apiError("FORBIDDEN", "Only platform owner or super admin can delete invoices", 403);
  }

  const { id } = await context.params;
  const existing = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      payments: {
        where: { deletedAt: null, status: "SUCCEEDED" },
        select: { id: true },
      },
    },
  });
  if (!existing) return apiError("NOT_FOUND", "Invoice not found", 404);

  if (existing.paidCents > 0 || existing.payments.length > 0) {
    return apiError(
      "VALIDATION",
      "Cannot delete an invoice with recorded payments. Void the invoice instead.",
      400
    );
  }

  await prisma.$transaction(async (tx) => {
    await unlinkInvoiceSchedules(tx, id);
    await tx.invoice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "VOID",
        updatedBy: auth.user.id,
      },
    });
    await tx.order.update({
      where: { id: existing.orderId },
      data: { status: "CANCELLED" },
    });
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "invoice.soft_delete",
    module: "billing",
    entityType: "Invoice",
    entityId: id,
    summary: `Deleted invoice ${existing.invoiceNumber}`,
  });

  return apiSuccess({ id });
}
