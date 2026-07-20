import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import {
  BANK_TRANSFER_INSTRUCTIONS,
  getBankAccounts,
  getEnabledPaymentMethods,
  isAutomaticGatewayEnabled,
} from "@/lib/payments/config";
import { z } from "zod";

const schema = z.object({
  invoiceId: z.string().min(1),
  method: z.enum(["MANUAL", "BANK_TRANSFER"]).default("BANK_TRANSFER"),
  /** Bank transfer reference number (required) */
  referenceNumber: z.string().min(3).max(120),
  /** Receipt / screenshot URL or data URL (required) */
  proofImageUrl: z.string().min(8).max(2_000_000),
  /** Optional extra note — legacy clients may send proofNote alone */
  proofNote: z.string().max(500).optional(),
});

/**
 * Submit manual / bank-transfer payment for admin verification.
 * Requires reference number + receipt image. Does NOT auto-activate —
 * admin verification triggers automated provisioning (Fix 1).
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    // Back-compat: accept proofNote as referenceNumber if referenceNumber omitted
    const normalized = {
      ...body,
      referenceNumber: body.referenceNumber || body.proofNote,
      proofImageUrl: body.proofImageUrl || body.receiptUrl,
    };
    const parsed = schema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Provide invoiceId, bank transfer referenceNumber, and proofImageUrl (receipt screenshot)",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Basic sanity: image URL or data:image
    const img = parsed.data.proofImageUrl;
    const okImage =
      img.startsWith("http://") ||
      img.startsWith("https://") ||
      img.startsWith("/uploads/") ||
      img.startsWith("data:image/");
    if (!okImage) {
      return NextResponse.json(
        { error: "proofImageUrl must be an image URL or data:image upload" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: parsed.data.invoiceId, userId: auth.user.id },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    const existing = await prisma.payment.findFirst({
      where: {
        invoiceId: invoice.id,
        status: { in: ["PENDING", "AWAITING_VERIFICATION"] },
      },
    });
    if (existing) {
      return NextResponse.json({
        payment: existing,
        message: "Payment already submitted — awaiting admin verification",
        bank: BANK_TRANSFER_INSTRUCTIONS,
        accounts: getBankAccounts(),
      });
    }

    // Mark order waiting for payment verification
    await prisma.order.update({
      where: { id: invoice.orderId },
      data: { status: "WAITING_PAYMENT" },
    });

    const payment = await prisma.payment.create({
      data: {
        userId: auth.user.id,
        orderId: invoice.orderId,
        invoiceId: invoice.id,
        amountCents: invoice.totalCents,
        currency: invoice.currency,
        method: parsed.data.method,
        status: "AWAITING_VERIFICATION",
        referenceNumber: parsed.data.referenceNumber.trim(),
        proofNote: parsed.data.proofNote || parsed.data.referenceNumber.trim(),
        proofImageUrl: parsed.data.proofImageUrl,
        providerRef: `manual_${Date.now()}`,
      },
    });

    const { onCustomerPaymentSubmitted } = await import("@/lib/crm/customer-hooks");
    void onCustomerPaymentSubmitted({
      userId: auth.user.id,
      invoiceNumber: invoice.invoiceNumber,
      method: parsed.data.method,
    });

    const { notifyUser } = await import("@/lib/support/notify");
    void notifyUser({
      userId: auth.user.id,
      title: "Payment submitted",
      body: "We received your transfer details. An admin will verify shortly.",
      category: "BILLING",
      href: "/portal/invoices",
    });

    // Notify admins of new pending verification
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] } },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        notifyUser({
          userId: a.id,
          title: "Bank transfer awaiting verification",
          body: `${invoice.invoiceNumber} · ref ${parsed.data.referenceNumber}`,
          category: "BILLING",
          href: "/admin/payments",
        })
      )
    );

    return NextResponse.json({
      payment,
      message:
        "Payment submitted with receipt. An admin will verify and your service will provision automatically.",
      bank: BANK_TRANSFER_INSTRUCTIONS,
      accounts: getBankAccounts(),
    });
  } catch (error) {
    console.error("[payments:manual]", error);
    return NextResponse.json({ error: "Failed to submit payment" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    methods: getEnabledPaymentMethods(),
    automaticGatewaysEnabled: isAutomaticGatewayEnabled(),
    bank: BANK_TRANSFER_INSTRUCTIONS,
    accounts: getBankAccounts(),
  });
}
