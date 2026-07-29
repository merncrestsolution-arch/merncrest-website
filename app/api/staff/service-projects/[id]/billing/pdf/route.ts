import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";
import { buildProjectBillingHistoryHtml } from "@/lib/billing/project-billing-history-pdf";

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
      client: { select: { fullName: true, email: true, company: true } },
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

  const html = buildProjectBillingHistoryHtml({
    projectName: project.name,
    clientName: project.client.company || project.client.fullName,
    clientEmail: project.client.email,
    currency: invoiceRows[0]?.currency ?? "LKR",
    invoices: invoiceRows.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      issuedAt: inv.createdAt,
      dueAt: inv.dueAt,
      totalCents: inv.totalCents,
      paidCents: inv.paidCents,
      balanceCents: inv.remainingBalanceCents,
    })),
    payments: payments.map((p) => ({
      receiptNumber: p.receiptNumber,
      paidAt: p.createdAt,
      amountCents: p.amountCents,
      method: p.method,
      status: "SUCCEEDED",
      invoiceNumber: p.invoice?.invoiceNumber ?? null,
    })),
    receipts: payments
      .filter((p) => p.receiptNumber)
      .map((p) => ({
        receiptNumber: p.receiptNumber!,
        paidAt: p.createdAt,
        amountCents: p.amountCents,
        invoiceNumber: p.invoice?.invoiceNumber ?? null,
        method: p.method,
      })),
    summary: {
      totalInvoicedCents: summary.invoicedCents,
      totalPaidCents: summary.paidCents,
      outstandingBalanceCents: summary.balanceCents,
    },
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
