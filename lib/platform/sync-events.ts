import { EventEmitter } from "events";

/** Cross-surface sync events — website · system.merncrest.lk · MernCrest Connect */
export type PlatformSyncEvent =
  | { type: "connected"; userId: string; surface: "staff" | "customer" | "guest" }
  | { type: "ping"; at: number }
  | { type: "notification"; userId: string; id: string; title: string; unreadCount?: number }
  | { type: "chat_inbox" }
  | { type: "chat_message"; sessionId: string; messageId?: string }
  | { type: "task"; userId: string; id: string; status?: string }
  | { type: "ticket"; id: string }
  | { type: "announcement"; audience: "staff" | "all" }
  | { type: "crm_update"; entity: string; id: string }
  | { type: "attendance"; userId: string }
  | {
      type: "snapshot";
      liveChats: number;
      openTickets: number;
    }
  | {
      type: "snapshot_user";
      userId: string;
      unreadNotifications: number;
      openTasks: number;
    }
  | { type: "full_refresh"; modules: string[] };

const bus = new EventEmitter();
bus.setMaxListeners(500);

export function publishPlatformSync(event: PlatformSyncEvent) {
  bus.emit("platform", event);

  if ("userId" in event && typeof event.userId === "string") {
    bus.emit(`user:${event.userId}`, event);
  }

  if (
    event.type === "chat_inbox" ||
    event.type === "chat_message" ||
    event.type === "announcement" ||
    event.type === "ticket" ||
    event.type === "crm_update" ||
    event.type === "snapshot"
  ) {
    bus.emit("staff", event);
  }

  if (event.type === "snapshot_user" && "userId" in event) {
    bus.emit(`user:${event.userId}`, event);
  }
}

export function subscribePlatformSync(
  filter: { userId?: string; staff?: boolean },
  onEvent: (event: PlatformSyncEvent) => void
) {
  const channel = filter.userId
    ? `user:${filter.userId}`
    : filter.staff
      ? "staff"
      : "platform";

  bus.on(channel, onEvent);
  return () => bus.off(channel, onEvent);
}
