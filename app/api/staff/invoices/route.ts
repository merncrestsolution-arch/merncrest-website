import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff, formatMoney } from "@/lib/commerce";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import { notifyClient } from "@/lib/notify/client-email";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";
import { linkInvoiceToSchedule } from "@/lib/billing/sync-payment-schedule";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { getStaffScope, invoiceScopeWhere } from "@/lib/erp/staff-scope";
import { scopeCreateFields } from "@/lib/erp/scope-stamp";
import { rateLimit, clientIp } from "@/lib/chat/rate-limit";
import { vatRatePercent } from "@/lib/billing/vat";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");

  const scope = await getStaffScope(auth.user);

  const invoices = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      ...invoiceScopeWhere(scope),
      ...(userId ? { userId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { fullName: true, email: true, company: true } },
      project: { select: { id: true, name: true, projectCode: true } },
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountCents: true,
          method: true,
          status: true,
          isAdvance: true,
          referenceNumber: true,
          receiptNumber: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiSuccess(
    invoices.map(serializeInvoice),
    { vatRatePercent: await vatRatePercent(), total: invoices.length }
  );
}

const lineSchema = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unitCents: z.number().int().positive(),
  discountCents: z.number().int().nonnegative().optional(),
  projectId: z.string().optional(),
  domainId: z.string().optional(),
  hostingAccountId: z.string().optional(),
});

const createSchema = z.object({
  userId: z.string(),
  projectId: z.string().optional(),
  domainId: z.string().optional(),
  hostingAccountId: z.string().optional(),
  paymentScheduleId: z.string().optional(),
  lineItems: z.array(lineSchema).min(1),
  dueDays: z.number().int().min(0).max(120).optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
  discountCents: z.number().int().nonnegative().optional(),
  taxCents: z.number().int().nonnegative().optional(),
  vatRatePercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
  advanceCents: z.number().int().nonnegative().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const rl = rateLimit({
    key: `invoice:create:${auth.user.id}:${clientIp(request)}`,
    limit: 15,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return apiError("RATE_LIMIT", "Too many invoice creation requests.", 429);
  }

  const canManage = await hasStaffPermission(auth.user, "billing.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing billing.manage permission", 403);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid invoice");
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return apiError("NOT_FOUND", "Customer not found", 404);

  const defaultVat = await vatRatePercent();
  const lineSubtotal = parsed.data.lineItems.reduce((s, l) => {
    return s + l.qty * l.unitCents - (l.discountCents || 0);
  }, 0);

  const totals = calcBillingTotals({
    lineSubtotalCents: lineSubtotal,
    discountCents: parsed.data.discountCents,
    taxCents: parsed.data.taxCents,
    vatRatePercent: parsed.data.vatRatePercent,
    defaultVatRatePercent: defaultVat,
  });

  if (totals.totalCents <= 0) {
    return apiError("VALIDATION", "Invoice total must be greater than zero");
  }

  const scope = await getStaffScope(auth.user);
  const stamp = scopeCreateFields(scope);

  const orderNumber = await nextOrgNumber("ORDER", {
    organizationId: stamp.organizationId,
    branchId: stamp.branchId,
  });
  const order = await prisma.order.create({
    data: {
      orderNumber,
      ...stamp,
      userId: user.id,
      status: "WAITING_PAYMENT",
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      discountCents: totals.discountCents,
      totalCents: totals.totalCents,
      currency: "LKR",
      items: {
        create: parsed.data.lineItems.map((l) => ({
          productName: l.description,
          productSlug: "manual-invoice",
          quantity: l.qty,
          unitPriceCents: l.unitCents,
          totalCents: l.qty * l.unitCents - (l.discountCents || 0),
          billingPeriod: "ONCE",
        })),
      },
    },
  });

  const invoiceNumber = await nextOrgNumber("INVOICE", {
    organizationId: stamp.organizationId,
    branchId: stamp.branchId,
  });
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + (parsed.data.dueDays ?? 14));

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        userId: user.id,
        ...stamp,
        projectId: parsed.data.projectId || null,
        domainId: parsed.data.domainId || null,
        hostingAccountId: parsed.data.hostingAccountId || null,
        status: parsed.data.status || "DRAFT",
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        paidCents: 0,
        currency: "LKR",
        lineItemsJson: JSON.stringify({
          lines: parsed.data.lineItems,
          discountCents: totals.discountCents,
          vatRatePercent: totals.vatRatePercent,
          notes: parsed.data.notes || null,
          advanceCents: parsed.data.advanceCents ?? 0,
        }),
        dueAt,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      },
      include: {
        user: { select: { fullName: true, email: true, company: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        payments: true,
      },
    });

    if (parsed.data.projectId) {
      await linkInvoiceToSchedule(
        tx,
        parsed.data.projectId,
        inv.id,
        parsed.data.paymentScheduleId
      );
    }

    return inv;
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "invoice.create",
    module: "billing",
    entityType: "Invoice",
    entityId: invoice.id,
    summary: `Created invoice ${invoice.invoiceNumber}`,
  });

  if (invoice.status === "SENT" && user.email) {
    void notifyClient("INVOICE_SENT", {
      toEmail: user.email,
      vars: {
        name: user.fullName,
        invoiceNumber: invoice.invoiceNumber,
        amount: formatMoney(totals.totalCents),
      },
      recordedById: auth.user.id,
    });
  }

  return apiSuccess(serializeInvoice(invoice), undefined, 201);
}
