"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-2rem,340px)] rounded-2xl border border-white/10 bg-[#0B1622]/95 backdrop-blur-xl shadow-glow-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold">MernCrest AI</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Ask about domains, hosting, invoices, or support. Full AI assistant connects in a later phase —
            for now, jump to Support or WhatsApp.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild size="sm"><Link href="/support">Support Center</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/contact">Contact Sales</Link></Button>
          </div>
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
