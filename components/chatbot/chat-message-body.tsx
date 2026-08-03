"use client";

import { sanitizeChatMessageBody } from "@/lib/chat/message-sanitize";
import { splitTextWithLinks } from "@/lib/chat/linkify";

export function ChatMessageBody({
  role,
  body,
  className = "whitespace-pre-wrap break-words",
  linkClassName = "underline underline-offset-2 hover:opacity-80",
}: {
  role: string;
  body: string;
  className?: string;
  linkClassName?: string;
}) {
  const text = sanitizeChatMessageBody(role, body);
  const segments = splitTextWithLinks(text);

  if (segments.length === 1 && segments[0].type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.type === "link" ? (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {seg.value}
          </a>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </span>
  );
}
