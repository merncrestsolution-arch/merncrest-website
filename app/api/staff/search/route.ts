import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiSuccess } from "@/lib/api/envelope";

export type StaffSearchResult = {
  id: string;
  type: "client" | "project" | "invoice" | "domain" | "hosting";
  title: string;
  subtitle: string;
  href: string;
};

/** Global staff search — clients, projects, invoices, domains */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return apiSuccess<StaffSearchResult[]>([]);
  }

  const [clients, projects, invoices, domains, hosting] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { profile: { customerCode: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        profile: { select: { customerCode: true } },
      },
      take: 8,
    }),
    prisma.erpProject.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { projectCode: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, projectCode: true, customerId: true },
      take: 8,
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" } },
          { user: { fullName: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        user: { select: { fullName: true } },
      },
      take: 8,
    }),
    prisma.domain.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tld: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        tld: true,
        user: { select: { fullName: true } },
      },
      take: 8,
    }),
    prisma.hostingAccount.findMany({
      where: {
        deletedAt: null,
        OR: [
          { label: { contains: q, mode: "insensitive" } },
          { primaryDomain: { contains: q, mode: "insensitive" } },
          { planCode: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        label: true,
        planCode: true,
        user: { select: { fullName: true } },
      },
      take: 8,
    }),
  ]);

  const results: StaffSearchResult[] = [
    ...clients.map((c) => ({
      id: `client-${c.id}`,
      type: "client" as const,
      title: c.company || c.fullName,
      subtitle: c.profile?.customerCode ?? c.email,
      href: `/staff/clients/${c.id}`,
    })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      type: "project" as const,
      title: p.name,
      subtitle: p.projectCode,
      href: `/staff/projects/${p.id}`,
    })),
    ...invoices.map((i) => ({
      id: `invoice-${i.id}`,
      type: "invoice" as const,
      title: i.invoiceNumber,
      subtitle: i.user.fullName,
      href: `/staff/billing?invoice=${i.id}`,
    })),
    ...domains.map((d) => ({
      id: `domain-${d.id}`,
      type: "domain" as const,
      title: `${d.name}.${d.tld}`,
      subtitle: d.user.fullName,
      href: `/staff/domains/${d.id}`,
    })),
    ...hosting.map((h) => ({
      id: `hosting-${h.id}`,
      type: "hosting" as const,
      title: h.label,
      subtitle: `${h.planCode} · ${h.user.fullName}`,
      href: `/staff/hosting/${h.id}`,
    })),
  ];

  return apiSuccess(results, { query: q, count: results.length });
}
