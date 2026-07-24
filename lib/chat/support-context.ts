import { prisma } from "@/lib/db";
import {
  autoLinkSessionCustomer,
  identifyCustomerFromSession,
  type IdentifyResult,
} from "@/lib/chat/identify-customer";
import {
  detectServiceCategories,
  diagnoseFromMessage,
  type DiagnosticIssue,
} from "@/lib/chat/issue-diagnostics";
import { getCustomerSupportSnapshot, type CustomerSupportSnapshot } from "@/lib/crm/customer-support-snapshot";

export type ChatTimelineEvent = {
  id: string;
  at: string;
  type: "joined" | "message" | "ai_detect" | "staff_reply" | "ticket" | "resolved" | "system";
  label: string;
  detail?: string;
};

export type ChatSupportContext = {
  sessionId: string;
  identification: IdentifyResult;
  isKnownCustomer: boolean;
  lead: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    stage: string;
  } | null;
  customer: CustomerSupportSnapshot | null;
  diagnostics: DiagnosticIssue[];
  detectedCategories: string[];
  timeline: ChatTimelineEvent[];
};

export async function buildChatSupportContext(sessionId: string): Promise<ChatSupportContext | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      lead: true,
      messages: { orderBy: { createdAt: "asc" } },
      agent: { select: { displayName: true } },
    },
  });

  if (!session) return null;

  const identification = await autoLinkSessionCustomer(sessionId);
  const customer = identification.userId
    ? await getCustomerSupportSnapshot(identification.userId)
    : null;

  const lastUserMsg = [...session.messages].reverse().find((m) => m.role === "USER");
  const serviceHints = customer
    ? {
        expiredDomains: customer.services.domains.some((d) => d.alert === "danger"),
        suspendedHosting: customer.services.hosting.some((h) => h.status === "SUSPENDED"),
        sslExpired: customer.services.ssl.some((s) => s.alert === "danger"),
      }
    : undefined;

  const diagnostics = lastUserMsg
    ? diagnoseFromMessage(lastUserMsg.body, serviceHints)
    : [];

  const detectedCategories = lastUserMsg
    ? detectServiceCategories(lastUserMsg.body)
    : [];

  const timeline = buildChatTimeline(session.messages, detectedCategories);

  return {
    sessionId,
    identification,
    isKnownCustomer: !!customer,
    lead: session.lead
      ? {
          id: session.lead.id,
          fullName: session.lead.fullName,
          email: session.lead.email,
          phone: session.lead.phone,
          company: session.lead.company,
          stage: session.lead.stage,
        }
      : null,
    customer,
    diagnostics,
    detectedCategories,
    timeline,
  };
}

function buildChatTimeline(
  messages: { id: string; role: string; body: string; createdAt: Date }[],
  detectedCategories: string[]
): ChatTimelineEvent[] {
  const events: ChatTimelineEvent[] = [];

  if (messages.length > 0) {
    events.push({
      id: "joined",
      at: messages[0].createdAt.toISOString(),
      type: "joined",
      label: "Customer joined",
    });
  }

  let categoriesLogged = false;
  let ticketLogged = false;

  for (const msg of messages) {
    if (msg.role === "USER") {
      events.push({
        id: msg.id,
        at: msg.createdAt.toISOString(),
        type: "message",
        label: msg.body.slice(0, 80) + (msg.body.length > 80 ? "…" : ""),
      });

      if (!categoriesLogged && detectedCategories.length > 0) {
        categoriesLogged = true;
        events.push({
          id: `ai-${msg.id}`,
          at: msg.createdAt.toISOString(),
          type: "ai_detect",
          label: "AI detected",
          detail: detectedCategories.join(", "),
        });
      }
    } else if (msg.role === "AGENT") {
      events.push({
        id: msg.id,
        at: msg.createdAt.toISOString(),
        type: "staff_reply",
        label: "Staff replied",
      });
    } else if (msg.role === "SYSTEM") {
      if (/ticket/i.test(msg.body) && !ticketLogged) {
        ticketLogged = true;
        events.push({
          id: msg.id,
          at: msg.createdAt.toISOString(),
          type: "ticket",
          label: "Ticket created",
          detail: msg.body.slice(0, 60),
        });
      } else if (/resolved|closed/i.test(msg.body)) {
        events.push({
          id: msg.id,
          at: msg.createdAt.toISOString(),
          type: "resolved",
          label: "Issue resolved",
        });
      } else {
        events.push({
          id: msg.id,
          at: msg.createdAt.toISOString(),
          type: "system",
          label: msg.body.slice(0, 60),
        });
      }
    }
  }

  return events.slice(-20);
}

/** Lightweight identification for inbox list items. */
export async function getSessionCustomerHint(sessionId: string) {
  const result = await identifyCustomerFromSession(sessionId);
  if (!result.userId) {
    return { isKnownCustomer: false, customerCode: null, customerId: null };
  }
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: result.userId },
    select: { customerCode: true },
  });
  return {
    isKnownCustomer: true,
    customerCode: profile?.customerCode || null,
    customerId: result.userId,
  };
}
