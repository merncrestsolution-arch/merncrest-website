"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, usePathname } from "@/i18n/routing";
import { useChatSse } from "@/hooks/use-chat-sse";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Headphones,
  ShieldCheck,
  Home,
  ChevronLeft,
  Plus,
  ArrowUp,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  CHAT_QUICK_REPLIES,
  defaultChatFallback,
  matchChatKnowledge,
} from "@/lib/support/chat-knowledge";
import { sanitizeChatReply } from "@/lib/support/sanitize-chat-reply";
import { ChatMessageBody } from "@/components/chatbot/chat-message-body";

type Msg = {
  id: string;
  role: string;
  body: string;
  createdAt: string;
  /** Client-only delivery state for USER bubbles */
  delivery?: "sending" | "sent" | "read";
};
type Tab = "home" | "chat";

const AIRA = { name: "Aira", role: "MernCrest AI Assistant" };
const FALLBACK_AGENT = { name: "Support", role: "Product Expert" };
const GRAD = "bg-gradient-to-br from-red-500 to-rose-600";

const SESSION_KEY = "mc-chat-session-id-v1";
const UNREAD_KEY = "mc-chat-unread-v1";
const LAST_READ_KEY = "mc-chat-last-read-v1";
const PENDING_CSAT_KEY = "mc-chat-pending-csat-v1";

const TEASER_KEY = "mc-chat-teaser-v1";

const QUICK_REPLIES = [...CHAT_QUICK_REPLIES];

function readPendingCsat(): string | null {
  try {
    return localStorage.getItem(PENDING_CSAT_KEY);
  } catch {
    return null;
  }
}

function writePendingCsat(id: string | null) {
  try {
    if (id) localStorage.setItem(PENDING_CSAT_KEY, id);
    else localStorage.removeItem(PENDING_CSAT_KEY);
  } catch {
    /* ignore */
  }
}

function clearChatStorage() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(UNREAD_KEY);
    sessionStorage.removeItem(LAST_READ_KEY);
  } catch {
    /* ignore */
  }
}

function readSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSessionId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function writeUnread(n: number) {
  try {
    sessionStorage.setItem(UNREAD_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export function AiChatWidget() {
  const locale = useLocale();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [phase] = useState<"chat">("chat");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [handlerType, setHandlerType] = useState<"AI" | "AGENT" | string>("AI");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [assistantName, setAssistantName] = useState(AIRA.name);
  const [agentOnline, setAgentOnline] = useState(true);
  const [unread, setUnread] = useState(0);
  const [showJump, setShowJump] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<number>(0);
  const [tapRipple, setTapRipple] = useState(0);
  const [typingVisible, setTypingVisible] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [teaser, setTeaser] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chatClosed, setChatClosed] = useState(false);
  const [csatRequested, setCsatRequested] = useState(false);
  const [csatSubmitted, setCsatSubmitted] = useState(false);
  const [csatBusy, setCsatBusy] = useState(false);
  const [endingChat, setEndingChat] = useState(false);
  const [pendingCsatSession, setPendingCsatSession] = useState<string | null>(null);
  const loadSeq = useRef(0);
  const sendingRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);
  const stickToBottom = useRef(true);
  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Msg[]>([]);
  const chatClosedRef = useRef(false);
  const csatSubmittedRef = useRef(false);
  openRef.current = open;
  sessionIdRef.current = sessionId;
  messagesRef.current = messages;
  chatClosedRef.current = chatClosed;
  csatSubmittedRef.current = csatSubmitted;

  // Keep typing UI visible at least ~700ms so the animation is noticeable
  useEffect(() => {
    if (busy) {
      setTypingVisible(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      return;
    }
    typingTimer.current = setTimeout(() => setTypingVisible(false), 700);
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [busy]);

  const displayName =
    handlerType === "AGENT" ? agentName || FALLBACK_AGENT.name : AIRA.name;
  const displayRole =
    handlerType === "AGENT"
      ? agentOnline
        ? `${FALLBACK_AGENT.role} | Online`
        : `${FALLBACK_AGENT.role} | Away`
      : `${AIRA.role} | Online`;

  function markAllRead() {
    const now = Date.now();
    setLastReadAt(now);
    setUnread(0);
    writeUnread(0);
    try {
      sessionStorage.setItem(LAST_READ_KEY, String(now));
    } catch {
      /* ignore */
    }
    setMessages((list) =>
      list.map((m) =>
        m.role === "USER" ? { ...m, delivery: "read" as const } : m
      )
    );
  }

  function withReadReceipts(list: Msg[]): Msg[] {
    let lastNonUser = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role !== "USER") {
        lastNonUser = i;
        break;
      }
    }
    return list.map((m, i) => {
      if (m.role !== "USER") return m;
      const delivery =
        m.delivery === "sending"
          ? "sending"
          : lastNonUser > i || (openRef.current && lastReadAt > 0)
            ? "read"
            : "sent";
      return { ...m, delivery };
    });
  }

  useEffect(() => {
    const pending = readPendingCsat();
    if (pending) {
      setPendingCsatSession(pending);
      setCsatRequested(true);
      setChatClosed(true);
    }
  }, []);

  const resetChat = useCallback(() => {
    clearChatStorage();
    writePendingCsat(null);
    setSessionId(null);
    setMessages([]);
    setChatClosed(false);
    setCsatRequested(false);
    setCsatSubmitted(false);
    setPendingCsatSession(null);
    setHandoff(false);
    setTicketNumber(null);
    setHandlerType("AI");
    setAgentName(null);
    setVisitorName("");
    setInput("");
    setBusy(false);
    setUnread(0);
    writeUnread(0);
  }, []);

  useEffect(() => {
    const id = readSessionId();
    if (id && !readPendingCsat()) setSessionId(id);
    try {
      setUnread(Number(sessionStorage.getItem(UNREAD_KEY) || 0) || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (pendingCsatSession && open) {
      setTab("chat");
    }
  }, [pendingCsatSession, open]);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(TEASER_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const t = setTimeout(() => setTeaser(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Keep conversation when browsing within the same tab
  }, [pathname, locale]);

  // End session + optional review prompt when visitor closes the browser/tab
  useEffect(() => {
    const onPageHide = (e: PageTransitionEvent) => {
      const sid = sessionIdRef.current;
      const hasMessages = messagesRef.current.length > 0;
      if (!sid || !hasMessages || chatClosedRef.current) return;

      const payload = JSON.stringify({ sessionId: sid, requestCsat: true });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/chat/end-session", blob);
      } catch {
        /* ignore */
      }

      if (e.persisted === false) {
        writePendingCsat(sid);
        clearChatStorage();
      }
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  const applySessionPayload = useCallback(
    (d: {
      sessionId?: string | null;
      messages?: Msg[];
      status?: string | null;
      handlerType?: string | null;
      agent?: { displayName?: string; online?: boolean } | null;
      assistantName?: string | null;
      handoff?: boolean;
      ticketNumber?: string | null;
      csatRequested?: boolean;
      csatRating?: number | null;
    }) => {
      if (d.sessionId) {
        setSessionId(d.sessionId);
        writeSessionId(d.sessionId);
      }
      if (d.messages) setMessages(withReadReceipts(d.messages));
      if (d.status === "CLOSED") setChatClosed(true);
      else if (d.status) setChatClosed(false);
      if (d.csatRequested) setCsatRequested(true);
      if (d.csatRating) {
        setCsatSubmitted(true);
        setCsatRequested(false);
      }
      if (d.status === "HANDOFF" || d.handoff) setHandoff(true);
      if (d.ticketNumber) setTicketNumber(d.ticketNumber);
      if (d.handlerType) setHandlerType(d.handlerType);
      if (d.agent?.displayName) setAgentName(d.agent.displayName);
      if (typeof d.agent?.online === "boolean") setAgentOnline(d.agent.online);
      if (d.assistantName) setAssistantName(d.assistantName);
      if ((d.messages?.length ?? 0) > 0) {
        /* chat active */
      }
      // Auto-reset after closed chat with CSAT already submitted
      if (d.status === "CLOSED" && d.csatRating) {
        resetChat();
      }
    },
    [resetChat]
  );

  const loadConversation = useCallback(async () => {
    if (sendingRef.current) return;
    const seq = ++loadSeq.current;
    const sid = readSessionId();
    const url = sid ? `/api/chat?sessionId=${encodeURIComponent(sid)}` : "/api/chat";
    const res = await fetch(url);
    const d = await res.json();
    if (seq !== loadSeq.current || sendingRef.current) return;
    applySessionPayload(d);
  }, [applySessionPayload]);

  useChatSse(
    sessionId && open && phase === "chat"
      ? `/api/chat/conversations/${sessionId}/stream`
      : null,
    () => {
      loadConversation().catch(() => undefined);
    },
    open && phase === "chat" && Boolean(sessionId)
  );

  useEffect(() => {
    if (!open) return;
    markAllRead();
    loadConversation().catch(() => undefined);
  }, [open, loadConversation]);

  // Slow fallback poll if SSE disconnects
  useEffect(() => {
    if (!open || phase !== "chat") return;
    const t = setInterval(() => {
      if (sendingRef.current) return;
      loadConversation().catch(() => undefined);
    }, 30000);
    return () => clearInterval(t);
  }, [open, phase, loadConversation]);

  useEffect(() => {
    if (!open || tab !== "chat" || phase !== "chat") return;
    const t = setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(t);
  }, [open, tab, phase]);

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
  }, [open, tab, phase]);

  useEffect(() => {
    if (tab !== "chat" || phase !== "chat") return;
    if (!stickToBottom.current) {
      setShowJump(true);
      return;
    }
    bottomRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, busy, open, tab, phase, reduceMotion]);

  function jumpDown() {
    stickToBottom.current = true;
    setShowJump(false);
    bottomRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }

  function dismissTeaser() {
    setTeaser(false);
    try {
      sessionStorage.setItem(TEASER_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function openFromTeaser() {
    dismissTeaser();
    setTab("home");
    setOpen(true);
  }

  function bumpUnread() {
    if (openRef.current) return;
    setUnread((u) => {
      const n = u + 1;
      writeUnread(n);
      return n;
    });
  }

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text || busy || chatClosed) return;
    const clientMessageId = (() => {
      try {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID();
        }
      } catch {
        /* ignore */
      }
      const bytes = new Uint8Array(16);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    })();

    setInput("");
    setBusy(true);
    sendingRef.current = true;
    loadSeq.current += 1;
    stickToBottom.current = true;
    setShowJump(false);

    setMessages((m) => [
      ...m,
      {
        id: `tmp-${clientMessageId}`,
        role: "USER",
        body: text,
        createdAt: new Date().toISOString(),
        delivery: "sending",
      },
    ]);
    requestAnimationFrame(() => inputRef.current?.focus());

    const payloadBase = {
      message: text,
      locale,
      clientMessageId,
      pageContext: String(pathname || "").slice(0, 400) || undefined,
      visitorName: visitorName || undefined,
    };

    async function postChat(extra: Record<string, unknown>) {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payloadBase, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    }

    try {
      let { res, data } = await postChat({
        sessionId: sessionId || undefined,
      });

      // Retry once without sticky session if validation / server rejected it
      if (!res.ok) {
        ({ res, data } = await postChat({}));
      }

      if (res.ok && Array.isArray(data.messages) && data.messages.length) {
        applySessionPayload(data);
        if (data.latest && data.latest.role !== "USER") bumpUnread();
      } else if (res.ok && data.latest && data.latest.role !== "USER") {
        setMessages((list) => {
          const withoutTmp = list.filter((m) => m.id !== `tmp-${clientMessageId}`);
          return withReadReceipts([
            ...withoutTmp,
            {
              id: `${data.latest.id}-user`,
              role: "USER",
              body: text,
              createdAt: new Date().toISOString(),
              delivery: "sent",
            },
            data.latest,
          ]);
        });
        if (data.sessionId) {
          setSessionId(data.sessionId);
          writeSessionId(data.sessionId);
        }
        if (data.handlerType) setHandlerType(data.handlerType);
        bumpUnread();
      } else {
        // Last-resort local Aira reply so the visitor is never stuck on an error bubble
        setMessages((list) => [
          ...list.map((m) =>
            m.id === `tmp-${clientMessageId}` ? { ...m, delivery: "sent" as const } : m
          ),
          {
            id: `local-${Date.now()}`,
            role: "AI",
            body: sanitizeChatReply(
              matchChatKnowledge(text) || defaultChatFallback(locale)
            ),
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((list) => [
        ...list.map((m) =>
          m.id === `tmp-${clientMessageId}` ? { ...m, delivery: "sent" as const } : m
        ),
        {
          id: `local-${Date.now()}`,
          role: "AI",
          body:
            "Thanks for your message. I can help with services, pricing, billing, and support. Ask me anything, or say talk to a person.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      sendingRef.current = false;
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function submitCsat(rating: number) {
    const sid = pendingCsatSession || sessionId;
    if (!sid || csatBusy || csatSubmitted) return;
    setCsatBusy(true);
    try {
      const res = await fetch("/api/csat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "CHAT",
          referenceId: sid,
          rating,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      setCsatSubmitted(true);
      setCsatRequested(false);
      writePendingCsat(null);
      setPendingCsatSession(null);
      resetChat();
    } catch {
      /* visitor can retry */
    } finally {
      setCsatBusy(false);
    }
  }

  function skipCsat() {
    writePendingCsat(null);
    setPendingCsatSession(null);
    setCsatSubmitted(true);
    setCsatRequested(false);
    resetChat();
  }

  function startNewChat() {
    resetChat();
  }

  async function endChat() {
    const sid = sessionId;
    const hasMessages = messages.length > 0;

    if (!sid || !hasMessages || chatClosed) {
      resetChat();
      return;
    }

    setEndingChat(true);
    try {
      const res = await fetch("/api/chat/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, requestCsat: true }),
      });
      if (!res.ok) throw new Error("Failed to end chat");
      clearChatStorage();
      setPendingCsatSession(sid);
      setChatClosed(true);
      setCsatRequested(true);
    } catch {
      clearChatStorage();
      setPendingCsatSession(sid);
      setChatClosed(true);
      setCsatRequested(true);
    } finally {
      setEndingChat(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploadError(null);
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setUploadError("Only JPG, PNG, or PDF files are allowed.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds the 10 MB limit.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setUploadError(data.error || "Upload failed. Please try again.");
        return;
      }
      await sendText(`Shared a file: ${data.name} (scanned & verified safe)`);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const greeting = `Hi ${visitorName || "there"}! I'm ${displayName}. How can I assist you with MernCrest today?`;

  const panelMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: 24, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.96 },
        transition: { type: "spring" as const, stiffness: 320, damping: 30 },
      };

  const teaserMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: 16, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.9 },
        transition: { type: "spring" as const, stiffness: 340, damping: 22 },
      };

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {teaser && !open && (
          <motion.div
            {...teaserMotion}
            className="relative w-[min(100vw-3rem,280px)] cursor-pointer rounded-2xl border border-stitch-outline bg-stitch-surface p-4 pr-8 shadow-[var(--stitch-card-shadow)]"
            onClick={openFromTeaser}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissTeaser();
              }}
              aria-label="Dismiss"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-stitch-muted transition hover:bg-stitch-bg hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="mb-1.5 flex items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${GRAD} text-white`}>
                <Bot className="h-4 w-4" />
              </span>
              <p className="text-[13px] font-semibold text-foreground">{displayName} from MernCrest</p>
            </div>
            <p className="text-[13px] leading-snug text-stitch-muted">
              Hi! I&apos;m Aira. Ask me anything about our services, pricing, or support.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            {...panelMotion}
            className="flex h-[580px] w-[min(100vw-2rem,376px)] flex-col overflow-hidden rounded-3xl border border-stitch-outline bg-stitch-surface shadow-[var(--stitch-card-shadow)]"
          >
            {tab === "home" && (
              <div className="flex h-full flex-col">
                <div className={`flex items-start justify-between px-6 pb-12 pt-5 text-white ${GRAD}`}>
                  <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    <span className="font-display text-xl font-bold tracking-tight">MernCrest</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat"
                    className="text-white/80 transition hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="-mt-6 flex-1 space-y-4 overflow-y-auto bg-stitch-bg px-5 pb-5">
                  <div className="rounded-2xl border border-stitch-outline bg-stitch-surface p-5 shadow-sm">
                    <h2 className="font-display text-base font-semibold text-foreground">Hello there!</h2>
                    <p className="mt-1 text-sm text-stitch-muted">
                      Meet Aira — your MernCrest AI assistant. Ask questions, get help, or connect with our team.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl border border-stitch-outline bg-stitch-surface p-4 shadow-sm">
                    <span className={`relative flex h-12 w-12 items-center justify-center rounded-full ${GRAD} text-white`}>
                      <Bot className="h-5 w-5" />
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-stitch-surface ${
                          handlerType === "AGENT" && !agentOnline ? "bg-slate-400" : "bg-emerald-500"
                        }`}
                      />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="text-xs text-stitch-muted">{displayRole}</p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => setTab("chat")}
                    whileHover={reduceMotion ? undefined : { scale: 1.02, y: -1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-[0_8px_24px_-4px_rgba(244,63,94,0.5)] transition hover:opacity-90 ${GRAD}`}
                  >
                    {phase === "chat" ? "Continue with Aira" : "Chat with Aira"}
                    <Send className="h-4 w-4" />
                  </motion.button>

                  <div className="rounded-2xl border border-stitch-outline bg-stitch-surface p-2 shadow-sm">
                    <Link
                      href="/knowledge-base"
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-foreground transition hover:bg-stitch-bg"
                    >
                      Browse the Knowledge Base
                      <ChevronLeft className="h-4 w-4 rotate-180 text-stitch-muted" />
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-foreground transition hover:bg-stitch-bg"
                    >
                      Contact sales &amp; support
                      <ChevronLeft className="h-4 w-4 rotate-180 text-stitch-muted" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {tab === "chat" && (
              <div className="flex h-full flex-col">
                    <div className={`z-20 flex items-center justify-between px-4 py-3 text-white shadow-md ${GRAD}`}>
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/20 bg-white/15">
                          <Bot className="h-4 w-4" />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-rose-600 ${
                              handlerType === "AGENT" && !agentOnline ? "bg-slate-300" : "bg-emerald-400"
                            }`}
                          />
                        </span>
                        <div>
                          <p className="font-display text-sm font-bold leading-none">
                            {displayName}
                            {handlerType !== "AGENT" ? (
                              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-medium tracking-wide">
                                AI
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[10px] text-white/75">
                            {typingVisible
                              ? `${displayName} is typing...`
                              : handlerType === "AGENT"
                                ? agentOnline
                                  ? "Online"
                                  : "Away"
                                : "Usually replies in seconds"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!chatClosed && messages.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => void endChat()}
                            disabled={endingChat || busy}
                            className="rounded-lg px-2 py-1 text-[11px] font-medium text-white/90 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                          >
                            {endingChat ? "Ending…" : "End chat"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          aria-label="Close chat"
                          className="text-white/80 transition hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative min-h-0 flex-1">
                      <div
                        ref={scrollerRef}
                        className="h-full space-y-4 overflow-y-auto bg-stitch-bg px-4 py-4"
                      >
                        <div className="flex justify-center">
                          <span className="rounded-full border border-stitch-outline bg-stitch-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-stitch-muted">
                            Today
                          </span>
                        </div>

                        <div className="flex max-w-[85%] items-end gap-2">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${GRAD} text-white`}>
                            <Bot className="h-3 w-3" />
                          </span>
                          <div className="rounded-2xl rounded-bl-none border border-stitch-outline bg-stitch-surface px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
                            <ChatMessageBody role="AI" body={greeting} linkClassName="text-red-600 underline underline-offset-2 hover:opacity-80" />
                          </div>
                        </div>

                        {messages.map((m, idx) => {
                          const isUser = m.role === "USER";
                          const isSystem = m.role === "SYSTEM";
                          if (isSystem) {
                            return (
                              <motion.div
                                key={m.id}
                                initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="mx-auto max-w-[92%] rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700"
                              >
                                <ChatMessageBody
                                  role={m.role}
                                  body={m.body}
                                  linkClassName="text-amber-800 underline underline-offset-2 hover:opacity-80"
                                />
                              </motion.div>
                            );
                          }
                          return (
                            <motion.div
                              key={m.id}
                              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay: Math.min(idx * 0.02, 0.12) }}
                              className={`flex ${isUser ? "justify-end" : "max-w-[85%] items-end gap-2"}`}
                            >
                              {!isUser && (
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm ${GRAD} text-white`}>
                                  <Bot className="h-3 w-3" />
                                </span>
                              )}
                              <div className="flex max-w-[85%] flex-col items-end gap-0.5">
                                <div
                                  className={`px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                                    isUser
                                      ? `rounded-2xl rounded-br-none text-white ${GRAD}`
                                      : "rounded-2xl rounded-bl-none border border-stitch-outline bg-stitch-surface text-foreground"
                                  }`}
                                >
                                  <ChatMessageBody
                                  role={m.role}
                                  body={m.body}
                                  linkClassName={
                                    isUser
                                      ? "text-white/90 underline underline-offset-2 hover:opacity-80"
                                      : "text-red-600 underline underline-offset-2 hover:opacity-80"
                                  }
                                />
                                </div>
                                {isUser ? (
                                  <span className="flex items-center gap-0.5 pr-1 text-[10px] text-stitch-muted">
                                    {m.delivery === "sending" ? (
                                      <span className="animate-pulse">Sending...</span>
                                    ) : m.delivery === "read" ? (
                                      <>
                                        <CheckCheck className="h-3 w-3 text-red-500" />
                                        <span>Read</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3" />
                                        <span>Sent</span>
                                      </>
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            </motion.div>
                          );
                        })}

                        {typingVisible && (
                          <div
                            className="flex max-w-[85%] items-end gap-2"
                            aria-live="polite"
                            aria-label={displayName + " is typing"}
                          >
                            <span
                              className={
                                "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
                                GRAD +
                                " text-white shadow-sm"
                              }
                            >
                              <Bot className="h-3.5 w-3.5" />
                            </span>
                            <div className="mc-chat-typing-bubble">
                              <span className="mc-chat-typing-dot" />
                              <span className="mc-chat-typing-dot" />
                              <span className="mc-chat-typing-dot" />
                            </div>
                          </div>
                        )}

                        {messages.length === 0 && !busy && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {QUICK_REPLIES.map((q) => (
                              <motion.button
                                key={q}
                                type="button"
                                whileHover={reduceMotion ? undefined : { scale: 1.04, y: -1 }}
                                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                                onClick={() => void sendText(q)}
                                className="rounded-full border border-stitch-outline bg-stitch-surface px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition duration-200 ease-out hover:bg-red-50 hover:shadow-md"
                              >
                                {q}
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {handoff && (
                          <div className="flex items-center gap-2 rounded-xl border border-stitch-outline bg-stitch-surface px-3 py-2.5 text-xs text-foreground">
                            <Headphones className="h-4 w-4 shrink-0 text-red-600" />
                            <span>
                              Connected to our support team.
                              {ticketNumber ? (
                                <>
                                  {" "}
                                  Ticket <span className="font-semibold">#{ticketNumber}</span> created.
                                </>
                              ) : null}
                            </span>
                          </div>
                        )}

                        <div ref={bottomRef} />
                      </div>

                      {showJump ? (
                        <button
                          type="button"
                          onClick={jumpDown}
                          className={`absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-[12px] font-medium text-white shadow-md transition duration-200 ease-out ${GRAD}`}
                        >
                          New messages
                        </button>
                      ) : null}
                    </div>

                    <div className="border-t border-stitch-outline bg-stitch-surface">
                      {chatClosed && csatRequested && !csatSubmitted ? (
                        <div className="px-4 py-4 text-center">
                          <p className="mb-2 text-sm font-medium text-foreground">
                            How was your chat experience? (optional)
                          </p>
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                disabled={csatBusy}
                                onClick={() => void submitCsat(n)}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-stitch-outline text-lg transition hover:border-red-500 hover:bg-red-50 disabled:opacity-50"
                                aria-label={`Rate ${n} stars`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={skipCsat}
                            className="mt-3 text-[11px] text-stitch-muted underline hover:text-foreground"
                          >
                            Skip — start a new chat
                          </button>
                        </div>
                      ) : chatClosed ? (
                        <div className="px-4 py-3 text-center">
                          <p className="text-xs text-stitch-muted">
                            {csatSubmitted
                              ? "Thank you for your feedback!"
                              : "This chat has ended."}
                          </p>
                          <button
                            type="button"
                            onClick={startNewChat}
                            className={`mt-2 rounded-xl px-4 py-2 text-xs font-semibold text-white ${GRAD}`}
                          >
                            Start new chat
                          </button>
                        </div>
                      ) : (
                        <>
                      {(uploading || uploadError) && (
                        <div className="px-4 pt-2 text-[11px]">
                          {uploading ? (
                            <span className="flex items-center gap-1.5 text-stitch-muted">
                              <ShieldCheck className="h-3 w-3 text-red-600" /> Scanning file for security...
                            </span>
                          ) : (
                            <span className="text-rose-500">{uploadError}</span>
                          )}
                        </div>
                      )}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void sendText(input);
                        }}
                        className="flex items-center gap-2 px-3 py-2.5"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                          onChange={onPickFile}
                        />
                        <motion.button
                          type="button"
                          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          title="Attach a file (JPG, PNG or PDF - scanned for security)"
                          aria-label="Attach a file"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stitch-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                          ) : (
                            <Plus className="h-5 w-5" />
                          )}
                        </motion.button>
                        <input
                          ref={inputRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={`Message ${displayName}...`}
                          disabled={busy}
                          className="h-10 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-stitch-muted"
                        />
                        <motion.button
                          type="submit"
                          disabled={busy || !input.trim()}
                          aria-label="Send message"
                          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-[0_8px_24px_-4px_rgba(244,63,94,0.5)] transition duration-200 ease-out hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${GRAD}`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </motion.button>
                      </form>
                        </>
                      )}
                    </div>
              </div>
            )}

            <div className="grid grid-cols-2 border-t border-stitch-outline bg-stitch-surface">
              {(
                [
                  { id: "home" as Tab, label: "Home", icon: Home },
                  { id: "chat" as Tab, label: "Chat", icon: MessageCircle },
                ]
              ).map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                      active ? "text-red-600" : "text-stitch-muted hover:text-foreground"
                    }`}
                  >
                    {active && <span className={`absolute inset-x-6 top-0 h-0.5 rounded-full ${GRAD}`} />}
                    <Icon className="h-5 w-5" />
                    {label}
                    {id === "chat" && unread > 0 ? (
                      <span className="absolute right-[28%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex h-[72px] w-[72px] items-center justify-center">
        {!open && (
          <>
            <span className="mc-chat-wave" aria-hidden />
            <span className="mc-chat-wave" aria-hidden />
            <span className="mc-chat-wave" aria-hidden />
          </>
        )}

        <motion.button
          type="button"
          onClick={() => {
            setTapRipple((n) => n + 1);
            setOpen((v) => !v);
          }}
          aria-label={open ? "Close chat" : "Open chat with Aira"}
          aria-describedby={unread > 0 && !open ? "mc-chat-unread" : undefined}
          className={`group relative z-[1] flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full text-white shadow-[0_12px_40px_-6px_rgba(244,63,94,0.55)] ${GRAD}`}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          {tapRipple > 0 ? <span key={tapRipple} className="mc-chat-tap-ripple" aria-hidden /> : null}

          <AnimatePresence>
            {!open && unread > 0 ? (
              <motion.span
                id="mc-chat-unread"
                key="unread"
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="absolute -right-0.5 -top-0.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[11px] font-semibold text-white shadow"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            ) : !open && teaser ? (
              <span className="absolute -right-0.5 -top-0.5 z-10 flex h-3.5 w-3.5">
                {!reduceMotion && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                )}
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-rose-500" />
              </span>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={reduceMotion ? false : { rotate: -90, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { rotate: 90, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={reduceMotion ? false : { rotate: 90, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { rotate: -90, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
