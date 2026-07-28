import { kbArticles } from "@/lib/data/knowledge-base";
import {
  defaultChatFallback,
  matchChatKnowledge,
} from "@/lib/support/chat-knowledge";
import { sanitizeChatReply } from "@/lib/support/sanitize-chat-reply";

export function aiReply(message: string, locale = "en"): string {
  const matched = matchChatKnowledge(message);
  if (matched) {
    return sanitizeChatReply(localizeHint(matched, locale));
  }

  const q = message.toLowerCase();
  const kb = kbArticles.find(
    (a) =>
      q.includes(a.slug.split("-")[0]) ||
      a.title.toLowerCase().split(" ").some((w) => w.length > 4 && q.includes(w))
  );
  if (kb) {
    return sanitizeChatReply(
      localizeHint(`${kb.title}: ${kb.summary} — read more in Knowledge Base.`, locale)
    );
  }

  return sanitizeChatReply(localizeHint(defaultChatFallback(locale), locale));
}

function localizeHint(en: string, locale: string) {
  if (locale === "ta") return `[TA] ${en}`;
  if (locale === "si") return `[SI] ${en}`;
  return en;
}

export function wantsHumanHandoff(message: string) {
  const q = message.toLowerCase();
  return (
    /\b(talk to|speak (to|with)|connect( me)? (to|with)|transfer( me)? to)\b.{0,40}\b(agent|human|person|someone|staff|operator)\b/.test(
      q
    ) ||
    /\b(live agent|human agent|real person|talk to a person|speak to a person)\b/.test(q) ||
    /\b(escalate|operator)\b/.test(q)
  );
}
