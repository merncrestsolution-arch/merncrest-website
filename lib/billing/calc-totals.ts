export type BillingTotalsInput = {
  lineSubtotalCents: number;
  discountCents?: number;
  /** When set, used instead of auto VAT from rate */
  taxCents?: number;
  vatRatePercent?: number;
  defaultVatRatePercent?: number;
};

export type BillingTotals = {
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
  vatRatePercent: number;
};

export function calcBillingTotals(input: BillingTotalsInput): BillingTotals {
  const subtotalCents = Math.max(0, input.lineSubtotalCents);
  const discountCents = Math.max(0, input.discountCents ?? 0);
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const vatRatePercent = input.vatRatePercent ?? input.defaultVatRatePercent ?? 18;

  let taxCents: number;
  if (input.taxCents != null && input.taxCents >= 0) {
    taxCents = input.taxCents;
  } else {
    taxCents = Math.round(taxableCents * (vatRatePercent / 100));
  }

  const totalCents = taxableCents + taxCents;

  return {
    subtotalCents,
    discountCents,
    taxableCents,
    taxCents,
    totalCents,
    vatRatePercent,
  };
}
