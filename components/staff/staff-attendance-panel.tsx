"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, LogIn, LogOut } from "lucide-react";

type RecordRow = {
  id: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
};

type DayStatus = "present" | "absent" | "leave" | "holiday" | "weekend" | "future" | "none";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mapStatus(status: string): DayStatus {
  const s = status.toUpperCase();
  if (s === "ABSENT") return "absent";
  if (s === "LEAVE" || s === "ON_LEAVE") return "leave";
  if (["PRESENT", "LATE", "REMOTE", "HALF_DAY"].includes(s)) return "present";
  return "none";
}

export function StaffAttendancePanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [today, setToday] = useState<RecordRow | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/staff/attendance")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setToday(d.today);
        setRecords(d.records ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const monthRecords = useMemo(() => {
    const map = new Map<string, RecordRow>();
    for (const r of records) {
      const d = new Date(r.workDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        map.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, r);
      }
    }
    return map;
  }, [records, year, month]);

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let working = 0;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day === 0 || day === 6) continue;
      if (d > todayDate) continue;
      working++;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const rec = monthRecords.get(key);
      if (!rec) continue;
      const st = mapStatus(rec.status);
      if (st === "present") present++;
      else if (st === "absent") absent++;
      else if (st === "leave") leave++;
    }

    const pct = working ? Math.round((present / working) * 100) : 0;
    return { working, present, absent, leave, pct };
  }, [monthRecords, year, month]);

  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: { date: Date | null; status: DayStatus }[] = [];

    for (let i = 0; i < startPad; i++) days.push({ date: null, status: "none" });
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      const day = date.getDay();
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      let status: DayStatus = "none";
      if (day === 0 || day === 6) status = "weekend";
      else if (date > todayDate) status = "future";
      else {
        const rec = monthRecords.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        status = rec ? mapStatus(rec.status) : "none";
      }
      days.push({ date, status });
    }
    return days;
  }, [year, month, monthRecords]);

  async function punch(action: "IN" | "OUT") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const rows = [["Date", "Status", "Check In", "Check Out"]];
    for (const r of records) {
      const d = new Date(r.workDate);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      rows.push([
        d.toLocaleDateString(),
        r.status,
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "",
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "",
      ]);
    }
    const csv = rows.map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${year}-${month + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Attendance</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Attendance</h1>
          <p className="stitch-page-sub">Track your daily attendance and monthly summary.</p>
        </div>
        <div className="stitch-toolbar-actions">
          <select
            className="stitch-select"
            value={`${year}-${month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              setYear(y);
              setMonth(m);
            }}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              return (
                <option key={`${d.getFullYear()}-${d.getMonth()}`} value={`${d.getFullYear()}-${d.getMonth()}`}>
                  {monthLabel(d.getFullYear(), d.getMonth())}
                </option>
              );
            })}
          </select>
          <button type="button" className="stitch-btn-sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <div className="stitch-stat-grid stitch-stat-grid-5 mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Working Days</div>
          <div className="stitch-stat-num">{stats.working}</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Present Days</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-success)" }}>
            {stats.present}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Absent Days</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-danger)" }}>
            {stats.absent}
          </div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-label">Leave Days</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-warning)" }}>
            {stats.leave}
          </div>
        </div>
        <div className="stitch-stat-card border-[var(--stitch-primary)]">
          <div className="stitch-stat-label">Attendance %</div>
          <div className="stitch-stat-num" style={{ color: "var(--stitch-primary)" }}>
            {stats.pct}%
          </div>
        </div>
      </div>

      <section className="stitch-section-card mb-6">
        <div className="stitch-section-head">
          <h3>{monthLabel(year, month)}</h3>
          <div className="flex gap-2">
            <button type="button" className="stitch-btn-sm" onClick={() => shiftMonth(-1)}>
              Prev
            </button>
            <button type="button" className="stitch-btn-sm" onClick={() => shiftMonth(1)}>
              Next
            </button>
          </div>
        </div>
        <div className="stitch-section-body">
          <div className="stitch-cal-weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="stitch-cal-grid">
            {calendarDays.map((cell, i) => (
              <div
                key={i}
                className={`stitch-cal-cell${cell.date ? "" : " stitch-cal-empty"}${cell.date && sameDay(cell.date, now) ? " stitch-cal-today" : ""}`}
              >
                {cell.date ? (
                  <>
                    <span className="stitch-cal-day">{cell.date.getDate()}</span>
                    {cell.status !== "none" && cell.status !== "future" ? (
                      <span className={`stitch-cal-dot stitch-cal-dot-${cell.status}`} />
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
          <div className="stitch-cal-legend">
            <span><i className="stitch-cal-dot stitch-cal-dot-present" /> Present</span>
            <span><i className="stitch-cal-dot stitch-cal-dot-absent" /> Absent</span>
            <span><i className="stitch-cal-dot stitch-cal-dot-leave" /> Leave</span>
            <span><i className="stitch-cal-dot stitch-cal-dot-weekend" /> Holiday / Weekend</span>
          </div>
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Today&apos;s Attendance</h3>
        </div>
        <div className="stitch-section-body">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              className="stitch-btn-primary-sm"
              disabled={busy || Boolean(today?.checkIn)}
              onClick={() => punch("IN")}
            >
              <LogIn className="h-3.5 w-3.5" />
              Punch In
            </button>
            <button
              type="button"
              className="stitch-btn-sm"
              disabled={busy || !today?.checkIn || Boolean(today?.checkOut)}
              onClick={() => punch("OUT")}
            >
              <LogOut className="h-3.5 w-3.5" />
              Punch Out
            </button>
          </div>
          {today ? (
            <p className="stitch-page-sub !mb-0">
              Status: <strong>{today.status}</strong>
              {today.checkIn ? ` · In ${new Date(today.checkIn).toLocaleTimeString()}` : ""}
              {today.checkOut ? ` · Out ${new Date(today.checkOut).toLocaleTimeString()}` : ""}
            </p>
          ) : (
            <p className="stitch-page-sub !mb-0">No punch recorded yet today.</p>
          )}
        </div>
      </section>
    </div>
  );
}
