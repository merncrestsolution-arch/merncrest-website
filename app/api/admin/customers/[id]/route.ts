import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";
import { decryptPii, redactPii } from "@/lib/security/pii";
import { writeAuditLog } from "@/lib/erp/audit";

/** Full customer 360 — commerce + support + communications + CRM */
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
      profile: true,
      domains: { orderBy: { createdAt: "desc" } },
      hostingAccounts: { orderBy: { createdAt: "desc" } },
      subscriptions: true,
      orders: {
        include: { items: true, invoice: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
      tickets: {
        include: { messages: { take: 3, orderBy: { createdAt: "desc" } } },
        take: 20,
      },
      chatSessions: {
        include: { messages: { take: 5, orderBy: { createdAt: "desc" } } },
        take: 10,
      },
      callbackRequests: { take: 10, orderBy: { createdAt: "desc" } },
      callRecords: { take: 10, orderBy: { createdAt: "desc" } },
      quotations: { include: { items: true }, take: 10, orderBy: { createdAt: "desc" } },
      notifications: { take: 10, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const canReadPii = isAdminRole(auth.user.role);
  const profileOut = user.profile
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

  // Audit every admin read of PII fields (PDPA)
  if (
    canReadPii &&
    user.profile &&
    (user.profile.nicPassport || user.profile.businessReg)
  ) {
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "pii.read",
      module: "crm",
      entityType: "CustomerProfile",
      entityId: user.profile.id,
      summary: `Admin viewed NIC/passport/BR for ${user.email}`,
      meta: {
        customerId: user.id,
        fields: [
          user.profile.nicPassport ? "nicPassport" : null,
          user.profile.businessReg ? "businessReg" : null,
        ].filter(Boolean),
      },
    });
  }

  const phoneDigits = (user.profile?.whatsapp || user.profile?.phone || "").replace(/\D/g, "");

  const [crmLeads, whatsapp, csat] = await Promise.all([
    prisma.crmLead.findMany({
      where: { email: user.email.toLowerCase() },
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 10 },
        followUps: { orderBy: { dueAt: "asc" }, take: 5 },
        meetings: { orderBy: { scheduledAt: "desc" }, take: 5 },
        owner: { select: { fullName: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    phoneDigits
      ? prisma.whatsAppMessage.findMany({
          where: { phone: { contains: phoneDigits.slice(-9) } },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
    prisma.customerSatisfaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const openInvoices = user.invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID");
  const paidInvoices = user.invoices.filter((i) => i.status === "PAID");
  const renewals = [
    ...user.domains
      .filter((d) => d.expiresAt)
      .map((d) => ({
        type: "domain",
        label: `${d.name}.${d.tld}`,
        date: d.expiresAt,
      })),
    ...user.hostingAccounts
      .filter((h) => h.renewsAt)
      .map((h) => ({ type: "hosting", label: h.label, date: h.renewsAt })),
  ];

  const timeline = [
    ...user.activities.map((a) => ({
      id: a.id,
      channel: a.category,
      title: a.title,
      body: a.body,
      at: a.createdAt,
    })),
    ...whatsapp.map((w) => ({
      id: w.id,
      channel: "WHATSAPP",
      title: w.direction,
      body: w.body.slice(0, 120),
      at: w.createdAt,
    })),
    ...user.callRecords.map((c) => ({
      id: c.id,
      channel: "IVR",
      title: c.callNumber,
      body: `${c.department} · ${c.status}`,
      at: c.createdAt,
    })),
    ...user.tickets.map((t) => ({
      id: t.id,
      channel: "TICKET",
      title: t.ticketNumber,
      body: t.subject,
      at: t.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 50);

  return NextResponse.json({
    customer: {
      id: user.id,
      customerCode: user.profile?.customerCode,
      fullName: user.fullName,
      company: user.company,
      email: user.email,
      profile: profileOut,
      piiAccess: canReadPii ? "full" : "redacted",
      assignedSales: user.profile?.assignedSalesId,
      assignedSupport: user.profile?.assignedSupportId,
      customerRating: user.profile?.customerRating,
      services: {
        domains: user.domains,
        hosting: user.hostingAccounts,
        subscriptions: user.subscriptions,
        cloud: user.hostingAccounts.filter((h) =>
          /cloud|aws/i.test(h.planCode + h.label)
        ),
      },
      financial: {
        openInvoices,
        paidInvoices,
        creditBalanceCents: user.profile?.creditBalanceCents ?? 0,
        payments: user.payments,
        orders: user.orders,
        quotations: user.quotations,
      },
      support: {
        tickets: user.tickets,
        chats: user.chatSessions,
        callbacks: user.callbackRequests,
        calls: user.callRecords,
        whatsapp,
        csat,
      },
      crm: {
        leads: crmLeads,
      },
      renewals,
      timeline,
      notifications: user.notifications,
    },
  });
}
