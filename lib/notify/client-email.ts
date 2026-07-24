import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { sendMailRaw } from "@/lib/mail";

export type ClientEmailEvent =
  | "INVOICE_SENT"
  | "PAYMENT_RECEIVED"
  | "ORDER_CONFIRMED"
  | "TICKET_RESOLVED"
  | "PROJECT_UPDATE";

const DEFAULTS: Record<
  ClientEmailEvent,
  { subject: string; html: (v: Record<string, string>) => string }
> = {
  INVOICE_SENT: {
    subject: "Invoice {{invoiceNumber}} from MernCrest",
    html: (v) =>
      `<p>Hi ${v.name || "there"},</p><p>Invoice <strong>${v.invoiceNumber}</strong> for ${v.amount || ""} is ready.</p>`,
  },
  PAYMENT_RECEIVED: {
    subject: "Payment received — ${invoiceNumber}",
    html: (v) =>
      `<p>Hi ${v.name || "there"},</p><p>We received ${v.amount || ""} for invoice ${v.invoiceNumber || ""}.</p>`,
  },
  ORDER_CONFIRMED: {
    subject: "Order {{orderNumber}} confirmed",
    html: (v) =>
      `<p>Hi ${v.name || "there"},</p><p>Your order <strong>${v.orderNumber}</strong> is confirmed.</p>`,
  },
  TICKET_RESOLVED: {
    subject: "Ticket {{ticketNumber}} resolved",
    html: (v) =>
      `<p>Hi ${v.name || "there"},</p><p>Ticket <strong>${v.ticketNumber}</strong> has been resolved.</p>`,
  },
  PROJECT_UPDATE: {
    subject: "Project update — {{projectName}}",
    html: (v) =>
      `<p>Hi ${v.name || "there"},</p><p>Update on <strong>${v.projectName}</strong>: ${v.summary || ""}</p>`,
  },
};

function applyVars(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}|\$\{(\w+)\}/g, (_, a, b) => vars[a || b] || "");
}

/** Queue client email (DB outbox) — never blocks on SMTP in the request path. */
export async function notifyClient(
  event: ClientEmailEvent,
  payload: {
    toEmail: string;
    vars?: Record<string, string>;
    organizationId?: string;
    recordedById?: string;
  }
) {
  const organizationId =
    payload.organizationId || (await getPrimaryOrganizationId().catch(() => null));

  if (organizationId) {
    const setting = await prisma.emailNotifySetting.findUnique({
      where: {
        organizationId_eventType: { organizationId, eventType: event },
      },
    });
    if (setting && !setting.enabled) {
      return { queued: false, skipped: true };
    }
  }

  const def = DEFAULTS[event];
  const vars = payload.vars || {};
  const subject = applyVars(def.subject, vars);
  const bodyHtml = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#333">${applyVars(
    // use function result with vars already applied via template strings in defaults — rebuild simply:
    def.html(vars),
    vars
  )}</div>`;

  const row = await prisma.emailOutbox.create({
    data: {
      organizationId,
      eventType: event,
      toEmail: payload.toEmail,
      subject,
      bodyHtml,
      bodyText: subject,
      status: "PENDING",
      payloadJson: JSON.stringify(vars).slice(0, 4000),
      recordedById: payload.recordedById || null,
    },
  });

  // Fire-and-forget flush of this row
  void flushEmailOutbox(row.id);
  return { queued: true, id: row.id };
}

export async function flushEmailOutbox(id?: string) {
  const pending = await prisma.emailOutbox.findMany({
    where: id
      ? { id, status: "PENDING" }
      : { status: "PENDING", scheduledAt: { lte: new Date() } },
    take: id ? 1 : 20,
  });

  for (const job of pending) {
    try {
      await sendMailRaw({
        to: job.toEmail,
        subject: job.subject,
        html: job.bodyHtml,
        text: job.bodyText || job.subject,
      });
      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 } },
      });
    } catch (error) {
      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          lastError: error instanceof Error ? error.message.slice(0, 500) : "send failed",
        },
      });
    }
  }
}
