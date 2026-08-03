"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Clock3, Loader2 } from "lucide-react";
import {
  FREE_CONSULTING_DETAIL,
  FREE_CONSULTING_LABEL,
  listConsultingSlots,
  SLOTS_PER_HOUR,
} from "@/lib/support/consulting-schedule";

export function ConsultingSlots() {
  const slots = useMemo(() => listConsultingSlots({ daysAhead: 10, maxSlots: 24 }), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slot = slots.find((s) => s.id === selected);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all fields and pick a time slot.");
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
          message: `Free consulting request for ${slot.dayLabel} at ${slot.label} (slot ${SLOTS_PER_HOUR} per hour).`,
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
      <div className="mb-4 flex items-start gap-3">
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

      <form onSubmit={book} className="space-y-4">
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

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Pick a slot
          </p>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {slots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                  selected === s.id
                    ? "border-rose-500 bg-rose-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-rose-200"
                }`}
              >
                <span className="block font-semibold">{s.dayLabel}</span>
                <span className={selected === s.id ? "text-white/90" : "text-slate-500"}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !selected}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 px-6 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Request free consulting
        </button>
      </form>
    </div>
  );
}
