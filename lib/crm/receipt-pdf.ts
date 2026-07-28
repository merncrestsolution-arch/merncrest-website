import { buildReceiptPdfHtml, type ReceiptPdfData } from "@/lib/billing/receipt-pdf-html";

/** @deprecated Use buildReceiptPdfHtml — kept for type compatibility */
export type ReceiptData = ReceiptPdfData;

export async function buildReceiptPdf(receipt: ReceiptData): Promise<Uint8Array> {
  const html = buildReceiptPdfHtml(receipt);
  return new TextEncoder().encode(html);
}
