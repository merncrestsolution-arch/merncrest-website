import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { getCustomerBillingSummaries } from "@/lib/billing/customer-summary";
import { apiSuccess } from "@/lib/api/envelope";
import { getAssignedClientIds, isSalesAgent } from "@/lib/sales/scope";

/** Staff client list with billing summaries — scoped for sales agents. */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 200), 200);

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      profile: { deletedAt: null },
      AND: [
        q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { company: { contains: q, mode: "insensitive" } },
                { profile: { customerCode: { contains: q, mode: "insensitive" } } },
                { profile: { phone: { contains: q } } },
              ],
            }
          : {},
      ],
    },
    include: {
      profile: {
        select: {
          id: true,
          customerCode: true,
          phone: true,
          customerRating: true,
          deletedAt: true,
        },
      },
      _count: {
        select: {
          orders: true,
          invoices: true,
          domains: true,
          hostingAccounts: true,
          tickets: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  let rows = customers.map((c) => ({
    id: c.id,
    customerCode: c.profile?.customerCode,
    fullName: c.fullName,
    email: c.email,
    company: c.company,
    phone: c.profile?.phone,
    customerRating: c.profile?.customerRating,
    counts: c._count,
    createdAt: c.createdAt,
  }));

  const salesAgent = await isSalesAgent(auth.user);
  if (salesAgent) {
    const assigned = new Set(await getAssignedClientIds(auth.user.id));
    rows = rows.filter((r) => assigned.has(r.id));
  }

  const billingMap = await getCustomerBillingSummaries(prisma, rows.map((r) => r.id));
  const withBilling = rows.map((r) => ({
    ...r,
    billing: billingMap.get(r.id) ?? {
      invoicedCents: 0,
      paidCents: 0,
      balanceCents: 0,
      invoiceCount: 0,
    },
  }));

  return apiSuccess(withBilling, { total: withBilling.length });
}
