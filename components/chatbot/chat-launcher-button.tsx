"use client";

import { motion, useReducedMotion } from "framer-motion";
import { IconChat } from "@/components/chatbot/icons";

export function ChatLauncherButton({
  open,
  unread,
  onClick,
}: {
  open: boolean;
  unread: number;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-label={open ? "Close chat" : "Open chat"}
      onClick={onClick}
      className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(16,86,145,0.28)]"
      style={{ background: "#1873A8" }}
      whileHover={reduce ? undefined : { scale: 1.05 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      animate={
        reduce || open
          ? undefined
          : {
              scale: [1, 1.04, 1],
              transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
            }
      }
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <IconChat size={24} />
      {unread > 0 && !open ? (
        <motion.span
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F45627] px-1 text-[11px] font-semibold text-white"
        >
          {unread > 9 ? "9+" : unread}
        </motion.span>
      ) : null}
    </motion.button>
  );
}
