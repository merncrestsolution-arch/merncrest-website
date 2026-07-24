"use client";

import { useEffect, useRef } from "react";

type ChatSseEvent = {
  type: string;
  sessionId?: string;
  messageId?: string;
  at?: number;
};

/** Subscribe to chat SSE — calls onEvent when server pushes updates */
export function useChatSse(
  url: string | null,
  onEvent: (event: ChatSseEvent) => void,
  enabled = true
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!url || !enabled) return;

    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      es = new EventSource(url);

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as ChatSseEvent;
          if (data.type === "ping" || data.type === "connected") return;
          onEventRef.current(data);
        } catch {
          /* ignore malformed */
        }
      };

      es.onerror = () => {
        es?.close();
        if (!closed) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, [url, enabled]);
}
