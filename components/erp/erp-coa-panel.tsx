"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  active: boolean;
};

export function ErpCoaPanel() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "EXPENSE",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/finance/coa");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setAccounts(data.accounts ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/erp/finance/coa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setForm({ code: "", name: "", type: "EXPENSE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const byType = (t: string) => accounts.filter((a) => a.type === t);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Chart of Accounts foundation for General Ledger, AR, and AP.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={create} className="flex flex-wrap gap-2 items-end">
        <input
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          placeholder="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
        />
        <input
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={busy}>
          Add account
        </Button>
      </form>

      {["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((t) => (
        <section key={t}>
          <h3 className="text-sm font-semibold mb-2">{t}</h3>
          <ul className="space-y-1">
            {byType(t).map((a) => (
              <li
                key={a.id}
                className="text-sm flex justify-between border-b border-white/5 py-1.5"
              >
                <span>
                  <span className="font-mono text-accent text-xs mr-2">{a.code}</span>
                  {a.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
