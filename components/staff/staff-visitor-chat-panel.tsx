"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentPresenceToggle } from "@/components/staff/agent-presence-toggle";
import { SmartSupportContextPanel } from "@/components/staff/smart-support-context-panel";
import { MessageList } from "@/components/chatbot/message-list";
import { useChatSse } from "@/hooks/use-chat-sse";
import {
  IconBack,
  IconBot,
  IconSend,
  IconStatusDot,
} from "@/components/chatbot/icons";
import {
  ArrowRightLeft,
  Sparkles,
  Ticket,
  UserPlus,
  XCircle,
} from "lucide-react";

type Lead = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: string;
} | null;

type Conversation = {
  id: string;
  status: string;
  handlerType: string;
  channel: string;
  handoffRequested: boolean;
  visitorId: string;
  lead: Lead;
  agent: { id: string; displayName: string } | null;
  lastMessage: { id: string; role: string; body: string; createdAt: string } | null;
  updatedAt: string;
  isKnownCustomer?: boolean;
  customerCode?: string | null;
};

type Msg = {
  id: string;
  role: string;
  body: string;
  createdAt: string;
};

type QuickChip = { id: string; label: string; body: string };

const BUILTIN_QUICK: QuickChip[] = [
  { id: "hi", label: "Greeting", body: "Hi! Thanks for contacting MernCrest. How can I help you today?" },
  { id: "wait", label: "One moment", body: "Thanks — give me one moment while I check that for you." },
  { id: "pricing", label: "Pricing", body: "Happy to help with pricing. Which service do you need (software, AI, cloud, hosting, or domains)?" },
  { id: "call", label: "Offer call", body: "Would a short call work? Share a good time and number, and I'll arrange it." },
  { id: "details", label: "Need details", body: "Could you share a bit more detail about your requirement so I can guide you accurately?" },
  { id: "thanks", label: "Thanks", body: "Thank you! We'll follow up shortly. Feel free to message here anytime." },
];

/** Staff live chat — Google Stitch full-width inbox */
export function StaffVisitorChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [quickChips, setQuickChips] = useState<QuickChip[]>(BUILTIN_QUICK);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState("");
  const [agents, setAgents] = useState<{ id: string; displayName: string; status: string }[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const autoDraftRef = useRef("");
  const lastUserMsgIdRef = useRef("");
  const draftEditedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/chat/inbox");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load inbox");
      setConversations(data.conversations ?? []);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoadingList(false);
    }
  }, [showToast]);

  const loadMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/conversations/${id}/messages`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load messages");
    setMessages(data.messages ?? []);
  }, []);

  const loadQuickTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/message-templates?approved=1");
      if (!res.ok) return;
      const data = await res.json();
      const fromDb: QuickChip[] = (data.templates || []).slice(0, 12).map(
        (t: { id: string; title: string; content: string }) => ({
          id: t.id,
          label: t.title.slice(0, 28),
          body: t.content,
        })
      );
      setQuickChips([...BUILTIN_QUICK, ...fromDb]);
    } catch {
      setQuickChips(BUILTIN_QUICK);
    }
  }, []);

  const loadSuggestions = useCallback(async (sessionId: string, force = false) => {
    setSuggestLoading(true);
    try {
      const res = await fetch(
        `/api/staff/chat/suggest?sessionId=${encodeURIComponent(sessionId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suggest failed");
      const replies: string[] = data.replies || [];
      setSuggestions(replies);
      if (replies[0]) {
        setDraft((current) => {
          if (
            force ||
            !draftEditedRef.current ||
            !current.trim() ||
            current === autoDraftRef.current
          ) {
            autoDraftRef.current = replies[0];
            draftEditedRef.current = false;
            return replies[0];
          }
          return current;
        });
      }
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
    loadQuickTemplates();
    fetch("/api/staff/presence")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .catch(() => undefined);
    const t = setInterval(loadInbox, 30000);
    return () => clearInterval(t);
  }, [loadInbox, loadQuickTemplates]);

  useChatSse("/api/staff/chat/inbox/stream", () => {
    loadInbox();
  });

  useChatSse(
    selectedId ? `/api/chat/conversations/${selectedId}/stream` : null,
    () => {
      if (selectedId) loadMessages(selectedId).catch(() => undefined);
    },
    Boolean(selectedId)
  );

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setSuggestions([]);
      setDraft("");
      autoDraftRef.current = "";
      draftEditedRef.current = false;
      lastUserMsgIdRef.current = "";
      return;
    }
    draftEditedRef.current = false;
    loadMessages(selectedId).catch((e) =>
      showToast("error", e instanceof Error ? e.message : "Failed")
    );
    const t = setInterval(() => {
      loadMessages(selectedId).catch(() => undefined);
    }, 30000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages, showToast]);

  useEffect(() => {
    if (!selectedId || messages.length === 0) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "USER");
    if (!lastUser || lastUser.id === lastUserMsgIdRef.current) return;
    lastUserMsgIdRef.current = lastUser.id;
    loadSuggestions(selectedId, true).catch(() => undefined);
  }, [messages, selectedId, loadSuggestions]);

  async function sendText(raw: string) {
    if (!selectedId || !raw.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/chat/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: raw.trim(), asAgent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setDraft("");
      autoDraftRef.current = "";
      draftEditedRef.current = false;
      setSuggestions([]);
      setMessages(data.messages ?? []);
      await loadInbox();
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendText(draft);
  }

  async function quickSend(body: string) {
    setDraft(body);
    autoDraftRef.current = body;
    draftEditedRef.current = false;
    await sendText(body);
  }

  async function chatAction(
    action: "to_ticket" | "to_lead" | "transfer" | "close",
    extra?: { targetAgentId?: string; subject?: string }
  ) {
    if (!selectedId || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/chat/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedId, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (action === "close") setSelectedId(null);
      if (action === "to_ticket" && data.ticket?.ticketNumber) {
        showToast("success", `Ticket ${data.ticket.ticketNumber} created`);
      }
      if (action === "to_lead" && data.lead?.fullName) {
        showToast("success", `Lead created: ${data.lead.fullName}`);
      }
      if (action === "close") {
        showToast("success", "Chat closed — visitor will be asked to rate support");
      }
      setShowTransfer(false);
      await loadInbox();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const selected = conversations.find((c) => c.id === selectedId) || null;
  const visitorLabel =
    selected?.lead?.fullName ||
    (selected ? `Visitor ${selected.visitorId.slice(-6)}` : "Select a chat");

  const waitingCount = conversations.filter(
    (c) => c.lastMessage?.role === "USER" || c.handoffRequested
  ).length;

  const activeChats = conversations.filter((c) => c.status !== "CLOSED").length;
  const resolvedToday = conversations.filter((c) => {
    if (c.status !== "CLOSED") return false;
    const d = new Date(c.updatedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const filtered = conversations.filter((c) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      (c.lead?.fullName || "").toLowerCase().includes(q) ||
      (c.lead?.email || "").toLowerCase().includes(q) ||
      (c.lastMessage?.body || "").toLowerCase().includes(q)
    );
  });

  const isAiHandler = selected?.handlerType !== "AGENT";
  const statusLabel = selected
    ? selected.handlerType === "AGENT"
      ? "You are replying"
      : selected.handoffRequested
        ? "Handoff requested"
        : "Aira is active"
    : "";

  return (
    <div>
      <div className="stitch-breadcrumb px-4 pt-4">Dashboard &gt; Live Chat</div>
      <div className="stitch-stat-grid !px-4 !mb-0 !grid-cols-4">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Active Chats</div>
          <div className="stitch-stat-num">{activeChats}</div>
        </div>
        <div className="stitch-stat-card border-[var(--stitch-warning)]">
          <div className="stitch-stat-label">Waiting</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-warning)" }}>
            {waitingCount}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Resolved Today</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-success)" }}>
            {resolvedToday}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Inbox Total</div>
          <div className="stitch-stat-num">{conversations.length}</div>
        </div>
      </div>

    <div className="side-chat-agent">
      <div className="side-chat-toolbar">
        <div>
          <h1>Live Chat</h1>
          <p>
            Smart support inbox · {conversations.length} conversation
            {conversations.length === 1 ? "" : "s"}
            {waitingCount > 0 ? ` · ${waitingCount} waiting` : ""}
          </p>
        </div>
        <div className="side-chat-toolbar-actions">
          <AgentPresenceToggle />
          <button type="button" className="side-chat-refresh" onClick={() => loadInbox()}>
            Refresh
          </button>
        </div>
      </div>

      <div className={`side-chat-body ${selectedId ? "has-selected" : ""}`}>
        <aside className="side-chat-inbox">
          <div className="side-chat-inbox-search">
            <input
              placeholder="Search chats…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="side-chat-inbox-list">
            {loadingList ? (
              <p className="side-chat-inbox-empty">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="side-chat-inbox-empty">No visitor chats yet.</p>
            ) : (
              filtered.map((c) => {
                const name = c.lead?.fullName || `Visitor …${c.visitorId.slice(-6)}`;
                const active = c.id === selectedId;
                const needsReply = c.lastMessage?.role === "USER" || c.handoffRequested;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`side-chat-inbox-item ${active ? "active" : ""}`}
                  >
                    <span
                      className={`side-chat-inbox-avatar ${needsReply ? "alert" : ""}`}
                    >
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="side-chat-inbox-meta">
                      <span className="side-chat-inbox-name">
                        <span className="truncate">{name}</span>
                        <span className="side-chat-inbox-time">
                          {new Date(c.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      <span className="side-chat-inbox-preview">
                        {c.lastMessage?.body || "New chat"}
                        {c.isKnownCustomer && c.customerCode ? (
                          <span className="side-chat-inbox-known"> · {c.customerCode}</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="side-chat-main">
          {!selectedId ? (
            <div className="side-chat-empty">
              <div className="side-chat-empty-icon" aria-hidden>
                <IconBot size={32} />
              </div>
              <h2>Pick a conversation</h2>
              <p>Select a visitor from the inbox to view messages and reply in real time.</p>
            </div>
          ) : (
            <div className="side-chat-widget">
              <header className="side-chat-widget-header">
                <button
                  type="button"
                  className="side-chat-widget-header-back"
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to inbox"
                >
                  <IconBack size={20} />
                </button>
                <div
                  className={`side-chat-widget-avatar ${isAiHandler ? "ai" : "agent"}`}
                  aria-hidden
                >
                  {visitorLabel.slice(0, 2).toUpperCase()}
                </div>
                <div className="side-chat-widget-header-text">
                  <h2>{visitorLabel}</h2>
                  <p>
                    <IconStatusDot online={!isAiHandler} size={7} />
                    {statusLabel}
                    {selected?.isKnownCustomer && selected.customerCode ? (
                      <span className="side-chat-header-badge">{selected.customerCode}</span>
                    ) : null}
                  </p>
                </div>
                <div className="side-chat-header-actions">
                  <button
                    type="button"
                    className="side-chat-icon-btn"
                    disabled={busy}
                    onClick={() => chatAction("to_ticket")}
                    title="Create ticket"
                  >
                    <Ticket className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="side-chat-icon-btn"
                    disabled={busy}
                    onClick={() => chatAction("to_lead")}
                    title="Create lead"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`side-chat-icon-btn ${showTransfer ? "active" : ""}`}
                    disabled={busy}
                    onClick={() => setShowTransfer((s) => !s)}
                    title="Transfer chat"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="side-chat-icon-btn"
                    disabled={busy || suggestLoading}
                    onClick={() => loadSuggestions(selectedId, true)}
                    title="Generate AI draft"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="side-chat-icon-btn danger"
                    disabled={busy}
                    onClick={() => chatAction("close")}
                    title="Close chat"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {toast ? (
                <div className={`side-chat-toast ${toast.type}`}>{toast.text}</div>
              ) : null}

              {showTransfer && (
                <div className="side-chat-transfer-bar">
                  <span className="side-chat-transfer-label">Transfer to</span>
                  {agents
                    .filter((a) => a.id !== selected?.agent?.id)
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        disabled={busy}
                        onClick={() => chatAction("transfer", { targetAgentId: a.id })}
                        className="side-chat-quick-chip"
                      >
                        {a.displayName}
                      </button>
                    ))}
                  <button
                    type="button"
                    className="side-chat-transfer-cancel"
                    onClick={() => setShowTransfer(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="side-chat-messages">
                <MessageList messages={messages} variant="stitch-staff" />
              </div>

              <div className="side-chat-footer">
                {suggestions.length > 0 ? (
                  <div className="side-chat-footer-section">
                    <span className="side-chat-footer-label">
                      <Sparkles className="h-3 w-3" />
                      AI suggestions
                    </span>
                    <div className="side-chat-quick-row">
                      {suggestions.map((s, i) => (
                        <button
                          key={`ai-${i}`}
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setDraft(s);
                            autoDraftRef.current = s;
                            draftEditedRef.current = false;
                            inputRef.current?.focus();
                          }}
                          className={`side-chat-quick-chip ai ${draft === s ? "selected" : ""}`}
                          title={s}
                        >
                          {s.slice(0, 72)}
                          {s.length > 72 ? "…" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="side-chat-footer-section">
                  <span className="side-chat-footer-label">Quick replies</span>
                  <div className="side-chat-quick-row">
                    {quickChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        disabled={busy}
                        onClick={() => quickSend(chip.body)}
                        className="side-chat-quick-chip"
                        title={chip.body}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form className="side-chat-composer" onSubmit={onSubmit}>
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      draftEditedRef.current = e.target.value !== autoDraftRef.current;
                    }}
                    placeholder="Type your reply…"
                    disabled={busy}
                  />
                  <button
                    type="submit"
                    className="side-chat-send"
                    disabled={busy || !draft.trim()}
                    aria-label="Send"
                  >
                    <IconSend size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <SmartSupportContextPanel
          sessionId={selectedId}
          busy={busy}
          onInsertReply={(text) => {
            setDraft(text);
            autoDraftRef.current = text;
            draftEditedRef.current = false;
            inputRef.current?.focus();
          }}
          onCreateTicket={() => chatAction("to_ticket")}
          onRenewalSent={() => {
            if (selectedId) loadMessages(selectedId).catch(() => undefined);
          }}
        />
      </div>
    </div>
    </div>
  );
}
