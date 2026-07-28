import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { recordInvoicePayment } from "@/lib/commerce/invoice-payments";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";
import { hasStaffPermission } from "@/lib/staff/permissions";

const paySchema = z.object({
  amountCents: z.number().int().positive(),
  method: z.string().min(1).max(40),
  isCredit: z.boolean().optional(),
  isAdvance: z.boolean().optional(),
  referenceNumber: z.string().max(120).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "billing.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing billing.manage permission", 403);

  const { id } = await context.params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      payments: { where: { deletedAt: null } },
      user: { select: { fullName: true, email: true, company: true } },
      project: { select: { id: true, name: true, projectCode: true } },
    },
  });

  if (!invoice) return apiError("NOT_FOUND", "Invoice not found", 404);

  const body = await request.json();
  const parsed = paySchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid payment");

  try {
    const result = await recordInvoicePayment({
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      userId: invoice.userId,
      amountCents: parsed.data.amountCents,
      method: parsed.data.method,
      isCredit: parsed.data.isCredit,
      isAdvance: parsed.data.isAdvance,
      referenceNumber: parsed.data.referenceNumber,
      recordedById: auth.user.id,
    });

    const updated = await prisma.invoice.findFirst({
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

    return apiSuccess({
      payment: result.payment,
      invoice: serializeInvoice(updated!),
    });
  } catch (error) {
    return apiError(
      "PAYMENT_FAILED",
      error instanceof Error ? error.message : "Payment failed",
      400
    );
  }
}
