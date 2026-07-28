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
  /** Show recent clients when the field is focused without typing */
  showRecentOnFocus?: boolean;
};

function mapCustomer(c: {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  customerCode?: string | null;
}): PickedCustomer {
  return {
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    company: c.company,
    customerCode: c.customerCode,
  };
}

export function CustomerPicker({
  value,
  onChange,
  className,
  showRecentOnFocus = true,
}: CustomerPickerProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickedCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "name" });
      if (term.trim()) params.set("q", term.trim());
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setResults((data.customers ?? []).slice(0, 25).map(mapCustomer));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || value) return;
    const t = setTimeout(() => search(q), q.trim() ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, search, open, value]);

  return (
    <div className={cn("relative", className)}>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--stitch-primary)]/30 bg-[var(--stitch-primary-soft)] px-3 py-2 text-sm">
          <div>
            <p className="font-medium text-[var(--sp-on)]">{value.fullName}</p>
            <p className="text-xs text-[var(--sp-muted)]">
              {value.email}
              {value.customerCode ? ` · ${value.customerCode}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-[var(--stitch-primary)] hover:underline"
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
            className="stitch-input w-full"
            placeholder="Search or pick a client…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              if (showRecentOnFocus && !q.trim()) {
                void search("");
              }
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
          {open ? (
            <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-[var(--sp-outline)] bg-white shadow-lg">
              {loading ? (
                <p className="px-3 py-2 text-xs text-[var(--sp-muted)]">Loading clients…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[var(--sp-muted)]">
                  {q.trim() ? "No clients found — create one on the Clients tab first" : "No clients yet"}
                </p>
              ) : (
                results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--stitch-primary-soft)] border-b border-[var(--sp-outline)] last:border-0"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(c);
                      setQ("");
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium text-[var(--sp-on)]">{c.fullName}</span>
                    <span className="block text-xs text-[var(--sp-muted)]">
                      {c.email}
                      {c.customerCode ? ` · ${c.customerCode}` : ""}
                    </span>
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
