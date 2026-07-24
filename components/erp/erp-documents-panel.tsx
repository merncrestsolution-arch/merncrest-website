"use client";

import { useCallback, useEffect, useState } from "react";

type Doc = {
  id: string;
  docNumber: string;
  title: string;
  category: string;
  folder: string;
  status: string;
  version: number;
  expiresAt?: string | null;
  signedAt?: string | null;
};

export function ErpDocumentsPanel() {
  const [tab, setTab] = useState<"docs" | "kb" | "templates" | "workflows">("docs");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [articles, setArticles] = useState<{ id: string; title: string; slug: string; status: string }[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ title: "", category: "Policy", folder: "General", fileUrl: "" });
  const [kb, setKb] = useState({ title: "", slug: "", body: "", category: "FAQ" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/erp/documents?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setDocs(data.documents ?? []);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadKb() {
    const res = await fetch("/api/erp/documents?view=knowledge");
    const data = await res.json();
    if (res.ok) setArticles(data.articles ?? []);
  }

  return (
    <div>
      {error ? <p className="rlk-login-error !mb-4">{error}</p> : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {(["docs", "kb", "templates", "workflows"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={
              tab === t
                ? "rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
                : "rlk-btn-ghost !w-auto !mt-0 !px-3 !py-2"
            }
            onClick={() => {
              setTab(t);
              if (t === "kb") void loadKb();
            }}
          >
            {t === "docs" ? "Repository" : t === "kb" ? "Knowledge base" : t}
          </button>
        ))}
      </div>

      {tab === "docs" && (
        <>
          <section className="rlk-section rlk-section-accent-orange">
            <div className="rlk-section-head">
              <h2>Add document</h2>
            </div>
            <div className="rlk-section-body">
              <form
                className="grid sm:grid-cols-2 gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/erp/documents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "document", ...form }),
                  });
                  setForm({ title: "", category: "Policy", folder: "General", fileUrl: "" });
                  await load();
                }}
              >
                <input
                  required
                  className="rlk-input sm:col-span-2"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  className="rlk-input"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <input
                  className="rlk-input"
                  placeholder="Folder"
                  value={form.folder}
                  onChange={(e) => setForm({ ...form, folder: e.target.value })}
                />
                <input
                  className="rlk-input sm:col-span-2"
                  placeholder="File URL"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                />
                <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4">
                  Upload meta
                </button>
              </form>
            </div>
          </section>

          <section className="rlk-section rlk-section-accent-teal">
            <div className="rlk-section-head">
              <h2>Search repository</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void load();
                }}
                className="flex gap-2"
              >
                <input
                  className="rlk-input !w-auto"
                  placeholder="Full-text / OCR / folder"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button type="submit" className="rlk-btn-ghost !w-auto !mt-0 !px-3">
                  Search
                </button>
              </form>
            </div>
            <div className="rlk-section-body">
              {docs.length === 0 ? (
                <p className="rlk-empty">No documents.</p>
              ) : (
                docs.map((d) => (
                  <div key={d.id} className="rlk-row">
                    <div>
                      <p className="rlk-mono text-xs text-[#17a2b8]">{d.docNumber}</p>
                      <p className="font-medium text-[13px]">{d.title}</p>
                      <p className="text-xs text-[#666]">
                        {d.folder} · {d.category} · v{d.version} · {d.status}
                        {d.expiresAt ? ` · expires ${new Date(d.expiresAt).toLocaleDateString()}` : ""}
                        {d.signedAt ? " · signed" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rlk-btn-sm"
                        onClick={async () => {
                          await fetch("/api/erp/documents", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "sign", id: d.id }),
                          });
                          await load();
                        }}
                      >
                        Sign
                      </button>
                      <button
                        type="button"
                        className="rlk-btn-sm"
                        onClick={async () => {
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
                        }}
                      >
                        {d.status === "PENDING" ? "Approve" : "Archive"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {tab === "kb" && (
        <section className="rlk-section rlk-section-accent-green">
          <div className="rlk-section-head">
            <h2>Wiki / FAQ articles</h2>
          </div>
          <div className="rlk-section-body space-y-3">
            <form
              className="space-y-2 max-w-xl"
              onSubmit={async (e) => {
                e.preventDefault();
                await fetch("/api/erp/documents", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "knowledge",
                    ...kb,
                    status: "PUBLISHED",
                  }),
                });
                setKb({ title: "", slug: "", body: "", category: "FAQ" });
                await loadKb();
              }}
            >
              <input
                className="rlk-input"
                placeholder="Title"
                required
                value={kb.title}
                onChange={(e) =>
                  setKb({
                    ...kb,
                    title: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-").slice(0, 48),
                  })
                }
              />
              <textarea
                className="rlk-input min-h-[80px]"
                placeholder="Body"
                required
                value={kb.body}
                onChange={(e) => setKb({ ...kb, body: e.target.value })}
              />
              <button type="submit" className="rlk-btn-green !w-auto !mt-0 !px-4">
                Publish article
              </button>
            </form>
            {articles.map((a) => (
              <div key={a.id} className="rlk-row">
                <span>
                  {a.title} <span className="text-xs text-[#999]">/{a.slug}</span>
                </span>
                <span className="rlk-badge">{a.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(tab === "templates" || tab === "workflows") && (
        <section className="rlk-section rlk-section-accent-gray">
          <div className="rlk-section-body">
            <p className="rlk-empty">
              Use API actions <code>template</code> / <code>workflow</code> to seed libraries. Process
              workflows store stepsJson + optional diagramJson for visual SOPs.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
