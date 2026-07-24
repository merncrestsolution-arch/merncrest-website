"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/chatbot/message-bubble";
import { TypingIndicator } from "@/components/chatbot/typing-indicator";

export type ChatMsg = {
  id: string;
  role: string;
  body: string;
  createdAt?: string;
  attachmentUrl?: string | null;
};

export function MessageList({
  messages,
  typing,
}: {
  messages: ChatMsg[];
  typing?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottom.current = dist < 80;
      setShowJump(dist >= 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) {
      setShowJump(true);
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  function jumpDown() {
    stickToBottom.current = true;
    setShowJump(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  const list = messages.length > 50 ? messages.slice(-50) : messages;

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollerRef} className="h-full space-y-3 overflow-y-auto px-4 py-3">
        {list.map((m) => (
          <MessageBubble key={m.id} role={m.role} body={m.body} attachmentUrl={m.attachmentUrl} />
        ))}
        {typing ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>
      {showJump ? (
        <button
          type="button"
          onClick={jumpDown}
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#105691] px-3 py-1.5 text-[12px] font-medium text-white shadow-md transition duration-200 ease-out"
        >
          New messages
        </button>
      ) : null}
    </div>
  );
}
