import { NextResponse } from "next/server";
import { isAutomaticGatewayEnabled } from "@/lib/payments/config";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import {
  buildPayHereHash,
  formatPayHereAmount,
  getPayHereConfig,
} from "@/lib/payments/payhere";
import { z } from "zod";

const schema = z.object({
  invoiceId: z.string().min(1),
});

/**
 * PayHere checkout — disabled unless PAYMENT_GATEWAY_ENABLED=true.
 * Kept in place so Stripe/PayHere can be enabled later without redesign.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  if (!isAutomaticGatewayEnabled()) {
    return NextResponse.json(
      {
        error: "Automatic payment gateways are disabled",
        mode: "manual",
        message:
          "Please use Manual / Bank Transfer payment. Gateways (PayHere, Stripe) can be enabled later via PAYMENT_GATEWAY_ENABLED.",
      },
      { status: 503 }
    );
  }

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
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    const config = getPayHereConfig();
    if (!config.configured) {
      return NextResponse.json({
        mode: "demo",
        message: "PayHere not configured — use manual payment or set PAYHERE_MERCHANT_ID/SECRET",
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const amount = formatPayHereAmount(invoice.totalCents);
    const orderId = invoice.invoiceNumber;
    const currency = invoice.currency || "LKR";

    const hash = buildPayHereHash({
      merchantId: config.merchantId,
      orderId,
      amount,
      currency,
      merchantSecret: config.merchantSecret,
    });

    await prisma.payment.create({
      data: {
        userId: auth.user.id,
        orderId: invoice.orderId,
        invoiceId: invoice.id,
        amountCents: invoice.totalCents,
        currency,
        method: "PAYHERE",
        status: "PENDING",
        providerRef: orderId,
      },
    });

    return NextResponse.json({
      mode: "payhere",
      checkoutUrl: config.checkoutUrl,
      fields: {
        merchant_id: config.merchantId,
        return_url: `${siteUrl}/en/portal/invoices?paid=1`,
        cancel_url: `${siteUrl}/en/portal/invoices?cancelled=1`,
        notify_url: `${siteUrl}/api/payments/payhere/notify`,
        order_id: orderId,
        items: `MernCrest Invoice ${invoice.invoiceNumber}`,
        currency,
        amount,
        first_name: auth.user.fullName.split(" ")[0] || "Customer",
        last_name: auth.user.fullName.split(" ").slice(1).join(" ") || "User",
        email: auth.user.email,
        phone: "0770000000",
        address: "Colombo",
        city: "Colombo",
        country: "Sri Lanka",
        hash,
      },
    });
  } catch (error) {
    console.error("[payhere:checkout]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
