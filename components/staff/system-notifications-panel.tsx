"use client";

import { useCallback, useEffect, useState } from "react";

export function SystemNotificationsPanel() {
  const [tab, setTab] = useState<"inbox" | "prefs" | "announce" | "analytics">("inbox");
  const [notifications, setNotifications] = useState<
    { id: string; title: string; body: string; readAt: string | null; createdAt: string }[]
  >([]);
  const [prefs, setPrefs] = useState({
    email: true,
    whatsapp: true,
    sms: false,
    push: true,
    inApp: true,
    dndStart: "",
    dndEnd: "",
  });
  const [analytics, setAnalytics] = useState<{
    sent: number;
    openRate: number;
    clickRate: number;
  } | null>(null);
  const [announce, setAnnounce] = useState({ title: "", body: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [i, p, a] = await Promise.all([
        fetch("/api/staff/notifications"),
        fetch("/api/staff/notifications?view=prefs"),
        fetch("/api/staff/notifications?view=analytics"),
      ]);
      const id = await i.json();
      const pd = await p.json();
      const ad = await a.json();
      if (!i.ok) throw new Error(id.error || "Failed");
      setNotifications(id.notifications ?? []);
      if (p.ok && pd.prefs) {
        setPrefs({
          email: pd.prefs.email ?? true,
          whatsapp: pd.prefs.whatsapp ?? true,
          sms: pd.prefs.sms ?? false,
          push: pd.prefs.push ?? true,
          inApp: pd.prefs.inApp ?? true,
          dndStart: pd.prefs.dndStart || "",
          dndEnd: pd.prefs.dndEnd || "",
        });
      }
      if (a.ok) setAnalytics(ad.analytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/staff/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "prefs",
        ...prefs,
        dndStart: prefs.dndStart || null,
        dndEnd: prefs.dndEnd || null,
      }),
    });
    await load();
  }

  async function sendAnnounce(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/staff/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "broadcast", ...announce }),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Failed");
      return;
    }
    setAnnounce({ title: "", body: "" });
    await fetch("/api/staff/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dispatch" }),
    });
    await load();
  }

  return (
    <>
      <h1 className="rlk-welcome">Notification center</h1>
      <p className="text-sm text-[#666] mb-4">
        Inbox · prefs / DND · broadcasts · WhatsApp · open/click analytics
      </p>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {(["inbox", "prefs", "announce", "analytics"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={
              tab === t
                ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
            }
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          className="rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2 ml-auto"
          onClick={async () => {
            await fetch("/api/staff/notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ markAll: true }),
            });
            await load();
          }}
        >
          Mark all read
        </button>
      </div>

      {tab === "inbox" && (
        <section className="rlk-section rlk-section-accent-teal">
          <div className="rlk-section-head">
            <h2>History</h2>
          </div>
          <div className="rlk-section-body">
            {notifications.length === 0 ? (
              <p className="rlk-empty">No notifications.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="rlk-row !flex-col !items-stretch !gap-0.5">
                  <p className="font-medium text-[13px]">
                    {n.title}
                    {!n.readAt ? <span className="rlk-badge rlk-badge-open ml-2">new</span> : null}
                  </p>
                  <p className="text-xs text-[#666]">{n.body}</p>
                  <p className="text-[11px] text-[#999]">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "prefs" && (
        <section className="rlk-section rlk-section-accent-orange max-w-lg">
          <div className="rlk-section-head">
            <h2>Preferences &amp; DND</h2>
          </div>
          <div className="rlk-section-body">
            <form onSubmit={savePrefs} className="space-y-2">
              {(
                [
                  ["email", "Email"],
                  ["whatsapp", "WhatsApp"],
                  ["sms", "SMS (critical)"],
                  ["push", "Push"],
                  ["inApp", "In-app"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rlk-input"
                  placeholder="DND start HH:mm"
                  value={prefs.dndStart}
                  onChange={(e) => setPrefs({ ...prefs, dndStart: e.target.value })}
                />
                <input
                  className="rlk-input"
                  placeholder="DND end HH:mm"
                  value={prefs.dndEnd}
                  onChange={(e) => setPrefs({ ...prefs, dndEnd: e.target.value })}
                />
              </div>
              <button type="submit" className="rlk-btn-green !w-auto !mt-2 !px-4">
                Save prefs
              </button>
            </form>
          </div>
        </section>
      )}

      {tab === "announce" && (
        <section className="rlk-section rlk-section-accent-green max-w-lg">
          <div className="rlk-section-head">
            <h2>Broadcast / announcement</h2>
          </div>
          <div className="rlk-section-body">
            <form onSubmit={sendAnnounce} className="space-y-2">
              <input
                className="rlk-input"
                placeholder="Title"
                required
                value={announce.title}
                onChange={(e) => setAnnounce({ ...announce, title: e.target.value })}
              />
              <textarea
                className="rlk-input min-h-[80px]"
                placeholder="Message"
                required
                value={announce.body}
                onChange={(e) => setAnnounce({ ...announce, body: e.target.value })}
              />
              <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4">
                Send to staff
              </button>
            </form>
          </div>
        </section>
      )}

      {tab === "analytics" && analytics && (
        <div className="rlk-stats">
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.sent}</div>
            <div className="rlk-stat-label">Sent (30d)</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.openRate}%</div>
            <div className="rlk-stat-label">Open rate</div>
          </div>
          <div className="rlk-stat">
            <div className="rlk-stat-num">{analytics.clickRate}%</div>
            <div className="rlk-stat-label">Click rate</div>
          </div>
        </div>
      )}
    </>
  );
}
