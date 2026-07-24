"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function ChatPanel({
  open,
  children,
  keyboardOffset = 0,
}: {
  open: boolean;
  children: React.ReactNode;
  keyboardOffset?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="chat-panel"
          role="dialog"
          aria-label="Live chat"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: reduce ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-white md:inset-auto md:bottom-24 md:right-6 md:h-[min(70vh,640px)] md:w-[400px] md:rounded-2xl md:shadow-[0_8px_24px_rgba(16,86,145,0.12)]"
          style={{
            paddingBottom: keyboardOffset || undefined,
            fontFamily: "var(--font-body, system-ui, sans-serif)",
          }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
