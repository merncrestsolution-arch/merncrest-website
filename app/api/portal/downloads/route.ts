import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";

/**
 * Customer downloads: invoices (PDF links), personal assets, and global manuals.
 */
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const [invoices, personal, globalDocs] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.customerDownload.findMany({
      where: { userId: auth.user.id, active: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerDownload.findMany({
      where: { userId: null, active: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const invoiceDownloads = invoices.map((inv) => ({
    id: `inv-${inv.id}`,
    title: `Invoice ${inv.invoiceNumber}`,
    description: `Order ${inv.order.orderNumber} · ${inv.status}`,
    category: inv.status === "PAID" ? "RECEIPT" : "INVOICE",
    fileUrl: `/api/invoices/${inv.id}/pdf`,
    fileType: "PDF",
    createdAt: inv.createdAt,
  }));

  return NextResponse.json({
    downloads: [...invoiceDownloads, ...personal, ...globalDocs],
  });
}
