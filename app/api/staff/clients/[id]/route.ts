import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";
import { decryptPii, redactPii } from "@/lib/security/pii";
import { getCustomerBillingSummaries } from "@/lib/billing/customer-summary";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { canAccessClient } from "@/lib/sales/scope";

/** Staff client 360 — unified profile for client detail page */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id }, { profile: { customerCode: id } }],
      role: "CUSTOMER",
    },
    include: {
      profile: {
        include: {
          contacts: {
            where: { deletedAt: null },
            orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
          },
          documents: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      },
      domains: { orderBy: { expiresAt: "asc" } },
      hostingAccounts: { orderBy: { renewsAt: "asc" } },
      subscriptions: true,
      invoices: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          payments: {
            where: { deletedAt: null },
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
      },
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amountCents: true,
          method: true,
          referenceNumber: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user || user.profile?.deletedAt) {
    return apiError("NOT_FOUND", "Client not found", 404);
  }

  const allowed = await canAccessClient(auth.user, user.id);
  if (!allowed) return apiError("FORBIDDEN", "You do not have access to this client", 403);

  const projects = await prisma.erpProject.findMany({
    where: { customerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      milestones: { take: 3, orderBy: { dueDate: "asc" } },
      _count: { select: { tasks: true, milestones: true } },
    },
  });

  const billingMap = await getCustomerBillingSummaries(prisma, [user.id]);
  const billing = billingMap.get(user.id) ?? {
    invoicedCents: 0,
    paidCents: 0,
    balanceCents: 0,
    invoiceCount: 0,
    contractCents: 0,
  };

  const canReadPii = isAdminRole(auth.user.role);
  const profile = user.profile
    ? {
        ...user.profile,
        nicPassport: canReadPii
          ? decryptPii(user.profile.nicPassport)
          : redactPii(user.profile.nicPassport),
        businessReg: canReadPii
          ? decryptPii(user.profile.businessReg)
          : redactPii(user.profile.businessReg),
      }
    : null;

  const activeProjects = projects.filter((p) => p.status === "ACTIVE" || p.status === "PLANNING").length;

  const services = [
    ...user.domains.map((d) => ({
      id: d.id,
      type: "domain" as const,
      label: `${d.name}.${d.tld}`,
      status: d.status,
      renewsAt: d.expiresAt,
    })),
    ...user.hostingAccounts.map((h) => ({
      id: h.id,
      type: "hosting" as const,
      label: h.label,
      status: h.status,
      renewsAt: h.renewsAt,
    })),
    ...user.subscriptions.map((s) => ({
      id: s.id,
      type: "subscription" as const,
      label: s.productName,
      status: s.status,
      renewsAt: s.nextBillingAt,
    })),
  ];

  return apiSuccess({
    id: user.id,
    customerCode: user.profile?.customerCode,
    fullName: user.fullName,
    company: user.company,
    email: user.email,
    profile,
    stats: {
      activeProjects,
      totalRevenueCents:
        billing.contractCents > 0 ? billing.contractCents : billing.invoicedCents,
      collectedCents: billing.paidCents,
      outstandingBalanceCents: billing.balanceCents,
      invoiceCount: billing.invoiceCount,
      serviceCount: services.length,
    },
    projects: projects.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      taskCount: p._count.tasks,
      milestoneCount: p._count.milestones,
    })),
    services,
    invoices: user.invoices.map((i) =>
      serializeInvoice({
        ...i,
        user: { fullName: user.fullName, email: user.email, company: user.company },
      })
    ),
    payments: user.payments.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      method: p.method,
      reference: p.referenceNumber,
      status: p.status,
      createdAt: p.createdAt,
    })),
    documents: (user.profile?.documents ?? []).map((d) => ({
      id: d.id,
      docNumber: d.docNumber,
      title: d.title,
      category: d.category,
      status: d.status,
      fileUrl: d.fileUrl,
      createdAt: d.createdAt,
    })),
    contacts: user.profile?.contacts ?? [],
  });
}
