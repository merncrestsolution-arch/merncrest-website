"use client";

import { useCallback, useEffect, useState } from "react";

type Asset = {
  id: string;
  filename: string;
  title: string | null;
  kind: string;
  url: string;
  folder: string;
  mimeType: string | null;
  createdAt: string;
};

export function SystemMediaPanel() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<{ folder: string; _count: number }[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [upload, setUpload] = useState({ filename: "", url: "", folder: "uploads" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/media${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else {
      setAssets(d.assets ?? []);
      setFolders(d.folders ?? []);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function addAsset(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upload),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Upload failed");
      return;
    }
    setUpload({ filename: "", url: "", folder: "uploads" });
    await load();
  }

  return (
    <>
      <h1 className="stitch-page-title">File manager</h1>
      <p className="stitch-page-sub !mb-5">Client files · project assets · documents · backups</p>
      {error ? <p className="stitch-auth-error !mb-4">{error}</p> : null}

      <div className="stitch-stat-grid !grid-cols-3 !mb-6">
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{assets.length}</div>
          <div className="stitch-stat-label">Files shown</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{folders.length}</div>
          <div className="stitch-stat-label">Folders</div>
        </div>
      </div>

      <section className="stitch-section-card !mb-4">
        <div className="stitch-section-head">
          <h3>Register file URL</h3>
        </div>
        <form onSubmit={addAsset} className="stitch-section-body grid gap-3 sm:grid-cols-3">
          <input
            className="rlk-input"
            placeholder="Filename"
            value={upload.filename}
            onChange={(e) => setUpload({ ...upload, filename: e.target.value })}
            required
          />
          <input
            className="rlk-input"
            placeholder="https://..."
            value={upload.url}
            onChange={(e) => setUpload({ ...upload, url: e.target.value })}
            required
          />
          <input
            className="rlk-input"
            placeholder="Folder"
            value={upload.folder}
            onChange={(e) => setUpload({ ...upload, folder: e.target.value })}
          />
          <button type="submit" className="stitch-btn-sm sm:col-span-3 !w-fit">
            Add file
          </button>
        </form>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Library</h3>
          <input
            className="rlk-input !w-48 !py-1.5 text-sm"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="stitch-section-body">
          {assets.map((a) => (
            <div key={a.id} className="stitch-row">
              <span>
                <strong>{a.filename}</strong>
                <span className="block text-xs" style={{ color: "var(--sp-muted)" }}>
                  {a.folder} · {a.kind}
                </span>
              </span>
              <a href={a.url} target="_blank" rel="noreferrer" className="stitch-btn-outline !text-xs">
                Open
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
