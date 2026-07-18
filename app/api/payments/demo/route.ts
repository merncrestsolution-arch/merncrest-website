import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { z } from "zod";

const schema = z.object({
  invoiceId: z.string().min(1),
});

/** Demo payment — marks invoice + order paid (PayHere/Stripe later). */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data.invoiceId, userId: auth.user.id },
      include: { order: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ invoice, message: "Already paid" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: auth.user.id,
          orderId: invoice.orderId,
          invoiceId: invoice.id,
          amountCents: invoice.totalCents,
          currency: invoice.currency,
          method: "DEMO",
          status: "SUCCEEDED",
          providerRef: `demo_${Date.now()}`,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      await tx.order.update({
        where: { id: invoice.orderId },
        data: { status: "PAID" },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({
      ...result,
      message: "Payment recorded (demo gateway)",
    });
  } catch (error) {
    console.error("[payments:post]", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
