import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatMoney } from "@/lib/commerce-format";

export type ProposalQuote = {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  company?: string | null;
  status: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  validUntil?: Date | string | null;
  terms?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  items: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }[];
};

/** Enterprise PDF proposal for a Quotation */
export async function buildQuotationPdf(quote: ProposalQuote): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const teal = rgb(0.09, 0.64, 0.72);
  const dark = rgb(0.2, 0.2, 0.2);
  const muted = rgb(0.4, 0.4, 0.4);

  let y = 800;
  const left = 48;

  page.drawText("MernCrest Solutions", { x: left, y, size: 18, font: bold, color: teal });
  y -= 18;
  page.drawText("Enterprise Proposal / Quotation", { x: left, y, size: 11, font, color: muted });
  y -= 28;

  page.drawText(`Quote: ${quote.quoteNumber}`, { x: left, y, size: 12, font: bold, color: dark });
  page.drawText(`Status: ${quote.status}`, { x: 360, y, size: 10, font, color: muted });
  y -= 16;
  page.drawText(
    `Date: ${new Date(quote.createdAt).toLocaleDateString()}`,
    { x: left, y, size: 10, font, color: muted }
  );
  if (quote.validUntil) {
    page.drawText(`Valid until: ${new Date(quote.validUntil).toLocaleDateString()}`, {
      x: 360,
      y,
      size: 10,
      font,
      color: muted,
    });
  }
  y -= 28;

  page.drawText("Prepared for", { x: left, y, size: 10, font: bold, color: teal });
  y -= 14;
  page.drawText(quote.customerName, { x: left, y, size: 12, font: bold, color: dark });
  y -= 14;
  if (quote.company) {
    page.drawText(quote.company, { x: left, y, size: 10, font, color: muted });
    y -= 12;
  }
  page.drawText(quote.customerEmail, { x: left, y, size: 10, font, color: muted });
  y -= 28;

  // Table header
  page.drawRectangle({ x: left, y: y - 4, width: 500, height: 18, color: rgb(0.94, 0.96, 0.97) });
  page.drawText("Description", { x: left + 4, y, size: 9, font: bold, color: dark });
  page.drawText("Qty", { x: 340, y, size: 9, font: bold, color: dark });
  page.drawText("Unit", { x: 380, y, size: 9, font: bold, color: dark });
  page.drawText("Total", { x: 460, y, size: 9, font: bold, color: dark });
  y -= 22;

  for (const item of quote.items) {
    if (y < 120) break;
    const desc =
      item.description.length > 55 ? item.description.slice(0, 52) + "…" : item.description;
    page.drawText(desc, { x: left + 4, y, size: 9, font, color: dark });
    page.drawText(String(item.quantity), { x: 340, y, size: 9, font, color: dark });
    page.drawText(formatMoney(item.unitPriceCents), { x: 380, y, size: 9, font, color: dark });
    page.drawText(formatMoney(item.totalCents), { x: 460, y, size: 9, font, color: dark });
    y -= 16;
  }

  y -= 12;
  page.drawText(`Subtotal: ${formatMoney(quote.subtotalCents)}`, {
    x: 380,
    y,
    size: 10,
    font,
    color: dark,
  });
  y -= 14;
  if (quote.discountCents) {
    page.drawText(`Discount: -${formatMoney(quote.discountCents)}`, {
      x: 380,
      y,
      size: 10,
      font,
      color: muted,
    });
    y -= 14;
  }
  if (quote.taxCents) {
    page.drawText(`Tax: ${formatMoney(quote.taxCents)}`, {
      x: 380,
      y,
      size: 10,
      font,
      color: muted,
    });
    y -= 14;
  }
  page.drawText(`Total: ${formatMoney(quote.totalCents)} ${quote.currency}`, {
    x: 380,
    y,
    size: 12,
    font: bold,
    color: teal,
  });
  y -= 32;

  if (quote.terms) {
    page.drawText("Terms", { x: left, y, size: 10, font: bold, color: teal });
    y -= 14;
    const terms = quote.terms.slice(0, 420);
    for (const line of wrapText(terms, 78)) {
      page.drawText(line, { x: left, y, size: 9, font, color: muted });
      y -= 12;
    }
  }

  y -= 16;
  page.drawText("MernCrest — Reseller marketplace · system.merncrest.lk", {
    x: left,
    y: 40,
    size: 8,
    font,
    color: muted,
  });

  return doc.save();
}

function wrapText(text: string, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > width) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
