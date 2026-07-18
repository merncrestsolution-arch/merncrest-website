"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CallbackForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("SUPPORT");
  const [preferredAt, setPreferredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email: email || undefined, reason, preferredAt, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(data.message || "Callback queued");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 p-5 max-w-lg">
      <h3 className="font-display font-semibold">Request a callback</h3>
      <p className="text-sm text-muted">IVR / customer care will call you back. Also creates a CRM lead.</p>
      <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name"
        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (+94…)"
        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email"
        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
      <select value={reason} onChange={(e) => setReason(e.target.value)}
        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm">
        {["SUPPORT", "SALES", "BILLING", "TECHNICAL"].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <input value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} placeholder="Preferred time (e.g. Tomorrow 10am)"
        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-teal-400">{message}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Request callback"}</Button>
    </form>
  );
}
