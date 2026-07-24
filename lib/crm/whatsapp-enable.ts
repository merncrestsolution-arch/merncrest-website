import { prisma } from "@/lib/db";
import {
  MERNcrest_WA_DISPLAY,
  MERNcrest_WA_E164,
  MERNcrest_WA_INTERNATIONAL,
} from "@/lib/support/whatsapp-phone";
import { ensureDefaultPaymentDripSequence } from "@/lib/crm/payment-drip";

const TEMPLATES = [
  {
    name: "inquiry_auto_reply",
    body: `Hello 👋

Thank you for contacting MernCrest Solutions.

We have received your message successfully.

Our team will respond shortly.

Meanwhile, you can tell us:
• Name
• Company
• Required Service

Thank you.
MernCrest Solutions
WhatsApp: {{businessNumber}}

Reply MENU for self-service options.`,
    category: "UTILITY",
  },
  {
    name: "order_confirmed",
    body: "Order {{orderNumber}} confirmed. Track: {{trackingUrl}} — MernCrest {{businessNumber}}",
    category: "UTILITY",
  },
  {
    name: "payment_reminder",
    body: "Reminder: Invoice {{invoiceNumber}} amount {{amount}} is due. Pay in your portal or WhatsApp us on {{businessNumber}}.",
    category: "UTILITY",
  },
  {
    name: "payment_due_d0",
    body: "Hi {{name}}, invoice {{invoiceNumber}} for {{amount}} is due. Pay at merncrest.lk/portal/invoices",
    category: "UTILITY",
  },
  {
    name: "payment_due_d3",
    body: "Reminder: {{invoiceNumber}} ({{amount}}) is still unpaid. Reply PAY or open the portal.",
    category: "UTILITY",
  },
  {
    name: "payment_due_d7",
    body: "Final notice: {{invoiceNumber}} overdue. Please settle {{amount}} today.",
    category: "UTILITY",
  },
  {
    name: "leave_status",
    body: "Your {{leaveType}} leave was {{status}}. — System.merncrest.lk",
    category: "UTILITY",
  },
  {
    name: "ticket_update",
    body: "Support ticket {{ticketNumber}} is now {{status}}. WhatsApp: {{businessNumber}}",
    category: "UTILITY",
  },
  {
    name: "task_assign",
    body: "New task: {{taskTitle}} — open System.merncrest.lk",
    category: "UTILITY",
  },
  {
    name: "attendance_punch",
    body: "Attendance {{action}} recorded. — System.merncrest.lk",
    category: "UTILITY",
  },
  {
    name: "welcome_menu",
    body: "Welcome to MernCrest Solutions. Reply MENU or 1–9. Business WhatsApp: {{businessNumber}}",
    category: "MARKETING",
  },
];

const AUTOMATIONS = [
  {
    name: "Inquiry auto-response",
    trigger: "INQUIRY",
    bodyTemplate: `Hi {{name}}, thanks for contacting MernCrest WhatsApp (${MERNcrest_WA_DISPLAY}). We received your inquiry — reply MENU anytime.`,
  },
  {
    name: "New order notify",
    trigger: "NEW_ORDER",
    bodyTemplate: `Order {{orderNumber}} confirmed. {{trackingUrl}} — MernCrest ${MERNcrest_WA_DISPLAY}`,
  },
  {
    name: "Payment due sequence",
    trigger: "PAYMENT_DUE",
    bodyTemplate: `Payment reminder: Invoice {{invoiceNumber}} · {{amount}} due. Pay portal or WhatsApp ${MERNcrest_WA_DISPLAY}`,
  },
  {
    name: "Leave status notify",
    trigger: "LEAVE_STATUS",
    bodyTemplate: "Leave update: {{leaveType}} → {{status}}",
  },
  {
    name: "Task assignment alert",
    trigger: "TASK_ASSIGN",
    bodyTemplate: "New task: {{taskTitle}} — open System.merncrest.lk",
  },
  {
    name: "Ticket update",
    trigger: "TICKET_UPDATE",
    bodyTemplate: `Ticket {{ticketNumber}} is now {{status}}. Help: ${MERNcrest_WA_DISPLAY}`,
  },
  {
    name: "Attendance punch",
    trigger: "ATTENDANCE",
    bodyTemplate: "Attendance {{action}} recorded.",
  },
];

/**
 * Activate business WhatsApp 0713838638 + all automations + payment drips.
 * Safe to call repeatedly (idempotent).
 */
export async function enableFullWhatsAppAutomation() {
  const config = {
    provider: process.env.WHATSAPP_TOKEN ? "meta" : "stub",
    businessNumber: MERNcrest_WA_DISPLAY,
    businessNumberE164: MERNcrest_WA_E164,
    fromNumber: MERNcrest_WA_INTERNATIONAL,
    phoneNumberId:
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      process.env.WHATSAPP_PHONE_ID ||
      "",
    wabaId: process.env.WHATSAPP_WABA_ID || "",
    displayName: "MernCrest Solutions",
    fullAutomation: true,
    autoReply: true,
    paymentDrips: true,
    nluChatbot: true,
  };

  const gateway = await prisma.systemGatewayConfig.upsert({
    where: { provider: "WHATSAPP" },
    create: {
      provider: "WHATSAPP",
      active: true,
      configJson: JSON.stringify(config),
    },
    update: {
      active: true,
      configJson: JSON.stringify(config),
    },
  });

  for (const t of TEMPLATES) {
    const body = t.body.replace(/\{\{businessNumber\}\}/g, MERNcrest_WA_DISPLAY);
    await prisma.whatsAppTemplate.upsert({
      where: { name: t.name },
      create: {
        name: t.name,
        body,
        category: t.category,
        status: "LOCAL",
        active: true,
        locale: "EN",
        providerKey: t.name,
      },
      update: { body, active: true, category: t.category },
    });
  }

  for (const a of AUTOMATIONS) {
    const existing = await prisma.whatsAppAutomation.findFirst({
      where: { trigger: a.trigger },
    });
    if (existing) {
      await prisma.whatsAppAutomation.update({
        where: { id: existing.id },
        data: {
          name: a.name,
          bodyTemplate: a.bodyTemplate,
          active: true,
        },
      });
    } else {
      await prisma.whatsAppAutomation.create({
        data: { ...a, active: true },
      });
    }
  }

  // Ensure every automation row is active
  await prisma.whatsAppAutomation.updateMany({ data: { active: true } });

  const drip = await ensureDefaultPaymentDripSequence();
  await prisma.paymentDripSequence.update({
    where: { id: drip.id },
    data: { active: true },
  });

  // Business inbox conversation placeholder
  await prisma.whatsAppConversation.upsert({
    where: { phone: MERNcrest_WA_E164 },
    create: {
      phone: MERNcrest_WA_E164,
      customerName: "MernCrest Business Line",
      status: "OPEN",
      lastMessageAt: new Date(),
    },
    update: {
      customerName: "MernCrest Business Line",
      lastMessageAt: new Date(),
    },
  });

  const [templates, automations] = await Promise.all([
    prisma.whatsAppTemplate.count({ where: { active: true } }),
    prisma.whatsAppAutomation.count({ where: { active: true } }),
  ]);

  return {
    ok: true,
    businessNumber: MERNcrest_WA_DISPLAY,
    businessNumberE164: MERNcrest_WA_E164,
    clickToChat: `https://wa.me/${MERNcrest_WA_E164}`,
    gatewayId: gateway.id,
    provider: config.provider,
    metaReady: Boolean(process.env.WHATSAPP_TOKEN && config.phoneNumberId),
    templates,
    automations,
    dripSequenceId: drip.id,
  };
}

export async function getWhatsAppBusinessConfig() {
  const gw = await prisma.systemGatewayConfig.findUnique({
    where: { provider: "WHATSAPP" },
  });
  let config: Record<string, string | boolean> = {};
  try {
    config = gw?.configJson ? JSON.parse(gw.configJson) : {};
  } catch {
    config = {};
  }
  return {
    active: gw?.active ?? false,
    businessNumber: String(config.businessNumber || MERNcrest_WA_DISPLAY),
    businessNumberE164: String(config.businessNumberE164 || MERNcrest_WA_E164),
    fromNumber: String(config.fromNumber || MERNcrest_WA_INTERNATIONAL),
    fullAutomation: Boolean(config.fullAutomation),
    provider: String(config.provider || "stub"),
    clickToChat: `https://wa.me/${config.businessNumberE164 || MERNcrest_WA_E164}`,
  };
}
