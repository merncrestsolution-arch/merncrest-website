"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Msg = { id: string; role: string; body: string; createdAt: string };

export function AiChatWidget() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setSessionId(d.sessionId);
      })
      .catch(() => undefined);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, role: "USER", body: text, createdAt: new Date().toISOString() },
    ]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale, sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages ?? []);
        setSessionId(data.sessionId);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-2rem,360px)] h-[420px] flex flex-col rounded-2xl border border-white/10 bg-[#0B1622]/95 backdrop-blur-xl shadow-glow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <p className="font-display font-semibold text-sm">MernCrest AI</p>
              <p className="text-[10px] text-muted">EN · TA · SI · say “agent” to escalate</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-sm text-muted leading-relaxed">
                Ask about domains, hosting, invoices, or support.{" "}
                <Link href="/knowledge-base" className="text-accent hover:underline">
                  Knowledge Base
                </Link>
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`text-sm rounded-lg px-3 py-2 max-w-[90%] ${
                  m.role === "USER"
                    ? "ml-auto bg-accent/20 border border-accent/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {m.body}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
            />
            <Button type="submit" size="icon" disabled={busy} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glow hover:opacity-90"
        aria-label="Open AI chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
