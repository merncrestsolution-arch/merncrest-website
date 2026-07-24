"use client";

export function MessageBubble({
  role,
  body,
  attachmentUrl,
}: {
  role: string;
  body: string;
  attachmentUrl?: string | null;
}) {
  const isUser = role === "USER";
  const isSystem = role === "SYSTEM";
  const isAi = role === "AI";
  const isAgent = role === "AGENT";

  if (isSystem) {
    return (
      <div className="mx-auto max-w-[90%] rounded-xl bg-[#EEF5FB] px-3 py-2 text-center text-[12px] text-[#105691]">
        {body}
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
        <p className="whitespace-pre-wrap break-words">{body}</p>
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
