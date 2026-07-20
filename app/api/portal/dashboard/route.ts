import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";

/** Aggregated customer self-service dashboard */
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const userId = auth.user.id;
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    user,
    orders,
    invoices,
    domains,
    hosting,
    subscriptions,
    tickets,
    notifications,
    announcements,
    activities,
    pendingPayments,
    quotations,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.domain.findMany({
      where: { userId },
      orderBy: { expiresAt: "asc" },
    }),
    prisma.hostingAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { userId, status: "ACTIVE" },
    }),
    prisma.ticket.findMany({
      where: {
        userId,
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.announcement.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { startsAt: "desc" },
      take: 5,
    }),
    prisma.customerActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.payment.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "AWAITING_VERIFICATION"] },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { invoice: true },
    }),
    prisma.quotation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const renewals = [
    ...domains
      .filter((d) => d.expiresAt && d.expiresAt <= in30)
      .map((d) => ({
        type: "domain" as const,
        label: `${d.name}.${d.tld}`,
        date: d.expiresAt,
        href: "/portal/domains",
      })),
    ...hosting
      .filter((h) => h.renewsAt && h.renewsAt <= in30)
      .map((h) => ({
        type: "hosting" as const,
        label: h.label,
        date: h.renewsAt,
        href: "/portal/hosting",
      })),
    ...subscriptions
      .filter((s) => s.nextBillingAt && s.nextBillingAt <= in30)
      .map((s) => ({
        type: "subscription" as const,
        label: s.productName,
        date: s.nextBillingAt,
        href: "/portal/services",
      })),
  ].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  const unreadNotifications = notifications.filter((n) => !n.readAt).length;
  const pendingInvoices = invoices.filter(
    (i) => i.status !== "PAID" && i.status !== "VOID"
  );

  return NextResponse.json({
    profile: {
      id: user?.id,
      email: user?.email,
      fullName: user?.fullName,
      company: user?.company,
      emailVerifiedAt: user?.emailVerifiedAt,
      customerCode: user?.profile?.customerCode,
      photoUrl: user?.profile?.photoUrl,
      phone: user?.profile?.phone,
      whatsapp: user?.profile?.whatsapp,
      preferredLanguage: user?.profile?.preferredLanguage,
      timezone: user?.profile?.timezone,
      country: user?.profile?.country,
    },
    stats: {
      domains: domains.length,
      hosting: hosting.filter((h) => h.status === "ACTIVE").length,
      cloud: hosting.filter((h) => /cloud|aws/i.test(h.planCode + h.label)).length,
      software: subscriptions.filter((s) =>
        /software|erp|crm|growth|website/i.test(s.productSlug + s.productName)
      ).length,
      openTickets: tickets.length,
      pendingInvoices: pendingInvoices.length,
      pendingPayments: pendingPayments.length,
      unreadNotifications,
      activeSubscriptions: subscriptions.length,
    },
    recentOrders: orders,
    pendingInvoices,
    activeServices: {
      domains: domains.filter((d) => d.status === "ACTIVE").slice(0, 6),
      hosting: hosting.filter((h) => h.status === "ACTIVE").slice(0, 6),
      subscriptions: subscriptions.slice(0, 6),
    },
    openTickets: tickets,
    announcements,
    notifications,
    renewals: renewals.slice(0, 8),
    pendingPayments,
    quotations,
    activities,
  });
}
