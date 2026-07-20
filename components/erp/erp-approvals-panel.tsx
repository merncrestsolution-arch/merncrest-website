"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Approval = {
  id: string;
  requestNumber: string;
  type: string;
  title: string;
  status: string;
  amountCents: number | null;
  createdAt: string;
  decisionNote: string | null;
};

export function ErpApprovalsPanel() {
  const [pending, setPending] = useState<Approval[]>([]);
  const [mine, setMine] = useState<Approval[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    type: "CUSTOM",
    title: "",
    description: "",
    amountCents: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/approvals");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setPending(data.pending ?? []);
      setMine(data.mine ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/erp/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          amountCents: form.amountCents ? Number(form.amountCents) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(`Created ${data.request.requestNumber}`);
      setForm({ type: "CUSTOM", title: "", description: "", amountCents: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(true);
    try {
      const res = await fetch("/api/erp/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(data.request.status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Leave, purchase, expense, quotation, project, and document approvals — with notifications
        and audit logging.
      </p>
      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={create} className="rounded-xl border border-white/10 p-4 grid sm:grid-cols-2 gap-2">
        <select
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {["LEAVE", "PURCHASE", "EXPENSE", "QUOTATION", "PROJECT", "INVOICE", "DOCUMENT", "CUSTOM"].map(
            (t) => (
              <option key={t} value={t}>
                {t}
              </option>
            )
          )}
        </select>
        <input
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          placeholder="Amount (cents, optional)"
          value={form.amountCents}
          onChange={(e) => setForm({ ...form, amountCents: e.target.value })}
        />
        <input
          className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          placeholder="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Button type="submit" size="sm" disabled={busy} className="sm:col-span-2 w-fit">
          Submit for approval
        </Button>
      </form>

      <section>
        <h3 className="font-semibold text-sm mb-2">Pending approvals</h3>
        <ul className="space-y-2">
          {pending.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-white/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="text-sm">
                <p className="font-mono text-xs text-accent">{p.requestNumber}</p>
                <p>
                  {p.type} · {p.title}
                </p>
                {p.amountCents != null && (
                  <p className="text-xs text-muted">{formatMoney(p.amountCents)}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy} onClick={() => decide(p.id, "approve")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => decide(p.id, "reject")}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
          {pending.length === 0 && (
            <li className="text-sm text-muted">No pending approvals.</li>
          )}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-sm mb-2">My requests</h3>
        <ul className="space-y-1 text-sm">
          {mine.map((m) => (
            <li key={m.id} className="border-b border-white/5 py-2">
              {m.requestNumber} · {m.title} · {m.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
