import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { buildQuotationPdf } from "@/lib/crm/quotation-pdf";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const quote = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await buildQuotationPdf(quote);
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
