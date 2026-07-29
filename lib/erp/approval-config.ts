import { getSettingNumber } from "@/lib/admin/settings";

/** Quotation totals at or above this amount (cents) require ApprovalRequest before pipeline advance. */
export async function getQuotationApprovalThresholdCents(): Promise<number> {
  const cents = await getSettingNumber("finance.quotationApprovalThresholdCents", 500_000);
  return Math.max(cents, 0);
}
