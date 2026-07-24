"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { ChatLauncherButton } from "@/components/chatbot/chat-launcher-button";
import { ChatPanel } from "@/components/chatbot/chat-panel";
import { ChatHeader } from "@/components/chatbot/chat-header";
import { MessageList, type ChatMsg } from "@/components/chatbot/message-list";
import { QuickReplyChips } from "@/components/chatbot/quick-reply-chips";
import { LeadCaptureForm, type LeadDraft } from "@/components/chatbot/lead-capture-form";
import { FileAttachmentPreview } from "@/components/chatbot/file-attachment-preview";
import { IconAttach, IconSend } from "@/components/chatbot/icons";

import { CHAT_QUICK_REPLIES } from "@/lib/support/chat-knowledge";

const SESSION_KEY = "mc-chat-session-id-v1";
const UNREAD_KEY = "mc-chat-unread-v1";
const LEAD_DONE_KEY = "mc-chat-lead-done-v1";
const QUICK = [...CHAT_QUICK_REPLIES];

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

export function AiChatWidget() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [handlerType, setHandlerType] = useState<string>("AI");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [assistantName, setAssistantName] = useState("Aira");
  const [agentOnline, setAgentOnline] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [leadDone, setLeadDone] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);

  openRef.current = open;

  // Restore session id only (not full message cache) + lead flag
  useEffect(() => {
    const id = readSessionId();
    if (id) setSessionId(id);
    try {
      setLeadDone(sessionStorage.getItem(LEAD_DONE_KEY) === "1");
      setUnread(Number(sessionStorage.getItem(UNREAD_KEY) || 0) || 0);
    } catch {
      /* ignore */
    }
  }, []);

  // Reset stale UI state on locale/route change — re-fetch by session id
  useEffect(() => {
    setMessages([]);
  }, [pathname, locale]);

  // visualViewport — avoid iOS keyboard overlap
  useEffect(() => {
    if (!open || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const sync = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
    };
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    sync();
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, [open]);

  const loadConversation = useCallback(async () => {
    const res = await fetch("/api/chat/conversations");
    const data = await res.json();
    if (data.sessionId) {
      setSessionId(data.sessionId);
      writeSessionId(data.sessionId);
      setMessages(data.messages || []);
      setHandlerType(data.handlerType || "AI");
      setAgentName(data.agent?.displayName || null);
      setAgentOnline(Boolean(data.agent?.online));
      if (data.assistantName) setAssistantName(data.assistantName);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    try {
      sessionStorage.setItem(UNREAD_KEY, "0");
    } catch {
      /* ignore */
    }
    loadConversation().catch(() => undefined);
    const t = setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(t);
  }, [open, loadConversation]);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        channel: "WEB",
        pageContext: pathname,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setSessionId(data.sessionId);
    writeSessionId(data.sessionId);
    setMessages(data.messages || []);
    setHandlerType(data.handlerType || "AI");
    setAgentName(data.agent?.displayName || null);
    if (data.assistantName) setAssistantName(data.assistantName);
    return data.sessionId as string;
  }

  async function sendMessage(text: string) {
    const body = text.trim();
    if (!body && !attachmentUrl) return;
    setBusy(true);
    setTyping(true);
    try {
      const id = await ensureSession();
      const clientMessageId = crypto.randomUUID();
      // Optimistic user bubble — keep input focus
      const optimistic: ChatMsg = {
        id: `tmp-${clientMessageId}`,
        role: "USER",
        body: body || "(attachment)",
        attachmentUrl,
      };
      setMessages((m) => [...m, optimistic]);
      setInput("");
      requestAnimationFrame(() => inputRef.current?.focus());

      const res = await fetch(`/api/chat/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: body || "Please review the attachment.",
          clientMessageId,
          attachmentUrl: attachmentUrl || undefined,
          pageContext: pathname,
          visitorName: visitorName || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        if (data.handlerType) setHandlerType(data.handlerType);
        if (!openRef.current && data.latest && data.latest.role !== "USER") {
          setUnread((u) => {
            const n = u + 1;
            try {
              sessionStorage.setItem(UNREAD_KEY, String(n));
            } catch {
              /* ignore */
            }
            return n;
          });
        }
      }
      setAttachmentUrl(null);
      setUploadName(null);
    } finally {
      setBusy(false);
      setTyping(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function onLeadComplete(draft: LeadDraft) {
    setVisitorName(draft.name);
    setLeadDone(true);
    try {
      sessionStorage.setItem(LEAD_DONE_KEY, "1");
    } catch {
      /* ignore */
    }
    const summary = `Hi, I'm ${draft.name}. Email: ${draft.email}. Phone: ${draft.phone}. Company: ${draft.company || "—"}. Need: ${draft.requirement}`;
    await sendMessage(summary);
  }

  async function onFile(file: File) {
    setUploadError(null);
    setUploadName(file.name);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        setUploadName(null);
        return;
      }
      setAttachmentUrl(data.url);
    } catch {
      setUploadError("Upload failed");
      setUploadName(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[55] flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      <ChatPanel open={open} keyboardOffset={keyboardOffset}>
        <ChatHeader
          handlerType={handlerType}
          agentName={agentName}
          assistantName={assistantName}
          online={agentOnline}
          typing={typing}
          onClose={() => setOpen(false)}
          onBack={() => setOpen(false)}
        />
        <MessageList messages={messages} typing={typing} />
        {!leadDone ? (
          <LeadCaptureForm onComplete={onLeadComplete} />
        ) : (
          <>
            {messages.length < 4 ? (
              <QuickReplyChips
                items={QUICK}
                disabled={busy}
                onSelect={(v) => sendMessage(v)}
              />
            ) : null}
            <FileAttachmentPreview
              name={uploadName}
              uploading={uploading}
              error={uploadError}
              onClear={() => {
                setUploadName(null);
                setAttachmentUrl(null);
                setUploadError(null);
              }}
            />
            <form
              className="flex items-center gap-2 border-t border-[#e8eef5] bg-white px-3 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                aria-label="Attach file"
                className="rounded-full p-2 text-[#105691] transition duration-200 ease-out hover:bg-[#EEF5FB]"
                onClick={() => fileRef.current?.click()}
              >
                <IconAttach size={20} />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="min-w-0 flex-1 rounded-full border border-[#c5dced] bg-[#EEF5FB] px-4 py-2.5 text-[14px] outline-none focus:border-[#1873A8] focus:bg-white"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || (!input.trim() && !attachmentUrl)}
                aria-label="Send"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition duration-200 ease-out disabled:opacity-40"
                style={{ background: "#F45627" }}
              >
                <IconSend size={18} />
              </button>
            </form>
          </>
        )}
      </ChatPanel>

      <ChatLauncherButton
        open={open}
        unread={unread}
        onClick={() => setOpen((v) => !v)}
      />
    </div>
  );
}
