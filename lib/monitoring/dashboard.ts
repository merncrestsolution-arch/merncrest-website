import { prisma } from "@/lib/db";
import { getSettingBool } from "@/lib/admin/settings";
import { getPublicSiteOrigin } from "@/lib/support/public-site-url";

export type MonitorCheckResult = {
  id: string;
  name: string;
  kind: "HTTP" | "SSL" | "DATABASE" | "REDIS" | "PROCESS";
  target: string;
  status: "UP" | "DOWN" | "DEGRADED" | "MAINTENANCE";
  responseMs: number | null;
  message: string;
  checkedAt: string;
};

export type MonitorIncident = {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  since: string;
  source: string;
};

export type ServerMetric = {
  label: string;
  value: number;
  unit: "%" | "ms" | "conn";
  status: "ok" | "warn" | "critical";
};

export type MonitoringDashboardPayload = {
  overall: "healthy" | "degraded" | "maintenance";
  uptimePercent: number;
  checks: MonitorCheckResult[];
  incidents: MonitorIncident[];
  server: {
    platform: string;
    metrics: ServerMetric[];
    containers: { name: string; status: string }[];
  };
  websites: { url: string; status: string; responseMs: number | null }[];
};

async function probeUrl(url: string, timeoutMs = 8000): Promise<{ ok: boolean; ms: number; status: number }> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: res.ok || res.status < 500, ms: Date.now() - started, status: res.status };
  } catch {
    return { ok: false, ms: Date.now() - started, status: 0 };
  }
}

export async function getMonitoringDashboard(): Promise<MonitoringDashboardPayload> {
  const origin = getPublicSiteOrigin();
  const systemUrl = origin.replace("://merncrest.lk", "://system.merncrest.lk");
  const maintenance = await getSettingBool("maintenance.enabled", false);

  const dbStarted = Date.now();
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const dbMs = Date.now() - dbStarted;

  const [siteProbe, systemProbe, openTickets, pendingPayments, expiringDomains, sslIssues, backups] =
    await Promise.all([
      probeUrl(`${origin}/en`),
      probeUrl(`${systemUrl}/en/staff`),
      prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.payment.count({
        where: { status: { in: ["PENDING", "AWAITING_VERIFICATION"] } },
      }),
      prisma.domain.count({
        where: {
          status: "ACTIVE",
          expiresAt: { lte: new Date(Date.now() + 30 * 86400000) },
        },
      }),
      prisma.hostingAccount.count({
        where: { status: "ACTIVE", sslStatus: { in: ["EXPIRED", "FAILED", "PENDING", "NONE"] } },
      }),
      prisma.backupRecord.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    ]);

  const now = new Date().toISOString();
  const checks: MonitorCheckResult[] = [
    {
      id: "http-marketing",
      name: "Marketing site",
      kind: "HTTP",
      target: origin,
      status: maintenance ? "MAINTENANCE" : siteProbe.ok ? "UP" : "DOWN",
      responseMs: siteProbe.ms,
      message: siteProbe.ok ? `HTTP ${siteProbe.status}` : "Unreachable",
      checkedAt: now,
    },
    {
      id: "http-system",
      name: "Staff portal",
      kind: "HTTP",
      target: systemUrl,
      status: maintenance ? "MAINTENANCE" : systemProbe.ok ? "UP" : "DOWN",
      responseMs: systemProbe.ms,
      message: systemProbe.ok ? `HTTP ${systemProbe.status}` : "Unreachable",
      checkedAt: now,
    },
    {
      id: "db-postgres",
      name: "PostgreSQL",
      kind: "DATABASE",
      target: "postgres",
      status: dbOk ? "UP" : "DOWN",
      responseMs: dbMs,
      message: dbOk ? "Connected" : "Connection failed",
      checkedAt: now,
    },
    {
      id: "ssl-watch",
      name: "SSL / certificates",
      kind: "SSL",
      target: "hosting + domains",
      status: sslIssues > 0 ? "DEGRADED" : "UP",
      responseMs: null,
      message: sslIssues > 0 ? `${sslIssues} hosting SSL issue(s)` : "No critical SSL flags",
      checkedAt: now,
    },
    {
      id: "redis-cache",
      name: "Redis cache",
      kind: "REDIS",
      target: process.env.REDIS_URL ? "redis" : "not-configured",
      status: process.env.REDIS_URL ? "UP" : "DEGRADED",
      responseMs: null,
      message: process.env.REDIS_URL ? "REDIS_URL set" : "REDIS_URL not set (optional in dev)",
      checkedAt: now,
    },
  ];

  const upCount = checks.filter((c) => c.status === "UP").length;
  const uptimePercent = Math.round((upCount / checks.length) * 1000) / 10;

  const incidents: MonitorIncident[] = [];
  if (maintenance) {
    incidents.push({
      id: "maint",
      title: "Maintenance mode enabled",
      severity: "warning",
      since: now,
      source: "platform",
    });
  }
  if (!dbOk) {
    incidents.push({
      id: "db-down",
      title: "Database unreachable",
      severity: "critical",
      since: now,
      source: "postgres",
    });
  }
  if (expiringDomains > 0) {
    incidents.push({
      id: "domain-expiry",
      title: `${expiringDomains} domain(s) expiring within 30 days`,
      severity: "warning",
      since: now,
      source: "domains",
    });
  }
  if (openTickets > 10) {
    incidents.push({
      id: "ticket-queue",
      title: `High ticket queue (${openTickets} open)`,
      severity: "info",
      since: now,
      source: "support",
    });
  }
  if (pendingPayments > 5) {
    incidents.push({
      id: "payments-pending",
      title: `${pendingPayments} payments awaiting verification`,
      severity: "info",
      since: now,
      source: "finance",
    });
  }

  const lastBackup = backups[0];
  if (!lastBackup || lastBackup.status !== "COMPLETED") {
    incidents.push({
      id: "backup",
      title: "No recent successful backup on record",
      severity: "warning",
      since: now,
      source: "backup",
    });
  }

  const overall: MonitoringDashboardPayload["overall"] = maintenance
    ? "maintenance"
    : !dbOk || checks.some((c) => c.status === "DOWN")
      ? "degraded"
      : "healthy";

  return {
    overall,
    uptimePercent,
    checks,
    incidents,
    server: {
      platform: "Docker · Lightsail · Nginx",
      metrics: [
        {
          label: "DB latency",
          value: dbMs,
          unit: "ms",
          status: dbMs > 500 ? "warn" : "ok",
        },
        {
          label: "Site response",
          value: siteProbe.ms,
          unit: "ms",
          status: siteProbe.ms > 2000 ? "warn" : "ok",
        },
        {
          label: "Uptime score",
          value: uptimePercent,
          unit: "%",
          status: uptimePercent < 80 ? "critical" : uptimePercent < 95 ? "warn" : "ok",
        },
        {
          label: "Open tickets",
          value: openTickets,
          unit: "conn",
          status: openTickets > 20 ? "warn" : "ok",
        },
      ],
      containers: [
        { name: "merncrest-app", status: siteProbe.ok ? "running" : "unknown" },
        { name: "merncrest-nginx", status: siteProbe.ok ? "running" : "unknown" },
        { name: "merncrest-postgres", status: dbOk ? "healthy" : "down" },
        { name: "merncrest-redis", status: process.env.REDIS_URL ? "running" : "optional" },
      ],
    },
    websites: [
      { url: origin, status: siteProbe.ok ? "up" : "down", responseMs: siteProbe.ms },
      { url: systemUrl, status: systemProbe.ok ? "up" : "down", responseMs: systemProbe.ms },
    ],
  };
}
