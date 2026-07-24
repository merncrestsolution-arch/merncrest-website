import { prisma } from "@/lib/db";
import { ensureLeadFromChannel } from "@/lib/crm/channels";
import { handleWhatsAppMessage } from "@/lib/support/whatsapp-ai";
import { sendWhatsAppRich } from "@/lib/support/whatsapp-rich";
import { applyInboundRouting } from "@/lib/support/whatsapp-gateway";
import { normalizeWhatsAppPhone, MERNcrest_WA_DISPLAY } from "@/lib/support/whatsapp-phone";
import { notifyUser } from "@/lib/support/notify";
import { classifyIntent } from "@/lib/support/nlu";

export const MERNcrest_WA_WELCOME = `Hello 👋

Thank you for contacting MernCrest Solutions.

We have received your message successfully.

Our team will respond shortly.

Meanwhile, you can tell us:
• Name
• Company
• Required Service

Thank you.
MernCrest Solutions
WhatsApp: ${MERNcrest_WA_DISPLAY}

Reply MENU for self-service options.`;

/**
 * Full Meta → CRM inbound pipeline:
 * message → lead → assign sales → auto-reply → conversation → follow-up → notify
 */
export async function processInboundWhatsApp(opts: {
  rawPhone: string;
  text: string;
  waId?: string | null;
  contactName?: string | null;
  locale?: string;
  metaBody?: unknown;
}) {
  const phone = normalizeWhatsAppPhone(opts.rawPhone) || opts.rawPhone.replace(/\D/g, "");
  const text = String(opts.text || "").trim();
  if (!phone || !text) {
    return { ok: false as const, reason: "missing_phone_or_text" };
  }

  const route = await applyInboundRouting({ source: "WHATSAPP" });
  const displayName =
    opts.contactName?.trim() || `WhatsApp ${phone.slice(-4)}`;

  const conv = await prisma.whatsAppConversation.upsert({
    where: { phone },
    create: {
      phone,
      customerName: displayName,
      status: "OPEN",
      lastMessageAt: new Date(),
      unreadCount: 1,
      assigneeId: route.assigneeId,
    },
    update: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      status: "OPEN",
      ...(opts.contactName ? { customerName: opts.contactName } : {}),
      ...(route.assigneeId ? { assigneeId: route.assigneeId } : {}),
    },
  });

  const priorCount = await prisma.whatsAppMessage.count({
    where: { conversationId: conv.id, direction: "IN" },
  });
  const isFirstMessage = priorCount === 0;

  const inbound = await prisma.whatsAppMessage.create({
    data: {
      direction: "IN",
      phone,
      body: text,
      status: "RECEIVED",
      waId: opts.waId || null,
      conversationId: conv.id,
      metaJson: opts.metaBody
        ? JSON.stringify(opts.metaBody).slice(0, 4000)
        : null,
    },
  });

  // CRM lead (no duplicate inquiry WA — we send one auto-reply below)
  const lead = await ensureLeadFromChannel({
    channel: "WHATSAPP",
    fullName: displayName,
    phone,
    interest: text.slice(0, 200),
    activityType: "WHATSAPP",
    activityBody: `IN: ${text.slice(0, 240)} → dept ${route.department}`,
    channelRef: inbound.id,
    skipWhatsAppAutoReply: true,
  });

  // Assign sales person if lead has no owner
  let ownerId = lead.ownerId || route.assigneeId || conv.assigneeId || null;
  if (!ownerId) {
    const sales = await prisma.user.findFirst({
      where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    ownerId = sales?.id || null;
  }
  if (ownerId && lead.ownerId !== ownerId) {
    await prisma.crmLead.update({
      where: { id: lead.id },
      data: {
        ownerId,
        stage: lead.stage === "NEW" ? "ASSIGNED" : lead.stage,
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { assigneeId: ownerId, status: "ASSIGNED" },
    });
  }

  // Follow-up reminder (+4 hours)
  const dueAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const existingFu = await prisma.crmFollowUp.findFirst({
    where: {
      leadId: lead.id,
      status: "PENDING",
      type: "WHATSAPP",
    },
  });
  if (!existingFu) {
    await prisma.crmFollowUp.create({
      data: {
        leadId: lead.id,
        title: `WhatsApp follow-up · ${phone.slice(-4)}`,
        type: "WHATSAPP",
        dueAt,
        assigneeId: ownerId,
        status: "PENDING",
        notes: text.slice(0, 400),
      },
    });
  }

  // Notify sales
  if (ownerId) {
    void notifyUser({
      userId: ownerId,
      title: `WhatsApp lead ${lead.leadNumber || lead.id.slice(-6)}`,
      body: `${displayName} (${phone}): ${text.slice(0, 120)}`,
      category: "SYSTEM",
      href: "/admin/crm",
    });
  }

  // Auto-reply: welcome on first / greeting; else NLU
  const nlu = classifyIntent(text);
  let reply: string;
  let intent = nlu.intent;
  let confidence = nlu.confidence;
  let ticketNumber: string | null = null;
  let leadIdFromHandler: string | null = lead.id;

  if (isFirstMessage || nlu.intent === "GREETING" || nlu.intent === "MENU") {
    if (nlu.intent === "MENU" || (!isFirstMessage && nlu.intent === "GREETING")) {
      const handled = await handleWhatsAppMessage(phone, text, opts.locale);
      reply = handled.reply;
      intent = handled.intent || intent;
      confidence = handled.confidence ?? confidence;
      ticketNumber = handled.ticketNumber ?? null;
      leadIdFromHandler = handled.leadId || lead.id;
    } else {
      reply = MERNcrest_WA_WELCOME;
    }
  } else {
    const handled = await handleWhatsAppMessage(phone, text, opts.locale);
    reply = handled.reply;
    intent = handled.intent || intent;
    confidence = handled.confidence ?? confidence;
    ticketNumber = handled.ticketNumber ?? null;
    leadIdFromHandler = handled.leadId || lead.id;
  }

  const sent = await sendWhatsAppRich({
    phone,
    body: reply,
    conversationId: conv.id,
  });

  await prisma.crmActivity.create({
    data: {
      leadId: lead.id,
      userId: ownerId,
      type: "WHATSAPP",
      body: `OUT auto-reply (${intent}): ${reply.slice(0, 200)}`,
      channelRef: sent.message?.id,
    },
  });

  return {
    ok: true as const,
    inboundId: inbound.id,
    conversationId: conv.id,
    leadId: leadIdFromHandler,
    leadNumber: lead.leadNumber,
    ownerId,
    reply,
    ticketNumber,
    intent,
    confidence,
    locale: opts.locale || nlu.locale,
    routing: route,
    delivery: { ok: sent.ok, provider: sent.provider },
    isFirstMessage,
  };
}

/** Apply Meta message_template_status_update webhook */
export async function applyTemplateStatusUpdate(event: {
  message_template_name?: string;
  message_template_id?: string;
  event?: string;
  reason?: string;
}) {
  const name = event.message_template_name;
  if (!name) return { ok: false };
  const map: Record<string, string> = {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    PENDING: "PENDING",
    PAUSED: "PENDING",
    DISABLED: "REJECTED",
    FLAGGED: "PENDING",
  };
  const status = map[String(event.event || "").toUpperCase()] || "PENDING";
  await prisma.whatsAppTemplate.upsert({
    where: { name },
    create: {
      name,
      providerKey: event.message_template_id || name,
      body: `[Meta template ${name}]`,
      status,
      active: status === "APPROVED",
      category: "UTILITY",
      locale: "EN",
    },
    update: {
      status,
      active: status === "APPROVED",
      providerKey: event.message_template_id || name,
    },
  });
  return { ok: true, name, status };
}
