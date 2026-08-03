import { prisma } from "@/lib/db";
import { ensureLeadFromChannel } from "@/lib/crm/channels";

/** Register or update CRM lead for a live-chat visitor — never duplicates by email/phone. */
export async function linkChatVisitorToCrm(opts: {
  sessionId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  interest?: string | null;
  userId?: string | null;
  activityBody?: string;
}) {
  const lead = await ensureLeadFromChannel({
    channel: "LIVE_CHAT",
    fullName: opts.fullName,
    email: opts.email,
    phone: opts.phone,
    interest: opts.interest || "Live chat",
    activityType: "CHAT",
    activityBody:
      opts.activityBody ||
      `Live chat · ${opts.interest || "General inquiry"}`,
    channelRef: opts.sessionId,
    userId: opts.userId,
    skipWhatsAppAutoReply: true,
  });

  await prisma.chatSession.update({
    where: { id: opts.sessionId },
    data: { leadId: lead.id },
  });

  return lead;
}
