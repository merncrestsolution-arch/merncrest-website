import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { computeLeadScore } from "@/lib/crm/stages";

/**
 * CRM + portal activity integration.
 * Every customer-facing event should land in CRM and the portal activity feed.
 */

export async function logCustomerActivity(opts: {
  userId: string;
  category: string;
  title: string;
  body?: string;
  href?: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.customerActivity.create({
    data: {
      userId: opts.userId,
      category: opts.category,
      title: opts.title,
      body: opts.body,
      href: opts.href,
      metaJson: opts.meta ? JSON.stringify(opts.meta) : null,
    },
  });
}

/** Upsert a CRM lead for a customer and append an activity note */
export async function syncCrmFromCustomerEvent(opts: {
  userId: string;
  email: string;
  fullName: string;
  company?: string | null;
  phone?: string | null;
  source: string;
  interest?: string;
  activityBody: string;
  valueCents?: number;
  activityType?: string;
}) {
  let lead = await prisma.crmLead.findFirst({
    where: { email: opts.email.toLowerCase() },
    orderBy: { updatedAt: "desc" },
  });

  const score = computeLeadScore({
    phone: opts.phone,
    company: opts.company,
    interest: opts.interest,
    valueCents: opts.valueCents,
  });

  if (!lead) {
    lead = await prisma.crmLead.create({
      data: {
        leadNumber: nextNumber("LEAD"),
        stage: "NEW",
        source: opts.source,
        fullName: opts.fullName,
        email: opts.email.toLowerCase(),
        phone: opts.phone || null,
        company: opts.company || null,
        interest: opts.interest || null,
        valueCents: opts.valueCents || 0,
        leadScore: score,
        notes: `Linked customer userId=${opts.userId}`,
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
        valueCents: opts.valueCents
          ? Math.max(lead.valueCents, opts.valueCents)
          : lead.valueCents,
        leadScore: Math.max(lead.leadScore, score),
        updatedAt: new Date(),
      },
    });
  }

  await prisma.crmActivity.create({
    data: {
      leadId: lead.id,
      userId: opts.userId,
      type: opts.activityType || "STATUS",
      body: opts.activityBody,
    },
  });

  return lead;
}

export async function onCustomerRegistered(opts: {
  userId: string;
  email: string;
  fullName: string;
  company?: string | null;
  phone?: string | null;
}) {
  await logCustomerActivity({
    userId: opts.userId,
    category: "PROFILE",
    title: "Account created",
    body: "Welcome to MernCrest Customer Portal",
    href: "/portal",
  });

  await syncCrmFromCustomerEvent({
    userId: opts.userId,
    email: opts.email,
    fullName: opts.fullName,
    company: opts.company,
    phone: opts.phone,
    source: "WEBSITE_REGISTER",
    interest: "New customer account",
    activityBody: `Customer registered: ${opts.fullName} <${opts.email}>`,
  });
}

export async function onCustomerOrderCreated(opts: {
  userId: string;
  email: string;
  fullName: string;
  company?: string | null;
  orderNumber: string;
  totalCents: number;
  itemSummary: string;
}) {
  await logCustomerActivity({
    userId: opts.userId,
    category: "ORDER",
    title: `Order ${opts.orderNumber} placed`,
    body: opts.itemSummary,
    href: "/portal/orders",
    meta: { orderNumber: opts.orderNumber, totalCents: opts.totalCents },
  });

  await syncCrmFromCustomerEvent({
    userId: opts.userId,
    email: opts.email,
    fullName: opts.fullName,
    company: opts.company,
    source: "MARKETPLACE",
    interest: "Marketplace order",
    activityBody: `Order ${opts.orderNumber} · ${opts.itemSummary} · ${opts.totalCents} cents`,
    valueCents: opts.totalCents,
  });
}

export async function onCustomerTicketCreated(opts: {
  userId: string;
  email: string;
  fullName: string;
  ticketNumber: string;
  subject: string;
  department: string;
}) {
  await logCustomerActivity({
    userId: opts.userId,
    category: "TICKET",
    title: `Ticket ${opts.ticketNumber}`,
    body: opts.subject,
    href: "/portal/tickets",
  });

  await syncCrmFromCustomerEvent({
    userId: opts.userId,
    email: opts.email,
    fullName: opts.fullName,
    source: "SUPPORT",
    interest: `Support · ${opts.department}`,
    activityBody: `Ticket ${opts.ticketNumber}: ${opts.subject}`,
  });
}

export async function onCustomerPaymentSubmitted(opts: {
  userId: string;
  invoiceNumber: string;
  method: string;
}) {
  await logCustomerActivity({
    userId: opts.userId,
    category: "PAYMENT",
    title: `Payment submitted for ${opts.invoiceNumber}`,
    body: `Method: ${opts.method} — awaiting admin verification`,
    href: "/portal/invoices",
  });
}
