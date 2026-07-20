import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { markInvoicePaid } from "@/lib/services/fulfillment";
import { writeAuditLog } from "@/lib/erp/audit";
import { notifyUser } from "@/lib/support/notify";
import { PAYMENT_VERIFY_SLA_MS } from "@/lib/payments/config";
import { z } from "zod";

/** Pending Verification queue — oldest first, with SLA flags */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const payments = await prisma.payment.findMany({
    where: {
      status: { in: ["PENDING", "AWAITING_VERIFICATION"] },
    },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      invoice: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalCents: true,
          currency: true,
          status: true,
          items: {
            select: { productName: true, quantity: true, unitPriceCents: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const now = Date.now();
  const enriched = payments.map((p) => {
    const ageMs = now - new Date(p.createdAt).getTime();
    return {
      ...p,
      slaBreached: ageMs > PAYMENT_VERIFY_SLA_MS,
      waitingHours: Math.round((ageMs / (60 * 60 * 1000)) * 10) / 10,
    };
  });

  return NextResponse.json({
    payments: enriched,
    slaHours: PAYMENT_VERIFY_SLA_MS / (60 * 60 * 1000),
  });
}

const actionSchema = z.object({
  paymentId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  adminNote: z.string().optional(),
});

/** Approve or reject — approval triggers automated provisioning (Fix 1) */
export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data.paymentId },
  });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }
  if (!["PENDING", "AWAITING_VERIFICATION"].includes(payment.status)) {
    return NextResponse.json({ error: "Payment already processed" }, { status: 400 });
  }
  if (!payment.invoiceId) {
    return NextResponse.json({ error: "Payment missing invoice" }, { status: 404 });
  }

  if (parsed.data.action === "reject") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REJECTED",
        adminNote: parsed.data.adminNote || "Rejected by admin",
        verifiedById: auth.user.id,
        verifiedAt: new Date(),
      },
    });

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "payment.reject",
      module: "marketplace",
      entityType: "Payment",
      entityId: payment.id,
      summary: `Rejected payment for invoice ${payment.invoiceId}`,
      meta: { adminNote: parsed.data.adminNote },
    });

    void notifyUser({
      userId: payment.userId,
      title: "Payment not verified",
      body:
        parsed.data.adminNote ||
        "Your bank transfer could not be verified. Please check the reference and resubmit.",
      category: "BILLING",
      href: "/portal/invoices",
    });

    return NextResponse.json({ message: "Payment rejected" });
  }

  // Approve → mark paid → auto-provision (single manual step in lifecycle)
  const result = await markInvoicePaid({
    invoiceId: payment.invoiceId,
    userId: payment.userId,
    method: payment.method,
    providerRef: payment.providerRef || `verified_${payment.id}`,
    verifiedById: auth.user.id,
  });

  // Ensure admin note on this payment row
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCEEDED",
      adminNote: parsed.data.adminNote || "Verified by admin",
      verifiedById: auth.user.id,
      verifiedAt: new Date(),
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "payment.approve",
    module: "marketplace",
    entityType: "Payment",
    entityId: payment.id,
    summary: result.alreadyPaid
      ? "Invoice already paid"
      : "Payment verified — auto-provisioning started",
    meta: { invoiceId: payment.invoiceId, orderId: payment.orderId },
  });

  if (!result.alreadyPaid) {
    void notifyUser({
      userId: payment.userId,
      title: "Payment confirmed",
      body: "Payment confirmed, your service is being set up.",
      category: "BILLING",
      href: "/portal/services",
    });
  }

  return NextResponse.json({
    message: result.alreadyPaid
      ? "Invoice already paid"
      : "Payment approved — automated provisioning started",
    alreadyPaid: result.alreadyPaid,
  });
}
