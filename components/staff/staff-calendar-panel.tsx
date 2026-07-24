"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Video } from "lucide-react";

type CalEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: string;
  meetingUrl?: string | null;
  room?: { name: string } | null;
};

export function StaffCalendarPanel() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [holidays, setHolidays] = useState<{ id: string; name: string; date: string }[]>([]);
  const [leaves, setLeaves] = useState<
    { id: string; leaveType: string; startDate: string; endDate: string; user?: { fullName: string } }[]
  >([]);
  const [availability, setAvailability] = useState<
    { userId: string; fullName: string; available: boolean; onLeave: boolean; busyCount: number }[]
  >([]);
  const [rooms, setRooms] = useState<{ id: string; name: string; free?: boolean }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    startsAt: "",
    endsAt: "",
    kind: "MEETING",
    meetingUrl: "",
    roomId: "",
    shared: true,
    recurrence: "NONE",
  });
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"mine" | "team">("mine");

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/staff/calendar?view=${tab === "team" ? "team" : "mine"}`),
      fetch("/api/staff/calendar?view=availability"),
      fetch("/api/staff/calendar?view=rooms"),
    ])
      .then(async ([eRes, aRes, rRes]) => {
        const e = await eRes.json();
        const a = await aRes.json();
        const r = await rRes.json();
        if (!eRes.ok) throw new Error(e.error || "Failed");
        setEvents(e.events ?? []);
        setHolidays(e.holidays ?? []);
        setLeaves(e.leaves ?? []);
        if (aRes.ok) setAvailability(a.availability ?? []);
        if (rRes.ok) setRooms(r.rooms ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const todayEvents = events.filter((ev) => {
      const d = new Date(ev.startsAt);
      return d >= todayStart && d < todayEnd;
    }).length;

    const weekEvents = events.filter((ev) => {
      const d = new Date(ev.startsAt);
      return d >= todayStart && d < weekEnd;
    }).length;

    const upcomingHolidays = holidays.filter((h) => new Date(h.date) >= todayStart).length;
    const availableCount = availability.filter((u) => u.available && !u.onLeave).length;
    const teamPct =
      availability.length > 0 ? Math.round((availableCount / availability.length) * 100) : 0;

    return { todayEvents, weekEvents, upcomingHolidays, teamPct };
  }, [events, holidays, availability]);

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((ev) => new Date(ev.startsAt) >= new Date())
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .slice(0, 8),
    [events]
  );

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/staff/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        roomId: form.roomId || undefined,
        meetingUrl: form.meetingUrl || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setForm({
      title: "",
      startsAt: "",
      endsAt: "",
      kind: "MEETING",
      meetingUrl: "",
      roomId: "",
      shared: true,
      recurrence: "NONE",
    });
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Calendar</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Calendar & Meetings</h1>
          <p className="stitch-page-sub">
            Shared calendar, rooms, leave overlay, and team availability.
          </p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Schedule Meeting
        </button>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Today&apos;s Events</div>
          <div className="stitch-stat-num">{stats.todayEvents}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">This Week</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-primary)" }}>
            {stats.weekEvents}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Holidays</div>
          <div className="stitch-stat-num">{stats.upcomingHolidays}</div>
        </div>
        <div className="stitch-stat-card border-[var(--stitch-success)]">
          <div className="stitch-stat-label">Team Available</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-success)" }}>
            {stats.teamPct}%
          </div>
        </div>
      </div>

      <div className="stitch-tab-row mb-6">
        <button type="button" className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>
          My Calendar
        </button>
        <button type="button" className={tab === "team" ? "active" : ""} onClick={() => setTab("team")}>
          Team Availability
        </button>
      </div>

      {showForm ? (
        <section className="stitch-section-card mb-6">
          <div className="stitch-section-head">
            <h3>Schedule Meeting</h3>
          </div>
          <form onSubmit={create} className="stitch-section-body space-y-3">
            <input
              className="stitch-input w-full"
              placeholder="Meeting title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="datetime-local"
                className="stitch-input w-full"
                required
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
              <input
                type="datetime-local"
                className="stitch-input w-full"
                required
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
            <input
              className="stitch-input w-full"
              placeholder="Zoom / Google Meet URL"
              value={form.meetingUrl}
              onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className="stitch-select w-full"
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              >
                <option value="">No room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.free === false ? " (busy)" : ""}
                  </option>
                ))}
              </select>
              <select
                className="stitch-select w-full"
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              >
                <option value="NONE">No repeat</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.shared}
                onChange={(e) => setForm({ ...form, shared: e.target.checked })}
              />
              Shared with team
            </label>
            <div className="flex gap-2">
              <button type="submit" className="stitch-btn-primary-sm">
                Book Meeting
              </button>
              <button type="button" className="stitch-btn-sm" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === "team" ? (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Team Availability</h3>
          </div>
          <div className="stitch-section-body !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Meetings</th>
                </tr>
              </thead>
              <tbody>
                {availability.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-[var(--sp-muted)]">
                      No availability data.
                    </td>
                  </tr>
                ) : (
                  availability.map((u) => (
                    <tr key={u.userId}>
                      <td className="font-medium">{u.fullName}</td>
                      <td>
                        <span
                          className={
                            u.onLeave
                              ? "stitch-chip stitch-badge-pending"
                              : u.available
                                ? "stitch-chip stitch-badge-done"
                                : "stitch-chip stitch-badge-progress"
                          }
                        >
                          {u.onLeave ? "On leave" : u.available ? "Available" : "Busy"}
                        </span>
                      </td>
                      <td>{u.busyCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="stitch-dash-grid-2">
          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>
                <CalendarDays className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                Upcoming Events
              </h3>
            </div>
            <div className="stitch-section-body space-y-3">
              {upcoming.length === 0 ? (
                <p className="stitch-page-sub !mb-0">No upcoming events.</p>
              ) : (
                upcoming.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-lg border border-[var(--sp-outline)] p-3 bg-[var(--stitch-surface-low)]"
                  >
                    <p className="font-medium text-sm m-0">{ev.title}</p>
                    <p className="text-xs text-[var(--sp-muted)] mt-1 mb-2">
                      {new Date(ev.startsAt).toLocaleString()} · {ev.kind}
                      {ev.room ? ` · ${ev.room.name}` : ""}
                    </p>
                    {ev.meetingUrl ? (
                      <a
                        href={ev.meetingUrl}
                        className="stitch-btn-primary-sm !inline-flex"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join Meeting
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>Holidays & Leave Overlay</h3>
            </div>
            <div className="stitch-section-body space-y-2">
              {holidays.map((h) => (
                <div key={h.id} className="stitch-profile-row !py-2">
                  <span>{h.name}</span>
                  <span className="text-[var(--sp-muted)]">
                    {new Date(h.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {leaves.map((l) => (
                <div key={l.id} className="stitch-profile-row !py-2">
                  <span>
                    Leave · {l.user?.fullName || "You"} · {l.leaveType}
                  </span>
                  <span className="text-[var(--sp-muted)] text-xs">
                    {new Date(l.startDate).toLocaleDateString()} –{" "}
                    {new Date(l.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {holidays.length === 0 && leaves.length === 0 ? (
                <p className="stitch-page-sub !mb-0">No holidays or leave scheduled.</p>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
