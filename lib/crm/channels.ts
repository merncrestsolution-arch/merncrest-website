import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { computeLeadScore } from "@/lib/crm/stages";

/**
 * Ensure every inbound channel conversation lands on one CRM lead.
 * Never creates duplicate leads for the same email/phone when possible.
 */
export async function ensureLeadFromChannel(opts: {
  channel: "WEBSITE" | "WHATSAPP" | "LIVE_CHAT" | "EMAIL" | "IVR" | "PHONE" | "FORM" | "PORTAL";
  fullName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  activityType: string;
  activityBody: string;
  channelRef?: string;
  userId?: string | null;
  /** When true, skip INQUIRY WA (caller sends its own auto-reply) */
  skipWhatsAppAutoReply?: boolean;
}) {
  const email = opts.email?.toLowerCase().trim() || null;
  const phone = opts.phone?.replace(/\D/g, "") || null;

  let lead =
    (email
      ? await prisma.crmLead.findFirst({
          where: { email },
          orderBy: { updatedAt: "desc" },
        })
      : null) ||
    (phone
      ? await prisma.crmLead.findFirst({
          where: { phone: { contains: phone.slice(-9) } },
          orderBy: { updatedAt: "desc" },
        })
      : null);

  const score = computeLeadScore({
    interest: opts.interest,
    phone: opts.phone,
    company: opts.company,
  });

  if (!lead) {
    lead = await prisma.crmLead.create({
      data: {
        leadNumber: nextNumber("LEAD"),
        stage: "NEW",
        source: opts.channel,
        fullName: opts.fullName || "Unknown",
        email: email || `${phone || "guest"}@channel.merncrest.lk`,
        phone: opts.phone || null,
        company: opts.company || null,
        interest: opts.interest || null,
        leadScore: score,
        notes: `Auto-created from ${opts.channel}`,
      },
    });
  } else {
    lead = await prisma.crmLead.update({
      where: { id: lead.id },
      data: {
        fullName: opts.fullName || lead.fullName,
        phone: opts.phone || lead.phone,
        company: opts.company || lead.company,
        interest: opts.interest || lead.interest,
        leadScore: Math.max(lead.leadScore, score),
        updatedAt: new Date(),
      },
    });
  }

  await prisma.crmActivity.create({
    data: {
      leadId: lead.id,
      userId: opts.userId || null,
      type: opts.activityType,
      body: opts.activityBody,
      channelRef: opts.channelRef,
    },
  });

  // Auto-link live chat sessions to existing customer accounts
  if (opts.channelRef && opts.channel === "LIVE_CHAT" && (email || phone)) {
    const { findCustomerUser } = await import("@/lib/chat/identify-customer");
    const match = await findCustomerUser({ email, phone });
    if (match) {
      await prisma.chatSession.updateMany({
        where: { id: opts.channelRef, userId: null },
        data: { userId: match.userId },
      });
    }
  }

  // Customer inquiry → WhatsApp auto-response (when phone known)
  if (
    !opts.skipWhatsAppAutoReply &&
    opts.phone &&
    (opts.channel === "WHATSAPP" || opts.channel === "FORM" || opts.channel === "WEBSITE")
  ) {
    const { runWhatsAppAutomation } = await import("@/lib/crm/whatsapp-notify");
    void runWhatsAppAutomation({
      trigger: "INQUIRY",
      phone: opts.phone,
      customerName: opts.fullName,
      vars: { name: opts.fullName || "there" },
      bodyFallback: `Hi ${opts.fullName || "there"}, thanks for contacting MernCrest. A specialist will reply shortly.`,
    });
  }

  return lead;
}
