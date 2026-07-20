import { prisma } from "@/lib/db";

/** Central audit logger — ERP / CRM / Finance / System */
export async function writeAuditLog(opts: {
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: opts.actorId || null,
        actorEmail: opts.actorEmail || null,
        actorName: opts.actorName || null,
        action: opts.action,
        module: opts.module,
        entityType: opts.entityType,
        entityId: opts.entityId,
        summary: opts.summary,
        metaJson: opts.meta ? JSON.stringify(opts.meta).slice(0, 4000) : null,
        ip: opts.ip || null,
      },
    });
  } catch (error) {
    console.error("[audit]", error);
    return null;
  }
}
