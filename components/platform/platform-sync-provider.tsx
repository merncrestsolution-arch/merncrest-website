"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PlatformSyncState = {
  unreadNotifications: number;
  liveChats: number;
  openTasks: number;
  openTickets: number;
  lastSyncAt: string | null;
  connected: boolean;
  lastEventType: string | null;
  tick: number;
};

type SyncEvent = {
  type: string;
  unreadCount?: number;
  liveChats?: number;
  openTickets?: number;
  openTasks?: number;
  unreadNotifications?: number;
};

const DEFAULT: PlatformSyncState = {
  unreadNotifications: 0,
  liveChats: 0,
  openTasks: 0,
  openTickets: 0,
  lastSyncAt: null,
  connected: false,
  lastEventType: null,
  tick: 0,
};

type Ctx = PlatformSyncState & { refresh: () => Promise<void> };

const PlatformSyncContext = createContext<Ctx | null>(null);

function applyEvent(prev: PlatformSyncState, data: SyncEvent): PlatformSyncState {
  const next = { ...prev, lastEventType: data.type, tick: prev.tick + 1 };

  if (data.type === "notification" && typeof data.unreadCount === "number") {
    next.unreadNotifications = data.unreadCount;
  }
  if (data.type === "snapshot") {
    if (typeof data.liveChats === "number") next.liveChats = data.liveChats;
    if (typeof data.openTickets === "number") next.openTickets = data.openTickets;
  }
  if (data.type === "snapshot_user") {
    if (typeof data.unreadNotifications === "number") next.unreadNotifications = data.unreadNotifications;
    if (typeof data.openTasks === "number") next.openTasks = data.openTasks;
  }

  return next;
}

/** Real-time sync provider — SSE instant push (website + system + mobile web). */
export function PlatformSyncProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [state, setState] = useState<PlatformSyncState>(DEFAULT);
  const sinceRef = useRef<string | null>(null);

  const pull = useCallback(async () => {
    const qs = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : "";
    const res = await fetch(`/api/platform/sync${qs}`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    sinceRef.current = data.serverTime as string;
    setState((s) => ({
      ...s,
      unreadNotifications: data.unreadNotifications ?? s.unreadNotifications,
      liveChats: data.liveChats ?? s.liveChats,
      openTasks: data.openTasks ?? s.openTasks,
      openTickets: data.openTickets ?? s.openTickets,
      lastSyncAt: data.serverTime ?? s.lastSyncAt,
    }));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    void pull();

    // Rare safety net only — live data comes from SSE
    const poll = setInterval(() => void pull(), 120_000);

    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      es = new EventSource("/api/platform/stream");

      es.onopen = () => setState((s) => ({ ...s, connected: true }));

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as SyncEvent;
          if (data.type === "ping") return;
          if (data.type === "connected") {
            setState((s) => ({ ...s, connected: true }));
            return;
          }
          setState((s) => applyEvent(s, data));
          if (
            data.type === "task" ||
            data.type === "ticket" ||
            data.type === "announcement" ||
            data.type === "crm_update" ||
            data.type === "chat_inbox" ||
            data.type === "chat_message"
          ) {
            void pull();
          }
        } catch {
          /* ignore */
        }
      };

      es.onerror = () => {
        setState((s) => ({ ...s, connected: false }));
        es?.close();
        if (!closed) retry = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      closed = true;
      clearInterval(poll);
      if (retry) clearTimeout(retry);
      es?.close();
    };
  }, [enabled, pull]);

  const value = useMemo(() => ({ ...state, refresh: pull }), [state, pull]);

  return <PlatformSyncContext.Provider value={value}>{children}</PlatformSyncContext.Provider>;
}

export function usePlatformSync() {
  const ctx = useContext(PlatformSyncContext);
  if (!ctx) {
    throw new Error("usePlatformSync must be used within PlatformSyncProvider");
  }
  return ctx;
}

/** Re-run callback instantly when matching sync events arrive. */
export function useSyncRefresh(
  modules: string[],
  onRefresh: () => void,
  enabled = true
) {
  const { tick, lastEventType } = usePlatformSync();
  const modulesKey = modules.join(",");
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled || !lastEventType) return;
    const map: Record<string, string[]> = {
      notification: ["notification", "snapshot_user"],
      chat: ["chat_inbox", "chat_message", "snapshot"],
      task: ["task", "snapshot_user"],
      ticket: ["ticket", "snapshot"],
      announcement: ["announcement"],
      crm: ["crm_update"],
      attendance: ["attendance"],
      all: ["notification", "chat_inbox", "chat_message", "task", "ticket", "announcement", "crm_update", "snapshot", "snapshot_user"],
    };
    const wanted = modulesKey.split(",").flatMap((m) => map[m.trim()] ?? [m.trim()]);
    if (wanted.includes(lastEventType) || modulesKey === "all") {
      onRefreshRef.current();
    }
  }, [tick, lastEventType, modulesKey, enabled]);
}
