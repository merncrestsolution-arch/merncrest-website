"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ErpDocumentsPanel() {
  const [docs, setDocs] = useState<{ id: string; docNumber: string; title: string; category: string; status: string; version: number }[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/documents");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setDocs(data.documents ?? []);
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
          await fetch("/api/erp/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, category: "Policy" }),
          });
          setTitle("");
          await load();
        }}
      >
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title"
          className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" size="sm">Upload (meta)</Button>
      </form>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="border border-white/10 rounded-lg p-3 text-sm flex justify-between">
            <div>
              <p className="font-mono text-xs text-accent">{d.docNumber}</p>
              <p>{d.title}</p>
              <p className="text-xs text-muted">{d.category} · v{d.version} · {d.status}</p>
            </div>
            <Button size="sm" variant="outline" onClick={async () => {
              await fetch("/api/erp/documents", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: d.id,
                  status: d.status === "PENDING" ? "APPROVED" : "ARCHIVED",
                  bumpVersion: d.status === "PENDING",
                }),
              });
              await load();
            }}>
              {d.status === "PENDING" ? "Approve" : "Archive"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
