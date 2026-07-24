"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type UseCaseKey = "" | "0" | "1" | "2" | "3" | "4";

export function IvrSimulator() {
  const [phone, setPhone] = useState("+94713838638");
  const [fullName, setFullName] = useState("");
  const [languageKey, setLanguageKey] = useState<"1" | "2" | "3">("3");
  const [departmentKey, setDepartmentKey] = useState<
    "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  >("8");
  const [useCaseKey, setUseCaseKey] = useState<UseCaseKey>("");
  const [agentAvailable, setAgentAvailable] = useState(false);
  const [voicemail, setVoicemail] = useState("");
  const [surveyScore, setSurveyScore] = useState("");
  const [orderDigits, setOrderDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const showUseCase = departmentKey === "2" || departmentKey === "7" || departmentKey === "8";
  const showOrder = departmentKey === "7" && useCaseKey === "1";
  const showSurvey =
    (departmentKey === "8" && useCaseKey === "3") || (agentAvailable && surveyScore !== "");

  async function placeCall(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ivr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          fullName: fullName || undefined,
          languageKey,
          departmentKey,
          useCaseKey: useCaseKey || undefined,
          agentAvailable,
          voicemail: voicemail || undefined,
          surveyScore: surveyScore ? Number(surveyScore) : undefined,
          orderDigits: orderDigits || undefined,
          collectSurvey: agentAvailable && Boolean(surveyScore),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(
        `${data.message} Call ${data.call?.callNumber}` +
          (data.ticketNumber ? ` · Ticket ${data.ticketNumber}` : "") +
          (data.useCase ? ` · ${data.useCase}` : "")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={placeCall} className="space-y-3 rounded-xl border border-white/10 p-5 max-w-lg">
      <h3 className="font-display font-semibold">IVR call simulator</h3>
      <p className="text-sm text-muted">
        Language → Department → Use-case / Agent / Voicemail → CRM + ticket + missed-call WhatsApp.
        Recorded voice only (no AI voice).
      </p>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone"
        required
        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
      />
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Caller name"
        className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={languageKey}
          onChange={(e) => setLanguageKey(e.target.value as "1" | "2" | "3")}
          className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        >
          <option value="1">1 · Sinhala</option>
          <option value="2">2 · Tamil</option>
          <option value="3">3 · English</option>
        </select>
        <select
          value={departmentKey}
          onChange={(e) => {
            setDepartmentKey(e.target.value as typeof departmentKey);
            setUseCaseKey("");
          }}
          className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        >
          <option value="1">1 · Sales</option>
          <option value="2">2 · Technical</option>
          <option value="3">3 · Hosting</option>
          <option value="4">4 · Domains</option>
          <option value="5">5 · Billing</option>
          <option value="6">6 · Enterprise</option>
          <option value="7">7 · Existing customers</option>
          <option value="8">8 · Customer care</option>
          <option value="9">9 · Voicemail</option>
        </select>
      </div>

      {showUseCase && (
        <select
          value={useCaseKey}
          onChange={(e) => setUseCaseKey(e.target.value as UseCaseKey)}
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        >
          <option value="">Secondary menu (optional)</option>
          {departmentKey === "2" && (
            <>
              <option value="1">1 · Severity Low</option>
              <option value="2">2 · Severity Medium</option>
              <option value="3">3 · Severity High</option>
              <option value="4">4 · Severity Critical</option>
            </>
          )}
          {departmentKey === "7" && (
            <>
              <option value="1">1 · Order status</option>
              <option value="2">2 · Payment inquiry</option>
              <option value="3">3 · Appointment</option>
              <option value="4">4 · Open ticket</option>
              <option value="0">0 · Speak to agent</option>
            </>
          )}
          {departmentKey === "8" && (
            <>
              <option value="1">1 · Attendance punch</option>
              <option value="2">2 · Helpdesk ticket</option>
              <option value="3">3 · CSAT survey</option>
              <option value="0">0 · Speak to agent</option>
            </>
          )}
        </select>
      )}

      {showOrder && (
        <input
          value={orderDigits}
          onChange={(e) => setOrderDigits(e.target.value)}
          placeholder="Order number digits (optional)"
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        />
      )}

      {showSurvey && (
        <select
          value={surveyScore}
          onChange={(e) => setSurveyScore(e.target.value)}
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        >
          <option value="">Survey 1–5 (optional)</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={agentAvailable}
          onChange={(e) => setAgentAvailable(e.target.checked)}
        />
        Agent available (connect / queue)
      </label>
      {!agentAvailable && departmentKey !== "9" && (
        <textarea
          value={voicemail}
          onChange={(e) => setVoicemail(e.target.value)}
          placeholder="Voicemail / issue description"
          rows={2}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && <p className="text-sm text-success">{result}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? "Routing…" : "Place call"}
      </Button>
    </form>
  );
}
