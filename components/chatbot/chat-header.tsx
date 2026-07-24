"use client";

import { IconAgent, IconBack, IconBot, IconClose, IconStatusDot } from "@/components/chatbot/icons";

export function ChatHeader({
  handlerType,
  agentName,
  assistantName,
  online,
  typing,
  onClose,
  onBack,
}: {
  handlerType: "AGENT" | "AI" | string;
  agentName?: string | null;
  assistantName?: string | null;
  online?: boolean;
  typing?: boolean;
  onClose: () => void;
  onBack?: () => void;
}) {
  const isAi = handlerType !== "AGENT";
  const name = isAi ? assistantName || "Aira" : agentName || "Support";

  return (
    <header
      className="flex items-center gap-3 px-4 py-3 text-white"
      style={{ background: "#105691" }}
    >
      {onBack ? (
        <button type="button" onClick={onBack} className="md:hidden rounded-full p-1 hover:bg-white/10" aria-label="Back">
          <IconBack size={20} />
        </button>
      ) : null}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        {isAi ? <IconBot size={20} /> : <IconAgent size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[16px] font-semibold leading-tight">{name}</p>
          {isAi ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">AI</span>
          ) : null}
        </div>
        <p className="flex items-center gap-1.5 text-[12px] text-white/80">
          <IconStatusDot online={isAi ? true : online} size={7} />
          {typing ? "Typing…" : isAi ? "Online" : online ? "Online" : "Away"}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1.5 transition-colors duration-200 hover:bg-white/10"
        aria-label="Close chat"
      >
        <IconClose size={20} />
      </button>
    </header>
  );
}
