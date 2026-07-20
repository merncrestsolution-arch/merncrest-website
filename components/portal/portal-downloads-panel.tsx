"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

type DownloadItem = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  fileUrl: string;
  fileType?: string | null;
  createdAt: string;
};

export function PortalDownloadsPanel() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portal/downloads")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setDownloads(d.downloads ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading downloads…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Invoices, receipts, licenses, manuals, and company documents.
      </p>
      {downloads.length === 0 ? (
        <p className="text-sm text-muted">
          No downloads yet. Paid invoices appear here automatically.{" "}
          <Link href="/portal/invoices" className="text-accent">
            View billing
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {downloads.map((d) => (
            <li
              key={d.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-sm">{d.title}</p>
                {d.description && <p className="text-xs text-muted mt-1">{d.description}</p>}
                <p className="text-xs text-muted mt-1 uppercase tracking-wide">
                  {d.category} · {d.fileType || "FILE"}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
