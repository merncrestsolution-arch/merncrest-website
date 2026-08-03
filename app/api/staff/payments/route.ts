import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { getStaffScope, invoiceScopeWhere, staffDataScopeWhere } from "@/lib/erp/staff-scope";

/** Staff payment ledger — for receipts list in Connect mobile. */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "billing.view");
  if (!canView) return apiError("FORBIDDEN", "Missing billing.view permission", 403);

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 200);

  const scope = await getStaffScope(auth.user);

  const payments = await prisma.payment.findMany({
    where: {
      deletedAt: null,
      status: "SUCCEEDED",
      ...(userId ? { userId } : {}),
      OR: [
        { invoice: { deletedAt: null, ...invoiceScopeWhere(scope) } },
        { invoiceId: null, order: staffDataScopeWhere(scope) },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amountCents: true,
      currency: true,
      method: true,
      referenceNumber: true,
      receiptNumber: true,
      status: true,
      createdAt: true,
      paidAt: true,
      user: { select: { fullName: true, email: true, company: true } },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          totalCents: true,
          paidCents: true,
        },
      },
    },
  });

  return apiSuccess(
    payments.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      currency: p.currency,
      method: p.method,
      referenceNumber: p.referenceNumber,
      receiptNumber: p.receiptNumber,
      status: p.status,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      customer: p.user,
      invoiceId: p.invoice?.id,
      invoiceNumber: p.invoice?.invoiceNumber,
      invoiceTotalCents: p.invoice?.totalCents,
      invoicePaidCents: p.invoice?.paidCents,
      receiptPath: `/api/payments/${p.id}/receipt`,
    })),
    { total: payments.length }
  );
}
