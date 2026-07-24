import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatMoney } from "@/lib/commerce-format";

export type ReceiptData = {
  receiptNumber: string;
  paidAt: Date | string;
  customerName: string;
  customerEmail: string;
  invoiceNumber?: string | null;
  orderNumber?: string | null;
  amountCents: number;
  currency: string;
  method: string;
  referenceNumber?: string | null;
};

export async function buildReceiptPdf(receipt: ReceiptData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const teal = rgb(0.09, 0.64, 0.72);
  const dark = rgb(0.2, 0.2, 0.2);
  const muted = rgb(0.4, 0.4, 0.4);

  let y = 780;
  const left = 48;

  page.drawText("MernCrest Solutions", { x: left, y, size: 18, font: bold, color: teal });
  y -= 20;
  page.drawText("Official Payment Receipt", { x: left, y, size: 11, font, color: muted });
  y -= 36;

  page.drawText(`Receipt: ${receipt.receiptNumber}`, { x: left, y, size: 12, font: bold, color: dark });
  page.drawText(
    `Date: ${new Date(receipt.paidAt).toLocaleDateString("en-LK")}`,
    { x: 360, y, size: 10, font, color: muted }
  );
  y -= 28;

  page.drawText("Received from", { x: left, y, size: 10, font: bold, color: teal });
  y -= 14;
  page.drawText(receipt.customerName, { x: left, y, size: 12, font: bold, color: dark });
  y -= 14;
  page.drawText(receipt.customerEmail, { x: left, y, size: 10, font, color: muted });
  y -= 32;

  page.drawRectangle({ x: left, y: y - 4, width: 500, height: 72, color: rgb(0.94, 0.96, 0.97) });
  y -= 18;
  page.drawText("Amount received", { x: left + 12, y, size: 10, font, color: muted });
  y -= 22;
  page.drawText(formatMoney(receipt.amountCents, receipt.currency), {
    x: left + 12,
    y,
    size: 20,
    font: bold,
    color: teal,
  });
  y -= 40;

  const rows: [string, string][] = [
    ["Payment method", receipt.method.replace(/_/g, " ")],
    ...(receipt.invoiceNumber ? [["Invoice", receipt.invoiceNumber] as [string, string]] : []),
    ...(receipt.orderNumber ? [["Order", receipt.orderNumber] as [string, string]] : []),
    ...(receipt.referenceNumber
      ? [["Reference", receipt.referenceNumber] as [string, string]]
      : []),
  ];

  for (const [label, val] of rows) {
    page.drawText(label, { x: left, y, size: 10, font, color: muted });
    page.drawText(val, { x: 200, y, size: 10, font: bold, color: dark });
    y -= 16;
  }

  y -= 24;
  page.drawText(
    "This receipt confirms payment received by MernCrest Solutions. Thank you for your business.",
    { x: left, y, size: 9, font, color: muted, maxWidth: 500 }
  );

  page.drawText("MernCrest Solutions (Pvt) Ltd · merncrest.lk", {
    x: left,
    y: 40,
    size: 8,
    font,
    color: muted,
  });

  return doc.save();
}
