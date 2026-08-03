import { prisma } from "@/lib/db";
import { routeAiChat } from "@/lib/ai/ai-router";
import { retrieveCatalogContext } from "@/lib/ai/catalog-retrieval";
import {
  CHAT_TOOLS,
  sanitizeHandoff,
  sanitizeLeadCapture,
  sanitizeQualified,
} from "@/lib/ai/chat-tools";
import { requestHandoff } from "@/lib/chat/conversations";
import { publishChatEvent } from "@/lib/chat/events";
import { ensureLeadFromChannel } from "@/lib/crm/channels";
import { aiReply } from "@/lib/support/ai-replies";
import {
  defaultChatFallback,
  airaGuardrails,
  resolveAiraSystemPrompt,
} from "@/lib/support/chat-knowledge";
import { sanitizeChatReply } from "@/lib/support/sanitize-chat-reply";
import { rateLimit } from "@/lib/chat/rate-limit";
import type { ChatMessage } from "@/lib/ai/provider.interface";

const AI_REPLY_LIMIT = 40; // per conversation per hour

export async function handleAiTurn(opts: {
  sessionId: string;
  userMessage: string;
  pageContext?: string | null;
  locale?: string;
}) {
  const rl = rateLimit({
    key: `ai:session:${opts.sessionId}`,
    limit: AI_REPLY_LIMIT,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    const body = sanitizeChatReply(
      "You're sending messages quickly — please wait a moment, or ask to speak with a human agent."
    );
    return prisma.chatMessage.create({
      data: { sessionId: opts.sessionId, role: "AI", body },
    });
  }

  const session = await prisma.chatSession.findUnique({ where: { id: opts.sessionId } });
  if (!session) throw new Error("Session not found");

  const organizationId = session.organizationId;
  const assistant = organizationId
    ? await prisma.aiAssistantConfig.findUnique({ where: { organizationId } })
    : null;

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: opts.sessionId },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  const catalog = await retrieveCatalogContext(opts.userMessage);
  const systemPrompt = [
    airaGuardrails(),
    resolveAiraSystemPrompt(assistant?.systemPrompt, { pageContext: opts.pageContext }),
    "Never invent pricing or services not present in the catalog context below. If uncertain, offer a human handoff or the relevant help page.",
    "Only use capture_lead_info when the visitor voluntarily shares contact details. Use request_human_handoff when they ask for a person.",
    `Catalog context (official LKR price book + marketplace):\n${catalog}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ChatMessage[] = history
    .filter((m) => m.role === "USER" || m.role === "AI" || m.role === "AGENT")
    .map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.body,
    }));

  let replyText = "";
  let usedProvider: string | null = null;

  try {
    const result = await routeAiChat({
      organizationId: organizationId || undefined,
      messages,
      systemPrompt,
      tools: CHAT_TOOLS,
      maxTokens: (Number(process.env.OPENAI_MAX_TOKENS || 1500) || 1500),
      sessionId: opts.sessionId,
    });
    usedProvider = result.provider;
    replyText = result.content?.trim() || "";

    if (result.toolCalls?.length) {
      for (const call of result.toolCalls) {
        if (call.name === "capture_lead_info") {
          const info = sanitizeLeadCapture(call.arguments);
          const lead = await ensureLeadFromChannel({
            channel: "LIVE_CHAT",
            fullName: info.name || "Chat visitor",
            email: info.email,
            phone: info.phone,
            company: info.company,
            interest: info.requirement || "Live chat",
            activityType: "CHAT",
            activityBody: `Lead capture: ${JSON.stringify(info).slice(0, 200)}`,
            channelRef: opts.sessionId,
            userId: session.userId,
          });
          await prisma.chatSession.update({
            where: { id: opts.sessionId },
            data: { leadId: lead.id },
          });
          const { autoLinkSessionCustomer } = await import("@/lib/chat/identify-customer");
          void autoLinkSessionCustomer(opts.sessionId);
        }
        if (call.name === "flag_qualified_lead") {
          const q = sanitizeQualified(call.arguments);
          if (session.leadId) {
            await prisma.crmLead.update({
              where: { id: session.leadId },
              data: {
                stage: "QUALIFIED",
                priority: q.urgency,
                notes: q.reason,
                leadScore: { increment: 15 },
              },
            });
          }
          // Offer handoff if agents may be available
          await requestHandoff(opts.sessionId, q.reason);
        }
        if (call.name === "request_human_handoff") {
          const h = sanitizeHandoff(call.arguments);
          await requestHandoff(opts.sessionId, h.reason);
          if (!replyText) {
            replyText = "I'll connect you with a specialist now.";
          }
        }
      }
    }
  } catch (error) {
    console.error("[chat-orchestrator]", error);
    // Prefer useful FAQ/catalog reply over a generic "agent shortly" stub
    replyText = aiReply(opts.userMessage, opts.locale || session.locale);
  }

  if (!replyText) {
    replyText =
      aiReply(opts.userMessage, opts.locale || session.locale) ||
      assistant?.fallbackMessage ||
      defaultChatFallback(opts.locale || session.locale);
  }

  replyText = sanitizeChatReply(replyText);

  if (usedProvider) {
    await prisma.chatSession.update({
      where: { id: opts.sessionId },
      data: { aiProvider: usedProvider, updatedAt: new Date() },
    });
  }

  return prisma.chatMessage.create({
    data: { sessionId: opts.sessionId, role: "AI", body: replyText },
  }).then((msg) => {
    publishChatEvent({ type: "message", sessionId: opts.sessionId, messageId: msg.id });
    publishChatEvent({ type: "inbox_updated" });
    return msg;
  });
}
