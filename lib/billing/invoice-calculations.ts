import { SL_TIMEZONE } from "@/lib/timezone";

export type InvoicePaymentLike = {
  amountCents: number;
  status: string;
  isAdvance?: boolean;
  isCredit?: boolean;
};

export type InvoiceFinancialInput = {
  totalCents: number;
  paidCents: number;
  status: string;
  dueAt: Date | string | null;
  lineItemsJson?: string | null;
  payments?: InvoicePaymentLike[];
};

export type InvoiceFinancials = {
  totalCents: number;
  paidCents: number;
  advancePaymentsCents: number;
  otherPaymentsCents: number;
  remainingBalanceCents: number;
  dueAmountCents: number;
  effectiveStatus: string;
};

function parseAdvanceFromJson(lineItemsJson?: string | null): number {
  if (!lineItemsJson) return 0;
  try {
    const parsed = JSON.parse(lineItemsJson) as { advanceCents?: number };
    return Math.max(0, parsed.advanceCents ?? 0);
  } catch {
    return 0;
  }
}

function isOverdue(dueAt: Date | string | null): boolean {
  if (!dueAt) return false;
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const nowStr = new Date().toLocaleString("en-US", { timeZone: SL_TIMEZONE });
  const dueStr = due.toLocaleString("en-US", { timeZone: SL_TIMEZONE });
  return new Date(dueStr).getTime() < new Date(nowStr).getTime();
}

/** Server-side invoice financials — never trust client input for totals. */
export function computeInvoiceFinancials(input: InvoiceFinancialInput): InvoiceFinancials {
  const totalCents = Math.max(0, input.totalCents);
  const succeeded = (input.payments ?? []).filter((p) => p.status === "SUCCEEDED");

  let advancePaymentsCents = succeeded
    .filter((p) => p.isAdvance)
    .reduce((s, p) => s + p.amountCents, 0);

  let otherPaymentsCents = succeeded
    .filter((p) => !p.isAdvance)
    .reduce((s, p) => s + p.amountCents, 0);

  // Fallback: use paidCents from invoice if payments not loaded
  const paidFromPayments = advancePaymentsCents + otherPaymentsCents;
  const paidCents =
    paidFromPayments > 0 ? paidFromPayments : Math.max(0, input.paidCents);

  if (paidFromPayments === 0 && paidCents > 0) {
    const plannedAdvance = parseAdvanceFromJson(input.lineItemsJson);
    advancePaymentsCents = Math.min(plannedAdvance, paidCents);
    otherPaymentsCents = Math.max(0, paidCents - advancePaymentsCents);
  }

  const remainingBalanceCents = Math.max(0, totalCents - paidCents);
  const overdue = isOverdue(input.dueAt) && remainingBalanceCents > 0;

  let effectiveStatus = input.status;
  if (
    remainingBalanceCents <= 0 &&
    !["VOID", "CANCELLED"].includes(input.status.toUpperCase())
  ) {
    effectiveStatus = "PAID";
  } else if (paidCents > 0 && remainingBalanceCents > 0) {
    effectiveStatus = "PARTIALLY_PAID";
  } else if (overdue && !["PAID", "VOID", "CANCELLED"].includes(input.status.toUpperCase())) {
    effectiveStatus = "OVERDUE";
  }

  const dueAmountCents =
    overdue || (input.dueAt && remainingBalanceCents > 0)
      ? remainingBalanceCents
      : remainingBalanceCents;

  return {
    totalCents,
    paidCents,
    advancePaymentsCents,
    otherPaymentsCents,
    remainingBalanceCents,
    dueAmountCents,
    effectiveStatus,
  };
}
