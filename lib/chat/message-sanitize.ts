import { sanitizeChatReply } from "@/lib/support/sanitize-chat-reply";

/** Roles whose text is shown to visitors — must never contain IP/localhost URLs. */
const SANITIZE_ROLES = new Set(["AI", "AGENT", "SYSTEM"]);

export function sanitizeChatMessageBody(role: string, body: string): string {
  if (!body || !SANITIZE_ROLES.has(role)) return body;
  return sanitizeChatReply(body);
}

export function sanitizeChatMessages<T extends { role: string; body: string }>(
  messages: T[]
): T[] {
  return messages.map((m) =>
    SANITIZE_ROLES.has(m.role)
      ? { ...m, body: sanitizeChatReply(m.body) }
      : m
  );
}
