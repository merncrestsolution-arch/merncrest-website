import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const project = await prisma.erpProject.findUnique({
    where: { id },
    select: { id: true, name: true, projectCode: true, customerId: true },
  });

  if (!project) return apiError("NOT_FOUND", "Project not found", 404);

  const [invoices, schedules, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { projectId: id, deletedAt: null },
      include: {
        user: { select: { fullName: true, email: true, company: true } },
        payments: {
          where: { deletedAt: null, status: "SUCCEEDED" },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.projectPaymentSchedule.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.payment.findMany({
      where: {
        deletedAt: null,
        invoice: { projectId: id, deletedAt: null },
        status: "SUCCEEDED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: { select: { invoiceNumber: true } },
      },
    }),
  ]);

  const invoiceRows = invoices.map(serializeInvoice);
  const totals = invoiceRows.reduce(
    (acc, inv) => {
      acc.invoicedCents += inv.totalCents;
      acc.paidCents += inv.paidCents;
      acc.balanceCents += inv.remainingBalanceCents;
      return acc;
    },
    { invoicedCents: 0, paidCents: 0, balanceCents: 0 }
  );

  return apiSuccess({
    project,
    summary: totals,
    invoices: invoiceRows,
    paymentSchedule: schedules,
    payments: payments.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      method: p.method,
      isAdvance: p.isAdvance,
      referenceNumber: p.referenceNumber,
      receiptNumber: p.receiptNumber,
      invoiceNumber: p.invoice?.invoiceNumber,
      createdAt: p.createdAt,
    })),
  });
}
