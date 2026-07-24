"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type PickedCustomer = {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  customerCode?: string | null;
};

type CustomerPickerProps = {
  value: PickedCustomer | null;
  onChange: (customer: PickedCustomer | null) => void;
  className?: string;
};

export function CustomerPicker({ value, onChange, className }: CustomerPickerProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickedCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(term)}&sort=name`);
      const data = await res.json();
      setResults(
        (data.customers ?? []).map(
          (c: {
            id: string;
            fullName: string;
            email: string;
            company?: string | null;
            customerCode?: string | null;
          }) => ({
            id: c.id,
            fullName: c.fullName,
            email: c.email,
            company: c.company,
            customerCode: c.customerCode,
          })
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 250);
    return () => clearTimeout(t);
  }, [q, search]);

  return (
    <div className={cn("relative", className)}>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm">
          <div>
            <p className="font-medium text-foreground">{value.fullName}</p>
            <p className="text-xs text-muted">
              {value.email}
              {value.customerCode ? ` · ${value.customerCode}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-violet-300 hover:text-violet-100"
            onClick={() => {
              onChange(null);
              setQ("");
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-violet-400/50"
            placeholder="Search client by name, email, or code…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {open && q.trim() ? (
            <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#14141a] shadow-xl">
              {loading ? (
                <p className="px-3 py-2 text-xs text-muted">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">No clients found</p>
              ) : (
                results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-white/5 last:border-0"
                    onClick={() => {
                      onChange(c);
                      setQ("");
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{c.fullName}</span>
                    <span className="block text-xs text-muted">{c.email}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
