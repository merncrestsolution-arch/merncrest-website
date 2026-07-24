import { EventEmitter } from "events";

export type ChatEvent =
  | { type: "message"; sessionId: string; messageId?: string }
  | { type: "session_closed"; sessionId: string }
  | { type: "inbox_updated" };

const bus = new EventEmitter();
bus.setMaxListeners(200);

export function publishChatEvent(event: ChatEvent) {
  bus.emit("chat", event);
  if (event.type === "message" || event.type === "session_closed") {
    bus.emit(`session:${event.sessionId}`, event);
  }
  if (event.type === "inbox_updated" || event.type === "message" || event.type === "session_closed") {
    bus.emit("inbox", event);
  }
}

export function subscribeChatEvents(
  filter: { sessionId?: string; inbox?: boolean },
  onEvent: (event: ChatEvent) => void
) {
  const channel = filter.sessionId
    ? `session:${filter.sessionId}`
    : filter.inbox
      ? "inbox"
      : "chat";

  bus.on(channel, onEvent);
  return () => bus.off(channel, onEvent);
}
