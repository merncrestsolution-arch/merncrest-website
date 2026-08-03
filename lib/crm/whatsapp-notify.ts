import { prisma } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/support/whatsapp-gateway";
import {
  MERNcrest_WA_DISPLAY,
  normalizeWhatsAppPhone,
} from "@/lib/support/whatsapp-phone";

function fillTemplate(body: string, vars: Record<string, string>) {
  const merged = { businessNumber: MERNcrest_WA_DISPLAY, ...vars };
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => (merged as Record<string, string>)[key] ?? "");
}

async function resolvePhoneForUser(userId: string) {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { whatsapp: true, phone: true, notifyWhatsApp: true },
  });
  if (profile && profile.notifyWhatsApp === false) return null;
  const phone = profile?.whatsapp || profile?.phone;
  if (phone) return phone;
  const emp = await prisma.employee.findFirst({
    where: { userId },
    select: { phone: true, workPhone: true },
  });
  return emp?.phone || emp?.workPhone || null;
}

async function ensureConversation(phone: string, customerName?: string) {
  const normalized = normalizeWhatsAppPhone(phone) || phone.replace(/\D/g, "");
  return prisma.whatsAppConversation.upsert({
    where: { phone: normalized },
    create: {
      phone: normalized,
      customerName: customerName || null,
      status: "OPEN",
      lastMessageAt: new Date(),
    },
    update: {
      lastMessageAt: new Date(),
      ...(customerName ? { customerName } : {}),
    },
  });
}

/**
 * Fire WhatsApp automation by trigger key (System.merncrest.lk workflows).
 */
export async function runWhatsAppAutomation(opts: {
  trigger:
    | "INQUIRY"
    | "NEW_ORDER"
    | "PAYMENT_DUE"
    | "LEAVE_STATUS"
    | "TASK_ASSIGN"
    | "TICKET_UPDATE"
    | "ATTENDANCE"
    | "CUSTOM";
  phone?: string | null;
  userId?: string;
  customerName?: string;
  vars?: Record<string, string>;
  bodyFallback?: string;
}) {
  try {
    let phone = opts.phone || null;
    if (!phone && opts.userId) phone = await resolvePhoneForUser(opts.userId);
    if (!phone) return { ok: false, reason: "no_phone" as const };
    const normalized = normalizeWhatsAppPhone(phone) || phone.replace(/\D/g, "");

    const automation = await prisma.whatsAppAutomation.findFirst({
      where: { trigger: opts.trigger, active: true },
      orderBy: { updatedAt: "desc" },
    });

    let body =
      opts.bodyFallback ||
      (automation
        ? fillTemplate(automation.bodyTemplate, opts.vars || {})
        : null);

    let templateName: string | undefined;
    if (automation?.templateId) {
      const tpl = await prisma.whatsAppTemplate.findUnique({
        where: { id: automation.templateId },
      });
      if (tpl?.active) {
        templateName = tpl.providerKey || tpl.name;
        body = fillTemplate(tpl.body, opts.vars || {});
      }
    }

    if (!body) return { ok: false, reason: "no_body" as const };

    const conv = await ensureConversation(normalized, opts.customerName);
    const send = await sendWhatsAppMessage({
      phone: normalized,
      body,
      templateName,
    });

    await prisma.whatsAppMessage.create({
      data: {
        direction: "OUT",
        phone: normalized,
        body,
        status: send.ok ? "SENT" : "FAILED",
        templateName: templateName || null,
        conversationId: conv.id,
        metaJson: JSON.stringify({
          trigger: opts.trigger,
          send,
          from: "0713838638",
        }),
      },
    });

    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    return { ok: send.ok, send };
  } catch (error) {
    console.error("[wa:automation]", error);
    return { ok: false, reason: "error" as const, error };
  }
}

export async function notifyLeaveStatusWhatsApp(opts: {
  userId: string;
  status: string;
  leaveType: string;
}) {
  return runWhatsAppAutomation({
    trigger: "LEAVE_STATUS",
    userId: opts.userId,
    vars: { status: opts.status, leaveType: opts.leaveType },
    bodyFallback: `MernCrest Leave Update: Your ${opts.leaveType} leave was ${opts.status}. — System.merncrest.lk`,
  });
}

export async function notifyAttendanceWhatsApp(opts: {
  userId: string;
  action: "IN" | "OUT";
}) {
  return runWhatsAppAutomation({
    trigger: "ATTENDANCE",
    userId: opts.userId,
    vars: { action: opts.action },
    bodyFallback: `Attendance ${opts.action === "IN" ? "punch in" : "punch out"} recorded. — System.merncrest.lk`,
  });
}

export async function notifyOrderWhatsApp(opts: {
  userId: string;
  orderNumber: string;
  trackingUrl?: string;
  status?: string;
}) {
  const status = opts.status || "confirmed";
  return runWhatsAppAutomation({
    trigger: "NEW_ORDER",
    userId: opts.userId,
    vars: {
      orderNumber: opts.orderNumber,
      trackingUrl: opts.trackingUrl || "",
      status,
    },
    bodyFallback: `Order ${opts.orderNumber} ${status}.${
      opts.trackingUrl ? ` Track: ${opts.trackingUrl}` : ""
    } — MernCrest`,
  });
}

/** Delivery / provisioning complete notification */
export async function notifyDeliveryWhatsApp(opts: {
  userId: string;
  orderNumber: string;
  trackingUrl?: string;
}) {
  return notifyOrderWhatsApp({
    ...opts,
    status: "ready / delivered",
    trackingUrl: opts.trackingUrl || "/en/portal/services",
  });
}

export async function notifyPaymentDueWhatsApp(opts: {
  userId: string;
  invoiceNumber: string;
  amount: string;
}) {
  return runWhatsAppAutomation({
    trigger: "PAYMENT_DUE",
    userId: opts.userId,
    vars: { invoiceNumber: opts.invoiceNumber, amount: opts.amount },
    bodyFallback: `Payment reminder: Invoice ${opts.invoiceNumber} amount ${opts.amount} is due. Pay in portal. — MernCrest`,
  });
}

export async function notifyTicketWhatsApp(opts: {
  userId: string;
  ticketNumber: string;
  status: string;
}) {
  return runWhatsAppAutomation({
    trigger: "TICKET_UPDATE",
    userId: opts.userId,
    vars: { ticketNumber: opts.ticketNumber, status: opts.status },
    bodyFallback: `Support ticket ${opts.ticketNumber} is now ${opts.status}. — MernCrest`,
  });
}

export async function notifyTaskAssignWhatsApp(opts: {
  userId: string;
  taskTitle: string;
}) {
  return runWhatsAppAutomation({
    trigger: "TASK_ASSIGN",
    userId: opts.userId,
    vars: { taskTitle: opts.taskTitle },
    bodyFallback: `New task assigned: ${opts.taskTitle}. Open System.merncrest.lk — MernCrest`,
  });
}
