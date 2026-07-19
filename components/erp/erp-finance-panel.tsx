"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Entry = {
  id: string;
  entryNumber: string;
  type: string;
  category: string;
  description: string;
  amountCents: number;
  entryDate: string;
};

export function ErpFinancePanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState({ incomeCents: 0, expenseCents: 0, netCents: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: "EXPENSE",
    category: "Operations",
    description: "",
    amountCents: 100000,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/finance");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setEntries(data.entries ?? []);
    setSummary(data.summary);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/erp/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({ ...form, description: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-muted">Income</p>
          <p className="font-display text-xl font-bold text-success">{formatMoney(summary.incomeCents)}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-muted">Expense</p>
          <p className="font-display text-xl font-bold">{formatMoney(summary.expenseCents)}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-muted">Net</p>
          <p className="font-display text-xl font-bold">{formatMoney(summary.netCents)}</p>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-white/10 p-4 grid sm:grid-cols-2 gap-2 max-w-2xl">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm">
          {["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="Category" className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description" className="sm:col-span-2 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <input type="number" value={form.amountCents} onChange={(e) => setForm({ ...form, amountCents: Number(e.target.value) })}
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" disabled={busy}>Post entry</Button>
      </form>

      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="rounded-lg border border-white/10 p-3 text-sm flex justify-between">
            <div>
              <p className="font-mono text-xs text-accent">{e.entryNumber}</p>
              <p>{e.description}</p>
              <p className="text-xs text-muted">{e.type} · {e.category} · {new Date(e.entryDate).toLocaleDateString()}</p>
            </div>
            <p className={e.type === "INCOME" ? "text-success" : ""}>{formatMoney(e.amountCents)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
