import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPayHereConfig, verifyPayHereNotify } from "@/lib/payments/payhere";
import { markInvoicePaid } from "@/lib/services/fulfillment";

/** PayHere server-to-server notify webhook */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const merchantId = String(form.get("merchant_id") || "");
    const orderId = String(form.get("order_id") || "");
    const payhereAmount = String(form.get("payhere_amount") || "");
    const payhereCurrency = String(form.get("payhere_currency") || "");
    const statusCode = String(form.get("status_code") || "");
    const md5sig = String(form.get("md5sig") || "");
    const paymentId = String(form.get("payment_id") || "");

    const config = getPayHereConfig();
    if (!config.configured) {
      return NextResponse.json({ error: "PayHere not configured" }, { status: 503 });
    }

    const valid = verifyPayHereNotify({
      merchantId,
      orderId,
      amount: payhereAmount,
      currency: payhereCurrency,
      statusCode,
      md5sig,
      merchantSecret: config.merchantSecret,
    });

    if (!valid) {
      console.error("[payhere:notify] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // status_code 2 = success
    if (statusCode !== "2") {
      await prisma.payment.updateMany({
        where: { providerRef: orderId, method: "PAYHERE" },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ ok: true, status: "ignored" });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: orderId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Mark any pending PayHere attempt as succeeded before fulfillment
    await prisma.payment.updateMany({
      where: {
        invoiceId: invoice.id,
        method: "PAYHERE",
        status: { in: ["PENDING", "AWAITING_VERIFICATION"] },
      },
      data: {
        status: "SUCCEEDED",
        providerRef: paymentId || orderId,
      },
    });

    await markInvoicePaid({
      invoiceId: invoice.id,
      userId: invoice.userId,
      method: "PAYHERE",
      providerRef: paymentId || orderId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payhere:notify]", error);
    return NextResponse.json({ error: "Notify failed" }, { status: 500 });
  }
}
