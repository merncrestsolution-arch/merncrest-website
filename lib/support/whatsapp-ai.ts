/**
 * NLU-first WhatsApp business assistant (EN/TA/SI).
 * Intent classification + entities → CRM / commerce / support handlers.
 */
import { prisma } from "@/lib/db";
import { searchDomainAvailability } from "@/lib/domains/registry";
import { formatMoney } from "@/lib/commerce-format";
import { nextNumber } from "@/lib/commerce";
import { aiReply } from "@/lib/support/ai-replies";
import { notifyUser } from "@/lib/support/notify";
import { classifyIntent, type NluIntent } from "@/lib/support/nlu";
import {
  MERNcrest_WA_DISPLAY,
  normalizeWhatsAppPhone,
  phoneMatchVariants,
} from "@/lib/support/whatsapp-phone";
import { PAGE_LINKS, siteUrl } from "@/lib/support/chat-knowledge";

export function detectLanguage(text: string): "en" | "ta" | "si" {
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0D80-\u0DFF]/.test(text)) return "si";
  const lower = text.toLowerCase();
  if (/\b(vanakkam|epdi|enna|iruku|pannunga)\b/.test(lower)) return "ta";
  if (/\b(ayubowan|kohomada|karanna|onna)\b/.test(lower)) return "si";
  return "en";
}

function normalizePhone(phone: string) {
  return normalizeWhatsAppPhone(phone);
}

export async function findCustomerByWhatsApp(phone: string) {
  const digits = normalizePhone(phone);
  const variants = phoneMatchVariants(phone);

  const profile = await prisma.customerProfile.findFirst({
    where: {
      OR: [
        { whatsapp: { in: variants } },
        { phone: { in: variants } },
      ],
    },
    include: {
      user: {
        include: {
          domains: true,
          hostingAccounts: true,
          tickets: { where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } },
          invoices: {
            where: { status: { in: ["SENT", "OVERDUE"] } },
            take: 5,
            orderBy: { createdAt: "desc" },
          },
          orders: { take: 5, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!profile) return null;
  return { ...profile.user, profile };
}

const MENU = `MernCrest WhatsApp (${MERNcrest_WA_DISPLAY})

1. Domains — search & register
2. Hosting plans
3. VPS / Cloud / AWS
4. Business email
5. Website / Mobile app
6. ERP / CRM / Enterprise software
7. AI & automation
8. Request quotation
9. My orders
10. Invoices & payments
11. Support / ticket
0. Speak to human agent

Reply with a number or type naturally (EN / TA / SI).
Services: ${siteUrl(PAGE_LINKS.services)}
Contact: ${siteUrl(PAGE_LINKS.contact)}`;

export type WhatsAppHandleResult = {
  reply: string;
  ticketNumber?: string | null;
  leadId?: string | null;
  locale: string;
  intent?: NluIntent;
  confidence?: number;
};

export async function handleWhatsAppMessage(
  phone: string,
  text: string,
  localeHint?: string
): Promise<WhatsAppHandleResult> {
  const nlu = classifyIntent(text);
  const locale = localeHint || nlu.locale || detectLanguage(text);
  const q = text.trim();
  const user = await findCustomerByWhatsApp(phone);
  const intent = nlu.intent;

  if (intent === "GREETING" || intent === "MENU") {
    if (user) {
      const code = user.profile?.customerCode || user.id.slice(0, 8);
      return {
        reply: `Welcome back, ${user.fullName}.

Customer ID: ${code}
You currently have:
• ${user.domains.length} Domains
• ${user.hostingAccounts.length} Hosting / VPS
• ${user.tickets.length} Open Support Ticket(s)

${MENU}`,
        locale,
        intent,
        confidence: nlu.confidence,
      };
    }
    return {
      reply: `Welcome to MernCrest Solutions.\n\n${MENU}`,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "DOMAIN_SEARCH") {
    const domainEntity = nlu.entities.find((e) => e.type === "domain");
    const domainMatch =
      domainEntity?.value ||
      q.match(/\b([a-z0-9][a-z0-9-]{0,61}\.[a-z.]{2,})\b/i)?.[1];
    if (!domainMatch) {
      return {
        reply: "Send: Search domain example.lk",
        locale,
        intent,
        confidence: nlu.confidence,
      };
    }
    const result = searchDomainAvailability(domainMatch);
    if (result.error) {
      return { reply: result.error, locale, intent, confidence: nlu.confidence };
    }
    const lines = result.results.slice(0, 6).map((r) => {
      if (!r.available) return `❌ ${r.domain} — Unavailable`;
      return `✅ ${r.domain} — ${formatMoney(r.priceCents)}/yr — Register at merncrest.lk/domains`;
    });
    return {
      reply: `Domain search for "${result.sld}":\n\n${lines.join("\n")}\n\nReply Buy ${result.sld}.lk to continue on the website cart.`,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "HOSTING") {
    return {
      reply: `Hosting is resold via our provider partners (not MernCrest-owned servers).

Popular plans (LKR/mo selling price):
• Shared Starter — from Rs. 9,900
• Business — from Rs. 29,900
• WordPress — from Rs. 24,900
• Cloud / VPS — from Rs. 49,900

Describe your project (site type, visitors, storage, budget) at merncrest.lk/hosting for an AI recommendation, or reply here.`,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "VPS") {
    return {
      reply: `VPS / Cloud:
• Linux VPS Basic — 2 vCPU / 4GB
• Windows VPS
• AWS Managed Hosting

Reply with OS preference + RAM need, or open merncrest.lk/hosting`,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "SOFTWARE") {
    const lead = await prisma.crmLead.create({
      data: {
        fullName: user?.fullName || `WhatsApp ${phone}`,
        email: user?.email || `${normalizePhone(phone)}@wa.merncrest.lk`,
        phone,
        company: user?.company || undefined,
        interest: q.slice(0, 200),
        source: "WHATSAPP",
        stage: "NEW",
        priority: "HIGH",
        activities: {
          create: { type: "WHATSAPP", body: `Inquiry: ${q}` },
        },
      },
    });
    return {
      reply: `Thanks! I've created sales lead ${lead.id.slice(-6).toUpperCase()}.

Please share:
• Business name
• Industry / modules needed
• Timeline
• Budget
• Preferred meeting date

Our sales team will follow up.`,
      leadId: lead.id,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "QUOTATION") {
    const lead = await prisma.crmLead.create({
      data: {
        fullName: user?.fullName || `WhatsApp ${phone}`,
        email: user?.email || `${normalizePhone(phone)}@wa.merncrest.lk`,
        phone,
        interest: "Quotation request",
        source: "WHATSAPP",
        stage: "QUOTATION",
        activities: { create: { type: "WHATSAPP", body: q } },
      },
    });
    return {
      reply: `Quotation request logged. Sales will prepare a PDF proposal.\nLead ref: ${lead.id.slice(-6).toUpperCase()}`,
      leadId: lead.id,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "ORDERS") {
    if (!user) {
      return {
        reply: "Link your WhatsApp number in Portal → Settings to see orders here.",
        locale,
        intent,
        confidence: nlu.confidence,
      };
    }
    if (user.orders.length === 0) {
      return { reply: "No recent orders found.", locale, intent, confidence: nlu.confidence };
    }
    const lines = user.orders.map(
      (o) => `• ${o.orderNumber} — ${o.status} — ${formatMoney(o.totalCents)}`
    );
    return {
      reply: `Your recent orders:\n${lines.join("\n")}`,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "INVOICES" || intent === "PAYMENT") {
    if (!user) {
      return {
        reply: "Link your WhatsApp in Portal → Settings to view invoices.",
        locale,
        intent,
        confidence: nlu.confidence,
      };
    }
    if (user.invoices.length === 0) {
      return {
        reply: "No open invoices. View history at merncrest.lk/portal/invoices",
        locale,
        intent,
        confidence: nlu.confidence,
      };
    }
    const lines = user.invoices.map(
      (inv) =>
        `• ${inv.invoiceNumber} — ${formatMoney(inv.totalCents)} — ${inv.status}` +
        (inv.dueAt ? ` — due ${inv.dueAt.toLocaleDateString()}` : "")
    );
    return {
      reply: `Open invoices:\n${lines.join("\n")}\n\nPay online: merncrest.lk/portal/invoices`,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "SUPPORT") {
    const lower = q.toLowerCase();
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber("TKT"),
        userId: user?.id,
        guestName: user?.fullName || `WhatsApp ${phone}`,
        guestEmail: user?.email,
        subject: q.slice(0, 120),
        department: /host|server|down|site/.test(lower) ? "HOSTING" : "TECHNICAL",
        priority: /down|urgent|outage/.test(lower) ? "URGENT" : "HIGH",
        channel: "WHATSAPP",
        status: "OPEN",
        messages: {
          create: {
            authorId: user?.id,
            authorName: user?.fullName || `WA ${phone}`,
            authorRole: "CUSTOMER",
            body: q,
          },
        },
      },
    });
    if (user) {
      await notifyUser({
        userId: user.id,
        title: `Ticket ${ticket.ticketNumber}`,
        body: "Opened via WhatsApp — our team is on it.",
        category: "SUPPORT",
        href: "/portal/tickets",
      });
    }
    return {
      reply: `Support ticket created: ${ticket.ticketNumber}\nPriority: ${ticket.priority}\nWe'll update you here and in the portal.`,
      ticketNumber: ticket.ticketNumber,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  if (intent === "HUMAN_AGENT") {
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber("TKT"),
        userId: user?.id,
        guestName: user?.fullName || `WhatsApp ${phone}`,
        guestEmail: user?.email,
        subject: "WhatsApp human handover",
        department: "GENERAL",
        priority: "HIGH",
        channel: "WHATSAPP",
        status: "OPEN",
        messages: {
          create: {
            authorName: user?.fullName || `WA ${phone}`,
            authorRole: "CUSTOMER",
            body: `Handover requested. Context: ${q}`,
          },
        },
      },
    });
    return {
      reply: `Connecting you to a human agent.\nTicket: ${ticket.ticketNumber}\nAn agent can see your profile, services, and this chat summary.`,
      ticketNumber: ticket.ticketNumber,
      locale,
      intent,
      confidence: nlu.confidence,
    };
  }

  // Business email menu digit / soft
  if (/^4$/.test(q) || /business email|microsoft 365|google workspace/.test(q.toLowerCase())) {
    return {
      reply: `Business Email (reseller):
• Microsoft 365
• Google Workspace
• Custom domain email

Open merncrest.lk/email or reply with seats + domain.`,
      locale,
      intent: "UNKNOWN",
      confidence: nlu.confidence,
    };
  }

  let reply = aiReply(q, locale);
  if (user?.profile?.customerCode) {
    reply = `[${user.profile.customerCode}] ${reply}`;
  }
  if (nlu.confidence > 0.15 && intent !== "UNKNOWN") {
    reply = `${reply}\n\n_(Understood as ${intent}, ${(nlu.confidence * 100).toFixed(0)}% — reply MENU for options)_`;
  }
  return { reply, locale, intent, confidence: nlu.confidence };
}
