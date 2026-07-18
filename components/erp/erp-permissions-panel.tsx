"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Staff = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  permissions: { permission: string }[];
};

export function ErpPermissionsPanel() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/permissions");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setStaff(data.staff ?? []);
    setAvailable(data.available ?? []);
    setSelected((prev) => prev || data.staff?.[0]?.id || null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = staff.find((s) => s.id === selected);
  const granted = new Set(active?.permissions.map((p) => p.permission) || []);

  async function toggle(permission: string, grant: boolean) {
    if (!selected) return;
    await fetch("/api/erp/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selected,
        permission,
        action: grant ? "grant" : "revoke",
      }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-sm text-muted">
        OWNER/ADMIN have all ERP permissions. Extra grants apply mainly to STAFF roles.
      </p>
      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <ul className="space-y-2">
          {staff.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setSelected(s.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                  selected === s.id ? "border-accent/50 bg-accent/10" : "border-white/10"
                }`}>
                <p className="font-medium">{s.fullName}</p>
                <p className="text-xs text-muted">{s.role}</p>
              </button>
            </li>
          ))}
        </ul>
        {active && (
          <div className="rounded-xl border border-white/10 p-4 space-y-2">
            <h3 className="font-display font-semibold">{active.fullName}</h3>
            <p className="text-xs text-muted mb-3">{active.email} · {active.role}</p>
            {available.map((p) => (
              <div key={p} className="flex items-center justify-between text-sm border-b border-white/5 py-2">
                <span className="font-mono text-xs">{p}</span>
                <Button
                  size="sm"
                  variant={granted.has(p) ? "default" : "outline"}
                  onClick={() => toggle(p, !granted.has(p))}
                >
                  {granted.has(p) ? "Revoke" : "Grant"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
