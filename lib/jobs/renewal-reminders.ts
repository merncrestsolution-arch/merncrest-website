import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { flushEmailOutbox } from "@/lib/notify/client-email";
import { formatSriLankaDate, SL_TIMEZONE } from "@/lib/timezone";

const EVENT_TYPE = "RENEWAL_REMINDER";

function toDateKeyInSl(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: SL_TIMEZONE });
}

function daysUntilRenewalInSl(today: Date, renewalDate: Date): number {
  const todayKey = toDateKeyInSl(today);
  const renewalKey = toDateKeyInSl(renewalDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(renewalKey) - Date.parse(todayKey)) / msPerDay);
}

function formatServiceLabel(serviceType: string, metadata: unknown): string {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const record = metadata as Record<string, unknown>;
    if (typeof record.label === "string" && record.label.trim()) {
      return record.label.trim();
    }
    if (typeof record.name === "string" && record.name.trim()) {
      return record.name.trim();
    }
    if (typeof record.domainName === "string" && record.domainName.trim()) {
      return record.domainName.trim();
    }
  }
  return serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildRenewalReminderHtml(opts: {
  clientName: string;
  projectName: string;
  serviceLabel: string;
  renewalDateLabel: string;
  daysBefore: number;
}) {
  const footer = "Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk";
  return `
    <div style="font-family:'Segoe UI',system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h1 style="color:#7c3aed;font-size:20px;margin:0 0 16px">Service renewal reminder</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Hi <strong>${escapeHtml(opts.clientName)}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">
        Your <strong>${escapeHtml(opts.serviceLabel)}</strong> service under project
        <strong>${escapeHtml(opts.projectName)}</strong> is due for renewal in
        <strong>${opts.daysBefore}</strong> day${opts.daysBefore === 1 ? "" : "s"} on
        <strong>${escapeHtml(opts.renewalDateLabel)}</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569">
        Please review your portal or contact MernCrest to arrange renewal and avoid interruption.
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8">${footer}</p>
    </div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function alreadyQueuedToday(
  serviceId: string,
  daysBefore: number,
  dateKey: string
): Promise<boolean> {
  const existing = await prisma.emailOutbox.findFirst({
    where: {
      eventType: EVENT_TYPE,
      status: { in: ["PENDING", "SENT"] },
      payloadJson: { contains: `"serviceId":"${serviceId}"` },
    },
    select: { id: true, payloadJson: true },
    orderBy: { createdAt: "desc" },
  });

  if (!existing?.payloadJson) return false;

  try {
    const payload = JSON.parse(existing.payloadJson) as {
      daysBefore?: number;
      dateKey?: string;
    };
    return payload.dateKey === dateKey && payload.daysBefore === daysBefore;
  } catch {
    return false;
  }
}

export async function processRenewalReminders(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
}> {
  const today = new Date();
  const todayKey = toDateKeyInSl(today);
  const organizationId = await getPrimaryOrganizationId().catch(() => null);

  const services = await prisma.projectService.findMany({
    where: {
      deletedAt: null,
      renewalDate: { not: null },
      status: "ACTIVE",
      project: { deletedAt: null },
    },
    include: {
      project: {
        select: {
          name: true,
          client: {
            select: { email: true, fullName: true },
          },
        },
      },
    },
  });

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  for (const service of services) {
    processed += 1;

    if (!service.renewalDate) {
      skipped += 1;
      continue;
    }

    const schedule = service.reminderScheduleDays.length
      ? service.reminderScheduleDays
      : [3];
    const daysUntil = daysUntilRenewalInSl(today, service.renewalDate);

    if (!schedule.includes(daysUntil)) {
      skipped += 1;
      continue;
    }

    const clientEmail = service.project.client.email?.trim();
    if (!clientEmail) {
      skipped += 1;
      continue;
    }

    if (await alreadyQueuedToday(service.id, daysUntil, todayKey)) {
      skipped += 1;
      continue;
    }

    const serviceLabel = formatServiceLabel(service.serviceType, service.metadata);
    const renewalDateLabel = formatSriLankaDate(service.renewalDate);
    const clientName = service.project.client.fullName.trim() || "there";
    const subject = `Renewal reminder — ${serviceLabel} (${daysUntil} day${daysUntil === 1 ? "" : "s"})`;
    const bodyHtml = buildRenewalReminderHtml({
      clientName,
      projectName: service.project.name,
      serviceLabel,
      renewalDateLabel,
      daysBefore: daysUntil,
    });
    const bodyText = [
      `Hi ${clientName},`,
      "",
      `Your ${serviceLabel} service under project ${service.project.name} renews in ${daysUntil} day(s) on ${renewalDateLabel}.`,
      "",
      "Please contact MernCrest or visit your portal to arrange renewal.",
    ].join("\n");

    const row = await prisma.emailOutbox.create({
      data: {
        organizationId,
        eventType: EVENT_TYPE,
        toEmail: clientEmail,
        subject,
        bodyHtml,
        bodyText,
        status: "PENDING",
        payloadJson: JSON.stringify({
          serviceId: service.id,
          projectId: service.projectId,
          daysBefore: daysUntil,
          renewalDate: service.renewalDate.toISOString(),
          dateKey: todayKey,
        }),
      },
    });

    await flushEmailOutbox(row.id);
    sent += 1;
  }

  return { processed, sent, skipped };
}
