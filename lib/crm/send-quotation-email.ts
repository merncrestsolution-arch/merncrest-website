import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/commerce-format";
import { buildQuotationPdf } from "@/lib/crm/quotation-pdf";
import { sendMailWithAttachment } from "@/lib/mail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://merncrest.lk";

export async function sendQuotationEmail(quotationId: string, recordedById?: string) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });
  if (!quote) throw new Error("Quotation not found");
  if (!quote.customerEmail) throw new Error("Customer email missing");

  const pdfBytes = await buildQuotationPdf(quote);
  const totalLabel = formatMoney(quote.totalCents, quote.currency);
  const validLabel = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString("en-LK")
    : "as stated in the proposal";

  const subject = `Your quotation ${quote.quoteNumber} — MernCrest Solutions`;
  const text = [
    `Hi ${quote.customerName},`,
    "",
    `Thank you for your interest in MernCrest Solutions.`,
    "",
    `Please find attached quotation ${quote.quoteNumber} for ${totalLabel}.`,
    `Valid until: ${validLabel}.`,
    "",
    "To accept this quotation or request changes, reply to this email or contact our team.",
    "",
    `MernCrest Solutions · ${SITE_URL}`,
  ].join("\n");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <h1 style="color:#7C3AED;font-size:22px">Your quotation is ready</h1>
      <p>Hi <strong>${quote.customerName}</strong>,</p>
      <p>Thank you for requesting a quotation from MernCrest Solutions.</p>
      <p>
        <strong>${quote.quoteNumber}</strong> · Total <strong>${totalLabel}</strong><br/>
        Valid until <strong>${validLabel}</strong>
      </p>
      <p>The detailed proposal is attached as a PDF.</p>
      <p>To accept or request changes, reply to this email or visit our
        <a href="${SITE_URL}/en/contact" style="color:#14B8A6">contact page</a>.
      </p>
      <p style="color:#6b7280;font-size:13px;margin-top:32px">MernCrest Solutions · Enterprise Technology Partner</p>
    </div>`;

  await sendMailWithAttachment({
    to: quote.customerEmail,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `${quote.quoteNumber}.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });

  if (quote.leadId) {
    await prisma.crmActivity.create({
      data: {
        leadId: quote.leadId,
        userId: recordedById || null,
        type: "EMAIL",
        body: `Quotation ${quote.quoteNumber} emailed to ${quote.customerEmail}`,
      },
    });
  }

  return { ok: true, to: quote.customerEmail };
}
