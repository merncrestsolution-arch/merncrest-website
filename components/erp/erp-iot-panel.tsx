"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ErpIotPanel() {
  const [devices, setDevices] = useState<
    { id: string; deviceCode: string; name: string; status: string; healthScore: number; location?: string | null; readings: { metric: string; value: number; unit?: string | null }[] }[]
  >([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/iot");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setDevices(data.devices ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/erp/iot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, location: "Colombo DC" }),
          });
          setName("");
          await load();
        }}
      >
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Device name"
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" size="sm">Register device</Button>
      </form>
      <ul className="space-y-3">
        {devices.map((d) => (
          <li key={d.id} className="rounded-xl border border-white/10 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-accent">{d.deviceCode}</p>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-muted">{d.location} · {d.status} · health {d.healthScore}</p>
              </div>
              <Button size="sm" variant="outline" onClick={async () => {
                await fetch("/api/erp/iot", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "reading",
                    deviceId: d.id,
                    metric: "temperature",
                    value: 40 + Math.random() * 40,
                    unit: "C",
                  }),
                });
                await load();
              }}>Push reading</Button>
            </div>
            {d.readings[0] && (
              <p className="text-xs text-muted mt-2">
                Latest: {d.readings[0].metric}={d.readings[0].value.toFixed(1)}{d.readings[0].unit}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
