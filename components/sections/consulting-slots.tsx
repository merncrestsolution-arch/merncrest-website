"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Clock3, Loader2 } from "lucide-react";
import {
  FREE_CONSULTING_DETAIL,
  FREE_CONSULTING_LABEL,
  buildCalendarMonth,
  listConsultingDays,
  listSlotsForDay,
  SLOTS_PER_HOUR,
} from "@/lib/support/consulting-schedule";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ConsultingSlots() {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calendarCells = useMemo(
    () => buildCalendarMonth(viewYear, viewMonth, 42),
    [viewYear, viewMonth]
  );

  const timeSlots = useMemo(
    () => (selectedDate ? listSlotsForDay(selectedDate) : []),
    [selectedDate]
  );

  const selectedDay = useMemo(
    () => listConsultingDays(42).find((d) => d.dateKey === selectedDate),
    [selectedDate]
  );

  const slot = timeSlots.find((s) => s.id === selectedSlot);

  function prevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function pickDate(dateKey: string) {
    setSelectedDate(dateKey);
    setSelectedSlot(null);
    setError(null);
  }

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all fields, pick a date, and select a time slot.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          interest: "Free consulting",
          message: `Free consulting request for ${slot.dayLabel} at ${slot.label} (${SLOTS_PER_HOUR} slots per hour).`,
          formType: "consulting",
          channel: "FORM",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-LK", {
    month: "long",
    year: "numeric",
  });

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        Thank you! Your free consulting slot request has been received. Our team will confirm by email
        or phone shortly.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <CalendarCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900">Free consulting</h3>
          <p className="mt-1 text-sm text-slate-600">{FREE_CONSULTING_LABEL}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            {FREE_CONSULTING_DETAIL} ({SLOTS_PER_HOUR} slots per hour)
          </p>
        </div>
      </div>

      <form onSubmit={book} className="space-y-5">
        {/* Step 1 — Calendar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">1. Pick a date</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[9rem] text-center text-sm font-medium text-slate-800">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
              >
                {wd}
              </div>
            ))}
            {calendarCells.map((cell, i) => {
              if (!cell.day) {
                return <div key={`pad-${i}`} className="aspect-square" />;
              }
              const active = selectedDate === cell.dateKey;
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  disabled={!cell.bookable}
                  onClick={() => cell.dateKey && pickDate(cell.dateKey)}
                  className={`aspect-square rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-rose-600 text-white shadow-sm"
                      : cell.bookable
                        ? "bg-rose-50 text-slate-800 hover:bg-rose-100"
                        : "cursor-not-allowed text-slate-300"
                  } ${cell.isToday && !active ? "ring-2 ring-rose-300 ring-offset-1" : ""}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {selectedDay ? (
            <p className="mt-3 text-xs text-slate-600">
              Selected: <span className="font-semibold text-slate-900">{selectedDay.label}</span>
              {selectedDay.isSaturday ? " · Saturday hours (9 AM – 3 PM)" : " · Weekday hours (9 AM – 5 PM)"}
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Sundays and past dates are not available.</p>
          )}
        </div>

        {/* Step 2 — Time slots (shown after date picked) */}
        {selectedDate ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">2. Pick a time slot</p>
            {timeSlots.length === 0 ? (
              <p className="text-sm text-slate-500">
                No slots left for this date. Please choose another day.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {timeSlots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(s.id);
                      setError(null);
                    }}
                    className={`rounded-lg border px-2 py-2.5 text-center text-xs font-semibold transition ${
                      selectedSlot === s.id
                        ? "border-rose-500 bg-rose-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Step 3 — Contact details */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">3. Your details</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone / WhatsApp"
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !selectedDate || !selectedSlot}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 px-6 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Request free consulting
        </button>
      </form>
    </div>
  );
}
