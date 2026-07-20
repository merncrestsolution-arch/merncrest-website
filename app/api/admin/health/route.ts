import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireStaffOrAdmin } from "@/lib/admin/require-admin";
import {
  ensureDefaultSettings,
  getSetting,
  getSettingBool,
} from "@/lib/admin/settings";
import { writeAuditLog } from "@/lib/erp/audit";

/** Platform health + monitoring snapshot */
export async function GET() {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const started = Date.now();
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const [
    users,
    orders,
    pendingPayments,
    openTickets,
    newLeads,
    providers,
    webhooks,
    backups,
    auditRecent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.payment.count({
      where: { status: { in: ["PENDING", "AWAITING_VERIFICATION"] } },
    }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.crmLead.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),
    prisma.provider.findMany({
      select: { id: true, name: true, status: true, priority: true },
      take: 20,
    }),
    prisma.webhookEndpoint.count({ where: { active: true } }),
    prisma.backupRecord.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  await ensureDefaultSettings();
  const maintenance = await getSettingBool("maintenance.enabled");
  const smtpConfigured = Boolean(
    process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST
  );

  return NextResponse.json({
    health: {
      status: dbOk ? "healthy" : "degraded",
      db: dbOk ? "up" : "down",
      latencyMs: Date.now() - started,
      maintenance,
      smtpConfigured,
      paymentGatewayEnv: process.env.PAYMENT_GATEWAY_ENABLED === "true",
      uptimeHint: "process",
    },
    counts: {
      users,
      orders,
      pendingPayments,
      openTickets,
      newLeads7d: newLeads,
      activeWebhooks: webhooks,
    },
    providers,
    backups,
    recentAudit: auditRecent,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  if (body.action === "backup") {
    const record = await prisma.backupRecord.create({
      data: {
        label: body.label || `Manual backup ${new Date().toISOString().slice(0, 16)}`,
        type: "MANUAL",
        status: "COMPLETED",
        location: "local://ready",
        notes: "Metadata backup recorded. Wire pg_dump / S3 in Part 07.",
        createdById: auth.user.id,
        completedAt: new Date(),
        sizeBytes: 0,
      },
    });

    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "BACKUP",
      entityType: "BackupRecord",
      entityId: record.id,
      summary: `Backup recorded: ${record.label}`,
    });

    return NextResponse.json({ backup: record }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
