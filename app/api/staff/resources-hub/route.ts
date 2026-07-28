import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiSuccess } from "@/lib/api/envelope";
import {
  computeDomainDisplayStatus,
  domainExpiryAlertLevel,
  computeSslDisplayStatus,
} from "@/lib/domains/status";

function parseLinkedDomains(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Cross-client domain, hosting, and subscription services dashboard (Phase 10) */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") ?? "";
  const provider = (searchParams.get("provider") ?? "").trim();
  const expiringOnly = searchParams.get("expiringOnly") === "1";

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [domains, hosting, subscriptions, activeProjects] = await Promise.all([
    prisma.domain.findMany({
      where: {
        deletedAt: null,
        ...(expiringOnly
          ? { expiresAt: { lte: in30Days } }
          : {}),
        ...(provider
          ? {
              OR: [
                { registrar: { contains: provider, mode: "insensitive" } },
                { provider: { name: { contains: provider, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, company: true } },
        provider: { select: { name: true } },
      },
      orderBy: { expiresAt: "asc" },
      take: 200,
    }),
    prisma.hostingAccount.findMany({
      where: {
        deletedAt: null,
        ...(expiringOnly
          ? {
              OR: [
                { sslExpiresAt: { lte: in30Days } },
                { renewsAt: { lte: in30Days } },
              ],
            }
          : {}),
        ...(provider
          ? { provider: { name: { contains: provider, mode: "insensitive" } } }
          : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, company: true } },
        provider: { select: { name: true } },
      },
      orderBy: { renewsAt: "asc" },
      take: 200,
    }),
    prisma.subscription.findMany({
      where: {
        status: { in: ["ACTIVE", "PAST_DUE", "PAUSED"] },
        ...(provider
          ? { productName: { contains: provider, mode: "insensitive" } }
          : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, company: true } },
      },
      orderBy: { nextBillingAt: "asc" },
      take: 200,
    }),
    prisma.erpProject.findMany({
      where: { status: { in: ["PLANNING", "ACTIVE"] } },
      select: { customerId: true },
    }),
  ]);

  const clientsWithActiveProject = new Set(
    activeProjects.map((p) => p.customerId).filter(Boolean) as string[]
  );

  const domainRows = domains.map((d) => ({
    id: d.id,
    type: "domain" as const,
    name: `${d.name}.${d.tld}`,
    status: computeDomainDisplayStatus(d),
    expiryAlert: domainExpiryAlertLevel(d.expiresAt),
    expiresAt: d.expiresAt,
    provider: d.registrar || d.provider?.name || null,
    client: {
      id: d.user.id,
      name: d.user.company || d.user.fullName,
      email: d.user.email,
      hasActiveProject: clientsWithActiveProject.has(d.user.id),
    },
    href: `/staff/domains/${d.id}`,
  }));

  const hostingRows = hosting.map((h) => {
    const linked = parseLinkedDomains(h.linkedDomainsJson);
    return {
      id: h.id,
      type: "hosting" as const,
      name: h.label,
      status: h.status,
      sslStatus: computeSslDisplayStatus(h.sslStatus, h.sslExpiresAt),
      sslExpiresAt: h.sslExpiresAt,
      renewsAt: h.renewsAt,
      provider: h.provider?.name || null,
      linkedDomains: linked,
      client: {
        id: h.user.id,
        name: h.user.company || h.user.fullName,
        email: h.user.email,
        hasActiveProject: clientsWithActiveProject.has(h.user.id),
      },
      href: `/staff/hosting/${h.id}`,
    };
  });

  const cloudRows = subscriptions.map((s) => ({
    id: s.id,
    type: "cloud" as const,
    name: s.productName,
    status: s.status,
    billingPeriod: s.billingPeriod,
    amountCents: s.amountCents,
    renewsAt: s.nextBillingAt,
    provider: s.productSlug,
    client: {
      id: s.user.id,
      name: s.user.company || s.user.fullName,
      email: s.user.email,
      hasActiveProject: clientsWithActiveProject.has(s.user.id),
    },
    href: `/staff/cloud`,
  }));

  let combined = [...domainRows, ...hostingRows, ...cloudRows];

  if (filter === "no_active_project") {
    combined = combined.filter((r) => !r.client.hasActiveProject);
  }

  const stats = {
    domains: domainRows.length,
    hosting: hostingRows.length,
    cloud: cloudRows.length,
    noActiveProject: combined.filter((r) => !r.client.hasActiveProject).length,
    expiringSoon: domainRows.filter((d) => d.expiryAlert !== "none").length,
  };

  return apiSuccess(combined, { stats });
}
