import { computeInvoiceFinancials } from "@/lib/billing/invoice-calculations";

type InvoiceWithPayments = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  projectId?: string | null;
  domainId?: string | null;
  hostingAccountId?: string | null;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  currency: string;
  lineItemsJson?: string | null;
  dueAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { fullName: string; email: string; company?: string | null };
  project?: { id: string; name: string; projectCode: string } | null;
  payments?: Array<{
    id: string;
    amountCents: number;
    method: string;
    status: string;
    isAdvance: boolean;
    referenceNumber?: string | null;
    receiptNumber?: string | null;
    createdAt: Date;
  }>;
};

export function serializeInvoice(inv: InvoiceWithPayments) {
  const financials = computeInvoiceFinancials({
    totalCents: inv.totalCents,
    paidCents: inv.paidCents,
    status: inv.status,
    dueAt: inv.dueAt,
    lineItemsJson: inv.lineItemsJson,
    payments: inv.payments?.map((p) => ({
      amountCents: p.amountCents,
      status: p.status,
      isAdvance: p.isAdvance,
    })),
  });

  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    orderId: inv.orderId,
    userId: inv.userId,
    projectId: inv.projectId,
    domainId: inv.domainId,
    hostingAccountId: inv.hostingAccountId,
    status: financials.effectiveStatus,
    rawStatus: inv.status,
    subtotalCents: inv.subtotalCents,
    taxCents: inv.taxCents,
    totalCents: financials.totalCents,
    paidCents: financials.paidCents,
    advancePaymentsCents: financials.advancePaymentsCents,
    otherPaymentsCents: financials.otherPaymentsCents,
    remainingBalanceCents: financials.remainingBalanceCents,
    dueAmountCents: financials.dueAmountCents,
    balanceCents: financials.remainingBalanceCents,
    currency: inv.currency,
    lineItemsJson: inv.lineItemsJson,
    dueAt: inv.dueAt,
    paidAt: inv.paidAt,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    user: inv.user,
    project: inv.project,
    payments: inv.payments,
  };
}
