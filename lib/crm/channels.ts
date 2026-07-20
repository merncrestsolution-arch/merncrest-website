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

  return lead;
}
