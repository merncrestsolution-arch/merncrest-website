import { prisma } from "@/lib/db";
import { getSettingBool } from "@/lib/admin/settings";

export type CloudResourceRow = {
  id: string;
  type: "LIGHTSAIL" | "EC2" | "S3" | "RDS" | "ROUTE53" | "HOSTING" | "DOMAIN";
  name: string;
  region: string;
  status: string;
  detail?: string;
  href?: string;
};

export type CloudDashboardPayload = {
  account: {
    label: string;
    provider: string;
    region: string;
    accountId: string | null;
    configured: boolean;
    lastSyncAt: string;
  };
  summary: {
    totalResources: number;
    running: number;
    alerts: number;
    estimatedMonthlyUsd: number | null;
  };
  services: {
    ec2: number;
    lightsail: number;
    s3: number;
    rds: number;
    route53: number;
    hosting: number;
    domains: number;
  };
  resources: CloudResourceRow[];
  costNotes: string[];
};

const DEFAULT_REGION = process.env.AWS_REGION || "us-east-1";

export async function getCloudDashboard(): Promise<CloudDashboardPayload> {
  const [domains, hosting, providers, maintenance] = await Promise.all([
    prisma.domain.findMany({
      where: { status: { in: ["ACTIVE", "PENDING", "TRANSFERRING"] } },
      orderBy: { expiresAt: "asc" },
      take: 50,
      select: {
        id: true,
        name: true,
        tld: true,
        status: true,
        expiresAt: true,
        provider: { select: { name: true } },
      },
    }),
    prisma.hostingAccount.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { renewsAt: "asc" },
      take: 50,
      select: {
        id: true,
        label: true,
        planCode: true,
        status: true,
        renewsAt: true,
        sslStatus: true,
        primaryDomain: true,
        providerId: true,
      },
    }),
    prisma.provider.findMany({
      where: { status: "ACTIVE" },
      orderBy: { priority: "asc" },
      take: 10,
      select: { id: true, name: true, status: true, providerType: true },
    }),
    getSettingBool("maintenance.enabled", false),
  ]);

  const awsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
  const accountId = process.env.AWS_ACCOUNT_ID || null;
  const lightsailIp = process.env.LIGHTSAIL_STATIC_IP || null;

  const resources: CloudResourceRow[] = [];

  if (lightsailIp || process.env.NEXT_PUBLIC_SITE_URL?.includes("merncrest.lk")) {
    resources.push({
      id: "lightsail-prod",
      type: "LIGHTSAIL",
      name: "merncrest-production",
      region: DEFAULT_REGION,
      status: maintenance ? "MAINTENANCE" : "RUNNING",
      detail: lightsailIp ? `Static IP ${lightsailIp}` : "Production stack (Docker)",
      href: "/staff/monitoring",
    });
  }

  resources.push({
    id: "route53-merncrest",
    type: "ROUTE53",
    name: "merncrest.lk zone",
    region: "global",
    status: "ACTIVE",
    detail: "DNS for merncrest.lk · system.merncrest.lk",
  });

  for (const h of hosting) {
    resources.push({
      id: h.id,
      type: "HOSTING",
      name: h.label,
      region: DEFAULT_REGION,
      status: h.status,
      detail: [h.planCode, h.primaryDomain, h.sslStatus ? `SSL ${h.sslStatus}` : null]
        .filter(Boolean)
        .join(" · "),
      href: "/admin/domains",
    });
  }

  for (const d of domains) {
    resources.push({
      id: d.id,
      type: "DOMAIN",
      name: `${d.name}.${d.tld}`,
      region: "global",
      status: d.status,
      detail: d.provider?.name
        ? `${d.provider.name}${d.expiresAt ? ` · expires ${d.expiresAt.toISOString().slice(0, 10)}` : ""}`
        : d.expiresAt
          ? `expires ${d.expiresAt.toISOString().slice(0, 10)}`
          : undefined,
      href: "/admin/domains",
    });
  }

  for (const p of providers) {
    if (
      p.providerType === "CLOUD" ||
      p.name.toLowerCase().includes("aws") ||
      p.name.toLowerCase().includes("cloud")
    ) {
      resources.push({
        id: p.id,
        type: "EC2",
        name: p.name,
        region: DEFAULT_REGION,
        status: p.status,
        detail: "Reseller provider integration",
      });
    }
  }

  const running = resources.filter((r) =>
    ["ACTIVE", "RUNNING", "ONLINE"].includes(r.status.toUpperCase())
  ).length;
  const alerts = resources.filter((r) =>
    ["EXPIRED", "FAILED", "MAINTENANCE", "DEGRADED", "PENDING"].includes(r.status.toUpperCase())
  ).length;

  const costNotes: string[] = [];
  if (!awsConfigured) {
    costNotes.push(
      "Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in .env for live AWS API sync."
    );
  }
  costNotes.push("Hosting and domain rows are synced from the reseller marketplace database.");
  if (maintenance) {
    costNotes.push("Maintenance mode is ON — production may show as maintenance.");
  }

  return {
    account: {
      label: "MernCrest Production",
      provider: "AWS",
      region: DEFAULT_REGION,
      accountId,
      configured: awsConfigured,
      lastSyncAt: new Date().toISOString(),
    },
    summary: {
      totalResources: resources.length,
      running,
      alerts,
      estimatedMonthlyUsd: awsConfigured ? null : null,
    },
    services: {
      ec2: resources.filter((r) => r.type === "EC2").length,
      lightsail: resources.filter((r) => r.type === "LIGHTSAIL").length,
      s3: resources.filter((r) => r.type === "S3").length,
      rds: resources.filter((r) => r.type === "RDS").length,
      route53: resources.filter((r) => r.type === "ROUTE53").length,
      hosting: hosting.length,
      domains: domains.length,
    },
    resources,
    costNotes,
  };
}
