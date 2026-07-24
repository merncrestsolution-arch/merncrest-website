"use client";

import { useCallback, useEffect, useState } from "react";

type Template = {
  id: string;
  title: string;
  category: string;
  content: string;
  status: string;
  generatedByAi: boolean;
};

export function SystemMessageTemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({ title: "", category: "follow-up", content: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/message-templates");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setTemplates(data.templates ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/message-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed");
      return;
    }
    setForm({ title: "", category: "follow-up", content: "" });
    load();
  }

  async function generate() {
    setBusy(true);
    await fetch("/api/admin/message-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generate: true, category: form.category || "follow-up", count: 3 }),
    });
    setBusy(false);
    load();
  }

  async function approve(id: string) {
    await fetch("/api/admin/message-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "APPROVED" }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch("/api/admin/message-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delete: true }),
    });
    load();
  }

  return (
    <>
      <h1 className="rlk-welcome">Message templates</h1>
      <p className="text-sm text-[#666] mb-4">
        AI drafts stay in DRAFT until approved. Approved templates appear in agent quick-send.
      </p>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}

      <section className="rlk-section rlk-section-accent-orange mb-4">
        <div className="rlk-section-head">
          <h2>Create / generate</h2>
          <button
            type="button"
            className="rlk-btn-green !w-auto !mt-0 !px-3 !py-2"
            disabled={busy}
            onClick={generate}
          >
            Generate with AI
          </button>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={create} className="grid gap-3 max-w-2xl">
            <input
              className="rlk-input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              className="rlk-input"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <textarea
              className="rlk-input min-h-[100px]"
              placeholder="Content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <button type="submit" className="rlk-btn-green !w-auto" disabled={busy}>
              Save draft
            </button>
          </form>
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-teal">
        <div className="rlk-section-head">
          <h2>Library</h2>
        </div>
        <div className="rlk-section-body">
          {templates.length === 0 ? (
            <p className="rlk-empty">No templates yet.</p>
          ) : (
            <ul className="space-y-3">
              {templates.map((t) => (
                <li key={t.id} className="border-b border-[#e0e0e0] pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <strong>{t.title}</strong>{" "}
                      <span className="text-sm text-[#666]">
                        {t.category} · {t.status}
                        {t.generatedByAi ? " · AI" : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {t.status !== "APPROVED" ? (
                        <button
                          type="button"
                          className="rlk-btn-green !w-auto !mt-0 !px-3 !py-1.5 text-sm"
                          onClick={() => approve(t.id)}
                        >
                          Approve
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-sm text-[#d84315]"
                        onClick={() => remove(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-[#333] whitespace-pre-wrap">{t.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
