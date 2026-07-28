import { prisma } from "@/lib/db";
import { routeAiChat } from "@/lib/ai/ai-router";
import { retrieveCatalogContext } from "@/lib/ai/catalog-retrieval";
import { airaSalesGuardrails } from "@/lib/support/chat-knowledge";
import { sanitizeChatReply } from "@/lib/support/sanitize-chat-reply";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

export type Suggestion = {
  title: string;
  reason: string;
  action?: string;
};

/** Non-blocking AI suggestions for staff lead / chat views. */
export async function suggestForLead(opts: {
  leadId?: string;
  sessionId?: string;
  requestText?: string;
  actorId?: string;
}): Promise<Suggestion[]> {
  const organizationId = await getPrimaryOrganizationId();
  let context = opts.requestText || "";

  if (opts.leadId) {
    const lead = await prisma.crmLead.findUnique({ where: { id: opts.leadId } });
    if (lead) {
      context = `Lead: ${lead.fullName}, ${lead.email}, ${lead.company || ""}, interest: ${lead.interest || ""}, stage: ${lead.stage}. Notes: ${lead.notes || ""}`;
    }
  }
  if (opts.sessionId) {
    const msgs = await prisma.chatMessage.findMany({
      where: { sessionId: opts.sessionId },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    context +=
      "\nRecent chat:\n" +
      msgs
        .reverse()
        .map((m) => `${m.role}: ${m.body}`)
        .join("\n");
  }

  const catalog = await retrieveCatalogContext(context || "enterprise software");

  let suggestions: Suggestion[] = [];
  try {
    const result = await routeAiChat({
      organizationId,
      sessionId: opts.sessionId,
      systemPrompt: `You recommend next actions for MernCrest staff. Reply with ONLY a JSON array of 2-4 objects: {"title","reason","action"}. Use catalog context. Never invent products.\n\nCatalog:\n${catalog}`,
      messages: [{ role: "user", content: context || "General inbound lead" }],
      maxTokens: 500,
    });
    const match = result.content.match(/\[[\s\S]*\]/);
    if (match) {
      suggestions = JSON.parse(match[0]) as Suggestion[];
    }
  } catch {
    suggestions = [
      {
        title: "Request a discovery call",
        reason: "Clarify scope before quoting",
        action: "Schedule meeting",
      },
      {
        title: "Share relevant catalog packages",
        reason: "Match interest to live offerings",
        action: "Send catalog link",
      },
    ];
  }

  await prisma.suggestionEvent.create({
    data: {
      organizationId,
      leadId: opts.leadId || null,
      sessionId: opts.sessionId || null,
      actorId: opts.actorId || null,
      suggestionJson: JSON.stringify(suggestions).slice(0, 4000),
      action: "SHOWN",
    },
  });

  return suggestions.slice(0, 4);
}

/**
 * Draft reply texts for staff answering a visitor live chat.
 * Prefer LLM; fall back to FAQ/`aiReply` so agents always get something usable.
 */
export async function suggestAgentReplies(opts: {
  sessionId: string;
  actorId?: string;
}): Promise<{ replies: string[]; source: "ai" | "faq" }> {
  const organizationId = await getPrimaryOrganizationId();
  const msgs = await prisma.chatMessage.findMany({
    where: { sessionId: opts.sessionId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const chronological = [...msgs].reverse();
  const lastUser = [...chronological].reverse().find((m) => m.role === "USER");
  const transcript = chronological
    .map((m) => `${m.role}: ${m.body}`)
    .join("\n");

  const catalog = await retrieveCatalogContext(lastUser?.body || "support");
  let replies: string[] = [];
  let source: "ai" | "faq" = "faq";

  try {
    const result = await routeAiChat({
      organizationId,
      sessionId: opts.sessionId,
      systemPrompt: [
        airaSalesGuardrails(),
        "You help MernCrest staff draft short live-chat replies to website visitors.",
        "Return ONLY a JSON array of 3 strings (ready-to-send reply drafts).",
        "Tone: senior sales consultant — warm, confident, concise (1–3 sentences each).",
        "ALWAYS use https://merncrest.lk links — never localhost, 127.0.0.1, or IP addresses.",
        "Never invent pricing or products not in the catalog.",
        "Offer a clear next step when useful.",
        `Catalog:\n${catalog}`,
      ].join("\n"),
      messages: [
        {
          role: "user",
          content: `Visitor last message: ${lastUser?.body || "(none)"}\n\nTranscript:\n${transcript}`,
        },
      ],
      maxTokens: 500,
    });
    const match = result.content.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]) as unknown;
      if (Array.isArray(parsed)) {
        replies = parsed
          .map((x) => (typeof x === "string" ? x : String((x as { text?: string }).text || "")))
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3);
        if (replies.length) source = "ai";
      }
    }
  } catch {
    /* FAQ fallback below */
  }

  if (!replies.length) {
    const { aiReply } = await import("@/lib/support/ai-replies");
    const faq = aiReply(lastUser?.body || "hello", "en");
    replies = [
      faq,
      "Thanks for reaching out — I'm looking into this for you now. Could you share a bit more detail so I can help accurately?",
      "Happy to help. Would you like me to connect you with a specialist, or shall we continue here?",
    ];
    source = "faq";
  }

  await prisma.suggestionEvent.create({
    data: {
      organizationId,
      sessionId: opts.sessionId,
      actorId: opts.actorId || null,
      suggestionJson: JSON.stringify(replies).slice(0, 4000),
      action: "SHOWN",
    },
  });

  return { replies: replies.map((r) => sanitizeChatReply(r)), source };
}

export async function logSuggestionAction(opts: {
  eventId?: string;
  leadId?: string;
  sessionId?: string;
  actorId?: string;
  action: "ACCEPTED" | "DISMISSED";
  suggestionJson?: string;
}) {
  if (opts.eventId) {
    return prisma.suggestionEvent.update({
      where: { id: opts.eventId },
      data: { action: opts.action },
    });
  }
  return prisma.suggestionEvent.create({
    data: {
      organizationId: await getPrimaryOrganizationId(),
      leadId: opts.leadId || null,
      sessionId: opts.sessionId || null,
      actorId: opts.actorId || null,
      suggestionJson: opts.suggestionJson || "[]",
      action: opts.action,
    },
  });
}
