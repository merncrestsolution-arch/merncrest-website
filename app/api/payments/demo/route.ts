import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { markInvoicePaid } from "@/lib/services/fulfillment";
import { z } from "zod";

const schema = z.object({
  invoiceId: z.string().min(1),
});

/** Demo payment — marks paid and auto-provisions domains/hosting/subscriptions. */
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
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const result = await markInvoicePaid({
      invoiceId: invoice.id,
      userId: auth.user.id,
      method: "DEMO",
      providerRef: `demo_${Date.now()}`,
    });

    return NextResponse.json({
      ...result,
      message: result.alreadyPaid
        ? "Already paid"
        : "Payment recorded — services activated",
    });
  } catch (error) {
    console.error("[payments:demo]", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
