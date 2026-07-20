import { prisma } from "@/lib/db";
import { searchDomainAvailability } from "@/lib/domains/registry";
import { formatMoney } from "@/lib/commerce-format";
import { nextNumber } from "@/lib/commerce";
import { aiReply } from "@/lib/support/ai-replies";
import { notifyUser } from "@/lib/support/notify";

export function detectLanguage(text: string): "en" | "ta" | "si" {
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0D80-\u0DFF]/.test(text)) return "si";
  // Tanglish / Singlish hints
  const lower = text.toLowerCase();
  if (/\b(vanakkam|epdi|enna|iruku|pannunga)\b/.test(lower)) return "ta";
  if (/\b(ayubowan|kohomada|karanna|onna)\b/.test(lower)) return "si";
  return "en";
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").replace(/^0/, "94");
}

export async function findCustomerByWhatsApp(phone: string) {
  const digits = normalizePhone(phone);
  const variants = [phone, digits, `+${digits}`, `0${digits.slice(2)}`];

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
          invoices: { where: { status: { in: ["SENT", "OVERDUE"] } }, take: 5, orderBy: { createdAt: "desc" } },
          orders: { take: 5, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!profile) return null;
  return { ...profile.user, profile };
}

const MENU = `MernCrest WhatsApp Menu
1. Search Domain
2. Hosting Plans
3. VPS / AWS
4. Business Email
5. Website / ERP / CRM
6. Request Quotation
7. View Orders
8. View Invoices
9. Support / Ticket
0. Speak to Human Agent

Reply with a number or type naturally (EN / TA / SI).`;

export type WhatsAppHandleResult = {
  reply: string;
  ticketNumber?: string | null;
  leadId?: string | null;
  locale: string;
};

export async function handleWhatsAppMessage(
  phone: string,
  text: string,
  localeHint?: string
): Promise<WhatsAppHandleResult> {
  const locale = localeHint || detectLanguage(text);
  const q = text.trim();
  const lower = q.toLowerCase();
  const user = await findCustomerByWhatsApp(phone);

  // Menu
  if (/^(menu|hi|hello|hey|start|0)$/i.test(q) || lower === "help") {
    if (user) {
      const code = user.profile?.customerCode || user.id.slice(0, 8);
      const welcome = `Welcome back, ${user.fullName}.

Customer ID: ${code}
You currently have:
• ${user.domains.length} Domains
• ${user.hostingAccounts.length} Hosting / VPS
• ${user.tickets.length} Open Support Ticket(s)

${MENU}`;
      return { reply: welcome, locale };
    }
    return { reply: `Welcome to MernCrest Solutions.\n\n${MENU}`, locale };
  }

  // Domain search
  const domainMatch =
    lower.match(/(?:search\s+domain|domain)\s+([a-z0-9.-]+\.[a-z.]{2,})/i) ||
    lower.match(/^1\s+([a-z0-9.-]+\.[a-z.]{2,})/i) ||
    (lower.startsWith("search ") ? lower.match(/search\s+([a-z0-9.-]+\.[a-z.]{2,})/i) : null);

  if (domainMatch || lower === "1" || lower.includes("search domain")) {
    if (!domainMatch) {
      return { reply: "Send: Search domain example.lk", locale };
    }
    const result = searchDomainAvailability(domainMatch[1]);
    if (result.error) return { reply: result.error, locale };
    const lines = result.results.slice(0, 6).map((r) => {
      if (!r.available) return `❌ ${r.domain} — Unavailable`;
      return `✅ ${r.domain} — ${formatMoney(r.priceCents)}/yr — Register at merncrest.lk/domains`;
    });
    return {
      reply: `Domain search for "${result.sld}":\n\n${lines.join("\n")}\n\nReply Buy ${result.sld}.lk to continue on the website cart.`,
      locale,
    };
  }

  // Hosting
  if (lower === "2" || /hosting|i need hosting|web hosting/.test(lower)) {
    return {
      reply: `Hosting is resold via our provider partners (not MernCrest-owned servers).

Popular plans (LKR/mo selling price):
• Shared Starter — from Rs. 9,900
• Business — from Rs. 29,900
• WordPress — from Rs. 24,900
• Cloud / VPS — from Rs. 49,900

Describe your project (site type, visitors, storage, budget) at merncrest.lk/hosting for an AI recommendation, or reply here.`,
      locale,
    };
  }

  if (lower === "3" || /\bvps\b|aws|dedicated/.test(lower)) {
    return {
      reply: `VPS / Cloud:
• Linux VPS Basic — 2 vCPU / 4GB
• Windows VPS
• AWS Managed Hosting

Reply with OS preference + RAM need, or open merncrest.lk/hosting`,
      locale,
    };
  }

  // Website / software → lead
  if (
    lower === "5" ||
    /business website|need a website|erp|software development|i need crm/.test(lower)
  ) {
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
    };
  }

  // Quotation request
  if (lower === "6" || /quotation|quote|proposal/.test(lower)) {
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
      reply: `Quotation request logged. Sales will prepare a quote.\nLead ref: ${lead.id.slice(-6).toUpperCase()}`,
      leadId: lead.id,
      locale,
    };
  }

  // Orders
  if (lower === "7" || /where is my order|my orders|order status|track order/.test(lower)) {
    if (!user) {
      return { reply: "Link your WhatsApp number in Portal → Settings to see orders here.", locale };
    }
    if (user.orders.length === 0) {
      return { reply: "No recent orders found.", locale };
    }
    const lines = user.orders.map(
      (o) => `• ${o.orderNumber} — ${o.status} — ${formatMoney(o.totalCents)}`
    );
    return { reply: `Your recent orders:\n${lines.join("\n")}`, locale };
  }

  // Invoices
  if (lower === "8" || /show my invoices|my invoices|pay invoice|invoice/.test(lower)) {
    if (!user) {
      return { reply: "Link your WhatsApp in Portal → Settings to view invoices.", locale };
    }
    if (user.invoices.length === 0) {
      return { reply: "No open invoices. View history at merncrest.lk/portal/invoices", locale };
    }
    const lines = user.invoices.map(
      (inv) =>
        `• ${inv.invoiceNumber} — ${formatMoney(inv.totalCents)} — ${inv.status}` +
        (inv.dueAt ? ` — due ${inv.dueAt.toLocaleDateString()}` : "")
    );
    return {
      reply: `Open invoices:\n${lines.join("\n")}\n\nPay online: merncrest.lk/portal/invoices`,
      locale,
    };
  }

  // Support ticket
  if (
    lower === "9" ||
    /website is down|my site is down|create ticket|support ticket|need help/.test(lower) ||
    (/down|not working|urgent/.test(lower) && /site|website|hosting|server/.test(lower))
  ) {
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
    };
  }

  // Human agent
  if (lower === "0" || /speak to (human|agent)|talk to (human|agent)|operator/.test(lower)) {
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
    };
  }

  // Fallback KB AI
  let reply = aiReply(q, locale);
  if (user?.profile?.customerCode) {
    reply = `[${user.profile.customerCode}] ${reply}`;
  }
  return { reply, locale };
}
