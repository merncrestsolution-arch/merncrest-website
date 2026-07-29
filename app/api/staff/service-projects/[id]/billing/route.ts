import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "billing.view");
  if (!canView) return apiError("FORBIDDEN", "Missing billing.view permission", 403);

  const { id } = await context.params;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      status: true,
      clientId: true,
      client: { select: { id: true, fullName: true, email: true, company: true } },
    },
  });

  if (!project) return apiError("NOT_FOUND", "Service project not found", 404);

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { serviceProjectId: id, deletedAt: null },
      include: {
        user: { select: { fullName: true, email: true, company: true } },
        payments: {
          where: { deletedAt: null, status: "SUCCEEDED" },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: "SUCCEEDED",
        invoice: { serviceProjectId: id, deletedAt: null },
      },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: { select: { invoiceNumber: true } },
      },
    }),
  ]);

  const invoiceRows = invoices.map(serializeInvoice);
  const summary = invoiceRows.reduce(
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
    summary,
    invoices: invoiceRows,
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
