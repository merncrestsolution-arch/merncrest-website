import { prisma } from "@/lib/db";

export type CustomerSupportSnapshot = {
  id: string;
  customerCode: string | null;
  fullName: string;
  company: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  customerSince: string;
  accountStatus: "active" | "at_risk" | "suspended" | "unknown";
  accountManager: string | null;
  preferredLanguage: string | null;
  customerRating: string | null;
  isVip: boolean;
  priorityStars: number;
  previousComplaints: number;
  staffNotes: string | null;
  services: {
    domains: { id: string; name: string; status: string; expiresAt: string | null; alert: "ok" | "warning" | "danger" }[];
    hosting: {
      id: string;
      label: string;
      status: string;
      renewsAt: string | null;
      sslStatus: string;
      alert: "ok" | "warning" | "danger";
    }[];
    subscriptions: { productName: string; status: string; nextBillingAt: string | null }[];
    ssl: { status: string; alert: "ok" | "warning" | "danger" }[];
    email: { count: number; status: string };
    website: { status: string } | null;
    erp: { version: string | null; status: string } | null;
    amc: { status: string } | null;
  };
  billing: {
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    lastPaymentCents: number | null;
    lastPaymentCurrency: string;
    nextRenewal: string | null;
    nextRenewalLabel: string | null;
    openTotalCents: number;
  };
  support: {
    openTickets: number;
    recentTickets: { ticketNumber: string; subject: string; status: string; createdAt: string }[];
  };
};

function renewalAlert(date: Date | null | undefined): "ok" | "warning" | "danger" {
  if (!date) return "ok";
  const days = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0) return "danger";
  if (days <= 30) return "warning";
  return "ok";
}

function ratingToStars(rating: string | null | undefined): number {
  switch (rating) {
    case "VIP":
      return 5;
    case "GOOD":
      return 4;
    case "AVERAGE":
      return 3;
    case "AT_RISK":
      return 2;
    default:
      return 3;
  }
}

export async function getCustomerSupportSnapshot(
  userId: string
): Promise<CustomerSupportSnapshot | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "CUSTOMER" },
    include: {
      profile: true,
      domains: { orderBy: { expiresAt: "asc" } },
      hostingAccounts: { orderBy: { renewsAt: "asc" } },
      subscriptions: { where: { status: { in: ["ACTIVE", "PAST_DUE", "PAUSED"] } } },
      invoices: { orderBy: { createdAt: "desc" }, take: 30 },
      payments: { where: { status: "SUCCEEDED" }, orderBy: { createdAt: "desc" }, take: 1 },
      tickets: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!user) return null;

  let accountManager: string | null = null;
  if (user.profile?.assignedSupportId) {
    const mgr = await prisma.user.findUnique({
      where: { id: user.profile.assignedSupportId },
      select: { fullName: true },
    });
    accountManager = mgr?.fullName || null;
  }

  const tags: string[] = user.profile?.tagsJson
    ? (JSON.parse(user.profile.tagsJson) as string[])
    : [];
  const isVip =
    user.profile?.customerRating === "VIP" || tags.some((t) => /vip/i.test(t));

  const openInvoices = user.invoices.filter(
    (i) => !["PAID", "VOID", "CANCELLED"].includes(i.status)
  );
  const overdueInvoices = user.invoices.filter((i) => i.status === "OVERDUE");
  const paidInvoices = user.invoices.filter((i) => i.status === "PAID");

  const renewals = [
    ...user.domains.filter((d) => d.expiresAt).map((d) => ({ label: `${d.name}.${d.tld}`, date: d.expiresAt! })),
    ...user.hostingAccounts.filter((h) => h.renewsAt).map((h) => ({ label: h.label, date: h.renewsAt! })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextRenewal = renewals[0] || null;

  const suspendedHosting = user.hostingAccounts.some((h) => h.status === "SUSPENDED");
  const expiredDomains = user.domains.some(
    (d) => d.status === "EXPIRED" || (d.expiresAt && d.expiresAt < new Date())
  );

  const emailSubs = user.subscriptions.filter((s) =>
    /email|mail|workspace/i.test(s.productSlug + s.productName)
  );
  const websiteSubs = user.subscriptions.filter((s) =>
    /website|web|site/i.test(s.productSlug + s.productName)
  );
  const erpSubs = user.subscriptions.filter((s) =>
    /erp|crm|enterprise/i.test(s.productSlug + s.productName)
  );
  const amcSubs = user.subscriptions.filter((s) =>
    /amc|support|maintenance|warranty/i.test(s.productSlug + s.productName)
  );

  const sslStatuses = user.hostingAccounts.map((h) => h.sslStatus);
  const sslActive = sslStatuses.some((s) => /active|valid|ok/i.test(s));
  const sslExpired = sslStatuses.some((s) => /expired|invalid/i.test(s));

  const complaints = user.tickets.filter((t) => t.category === "COMPLAINT").length;

  return {
    id: user.id,
    customerCode: user.profile?.customerCode || null,
    fullName: user.fullName,
    company: user.company,
    email: user.email,
    phone: user.profile?.phone || null,
    whatsapp: user.profile?.whatsapp || null,
    customerSince: user.createdAt.toISOString(),
    accountStatus: suspendedHosting || expiredDomains
      ? "suspended"
      : user.profile?.customerRating === "AT_RISK"
        ? "at_risk"
        : "active",
    accountManager,
    preferredLanguage: user.profile?.preferredLanguage || "en",
    customerRating: user.profile?.customerRating || null,
    isVip,
    priorityStars: ratingToStars(user.profile?.customerRating),
    previousComplaints: complaints,
    staffNotes: user.profile?.notes || null,
    services: {
      domains: user.domains.map((d) => ({
        id: d.id,
        name: `${d.name}.${d.tld}`,
        status: d.status,
        expiresAt: d.expiresAt?.toISOString() || null,
        alert: renewalAlert(d.expiresAt),
      })),
      hosting: user.hostingAccounts.map((h) => ({
        id: h.id,
        label: h.label,
        status: h.status,
        renewsAt: h.renewsAt?.toISOString() || null,
        sslStatus: h.sslStatus,
        alert: renewalAlert(h.renewsAt),
      })),
      subscriptions: user.subscriptions.map((s) => ({
        productName: s.productName,
        status: s.status,
        nextBillingAt: s.nextBillingAt?.toISOString() || null,
      })),
      ssl: user.hostingAccounts.map((h) => ({
        status: h.sslStatus,
        alert: /expired|invalid/i.test(h.sslStatus)
          ? "danger"
          : /pending/i.test(h.sslStatus)
            ? "warning"
            : "ok",
      })),
      email: {
        count: emailSubs.length || (user.hostingAccounts.length > 0 ? 1 : 0),
        status: emailSubs[0]?.status || (user.hostingAccounts.length ? "ACTIVE" : "NONE"),
      },
      website: websiteSubs[0]
        ? { status: websiteSubs[0].status }
        : user.hostingAccounts.some((h) => h.primaryDomain)
          ? { status: "ACTIVE" }
          : null,
      erp: erpSubs[0]
        ? { version: erpSubs[0].productName, status: erpSubs[0].status }
        : null,
      amc: amcSubs[0] ? { status: amcSubs[0].status } : null,
    },
    billing: {
      paidCount: paidInvoices.length,
      pendingCount: openInvoices.filter((i) => i.status !== "OVERDUE").length,
      overdueCount: overdueInvoices.length,
      lastPaymentCents: user.payments[0]?.amountCents ?? null,
      lastPaymentCurrency: user.payments[0]?.currency || "LKR",
      nextRenewal: nextRenewal?.date.toISOString() || null,
      nextRenewalLabel: nextRenewal?.label || null,
      openTotalCents: openInvoices.reduce((s, i) => s + (i.totalCents - i.paidCents), 0),
    },
    support: {
      openTickets: user.tickets.filter((t) =>
        ["OPEN", "IN_PROGRESS", "WAITING"].includes(t.status)
      ).length,
      recentTickets: user.tickets.slice(0, 5).map((t) => ({
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
    },
  };
}
