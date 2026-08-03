"use client";

import { Bot, Headphones } from "lucide-react";
import { ChatMessageBody } from "@/components/chatbot/chat-message-body";

export function MessageBubble({
  role,
  body,
  attachmentUrl,
  variant = "default",
}: {
  role: string;
  body: string;
  attachmentUrl?: string | null;
  variant?: "default" | "stitch-staff";
}) {
  const displayBody = body;
  const isUser = role === "USER";
  const isSystem = role === "SYSTEM";
  const isAi = role === "AI";
  const isAgent = role === "AGENT";

  if (variant === "stitch-staff") {
    if (isSystem) {
      return (
        <div className="flex justify-center py-1">
          <span className="rounded-full bg-[var(--stitch-primary-soft)] px-3 py-1 text-[11px] font-medium text-[var(--stitch-primary)]">
            {displayBody}
          </span>
        </div>
      );
    }

    return (
      <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser ? (
          <span
            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
              isAi ? "bg-violet-500" : "bg-[var(--stitch-primary)]"
            }`}
            aria-hidden
          >
            {isAi ? <Bot className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
          </span>
        ) : null}
        <div className={`max-w-[min(78%,520px)] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
          {!isUser ? (
            <span className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--sp-muted)]">
              {isAi ? "Aira · AI" : "You"}
            </span>
          ) : (
            <span className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--sp-muted)]">
              Visitor
            </span>
          )}
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${
              isUser
                ? "rounded-br-md bg-[var(--stitch-primary)] text-white"
                : isAi
                  ? "rounded-bl-md border border-violet-100 bg-violet-50/80 text-[var(--sp-on)]"
                  : "rounded-bl-md border border-[var(--sp-outline)] bg-white text-[var(--sp-on)]"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">
              <ChatMessageBody
                role={role}
                body={body}
                linkClassName={`underline underline-offset-2 hover:opacity-80 ${isUser ? "text-white/90" : "text-[var(--stitch-primary)]"}`}
              />
            </p>
            {attachmentUrl ? (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className={`mt-2 block text-[12px] underline ${isUser ? "text-white/90" : "text-[var(--stitch-primary)]"}`}
              >
                View attachment
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (isSystem) {
    return (
      <div className="mx-auto max-w-[90%] rounded-xl bg-[#EEF5FB] px-3 py-2 text-center text-[12px] text-[#105691]">
        {displayBody}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-xl px-3 py-2 text-[14px] leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md text-white"
            : isAi
              ? "rounded-bl-md border border-[#d6e7f5] bg-white text-[#1e293b]"
              : isAgent
                ? "rounded-bl-md bg-[#EEF5FB] text-[#0f172a]"
                : "bg-white text-[#1e293b]"
        }`}
        style={isUser ? { background: "#1873A8" } : undefined}
      >
        {isAi ? (
          <span className="mb-1 block text-[11px] font-medium text-[#1873A8]">AI</span>
        ) : null}
        {isAgent ? (
          <span className="mb-1 block text-[11px] font-medium text-[#105691]">Agent</span>
        ) : null}
        <p className="whitespace-pre-wrap break-words">
          <ChatMessageBody
            role={role}
            body={body}
            linkClassName={`underline underline-offset-2 hover:opacity-80 ${isUser ? "text-white/90" : "text-[#1873A8]"}`}
          />
        </p>
        {attachmentUrl ? (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className={`mt-2 block text-[12px] underline ${isUser ? "text-white/90" : "text-[#1873A8]"}`}
          >
            View attachment
          </a>
        ) : null}
      </div>
    </div>
  );
}
