"use client";

import { useCallback, useEffect, useState } from "react";

type Provider = {
  id: string;
  provider: string;
  label: string;
  model: string;
  isActive: boolean;
  priority: number;
  apiKeyMasked: string;
};

type Assistant = {
  displayName: string;
  avatarUrl?: string | null;
  systemPrompt: string;
  fallbackMessage: string;
};

const emptyProvider = {
  provider: "openai",
  label: "",
  model: "gpt-4.1-mini",
  apiKey: "",
  priority: 0,
  isActive: true,
};

export function SystemAiProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [assistant, setAssistant] = useState<Assistant>({
    displayName: "Aira",
    systemPrompt: "",
    fallbackMessage: "",
  });
  const [form, setForm] = useState(emptyProvider);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ai");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setProviders(data.providers ?? []);
    if (data.assistant) setAssistant(data.assistant);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProvider(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setForm(emptyProvider);
    load();
  }

  async function saveAssistant(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assistant", ...assistant }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed");
      return;
    }
    load();
  }

  async function testProvider(id: string) {
    setTestResult("Testing…");
    const res = await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        test: true,
        provider: "openai",
        label: "x",
        model: "x",
      }),
    });
    const data = await res.json();
    setTestResult(
      data.ok
        ? `OK · ${data.latencyMs}ms · ${data.model}`
        : `Failed · ${data.error || "error"}`
    );
  }

  async function removeProvider(id: string) {
    await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        delete: true,
        provider: "openai",
        label: "x",
        model: "x",
      }),
    });
    load();
  }

  return (
    <>
      <h1 className="rlk-welcome">AI Providers</h1>
      <p className="text-sm text-[#666] mb-4">
        Configure OpenAI, Anthropic, and Groq. Keys are encrypted at rest and never shown in full.
      </p>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}
      {testResult ? <p className="text-sm text-[#138496] mb-3">{testResult}</p> : null}

      <section className="rlk-section rlk-section-accent-teal mb-4">
        <div className="rlk-section-head">
          <h2>Providers</h2>
        </div>
        <div className="rlk-section-body">
          {providers.length === 0 ? (
            <p className="rlk-empty">No providers yet. Add one below.</p>
          ) : (
            <ul className="space-y-2">
              {providers.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e0e0] py-2"
                >
                  <div>
                    <strong>{p.label}</strong>{" "}
                    <span className="text-[#666] text-sm">
                      {p.provider} · {p.model} · priority {p.priority} ·{" "}
                      {p.isActive ? "active" : "off"} · {p.apiKeyMasked}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rlk-btn-green !w-auto !mt-0 !px-3 !py-1.5 text-sm"
                      onClick={() => testProvider(p.id)}
                    >
                      Test
                    </button>
                    <button
                      type="button"
                      className="text-sm text-[#d84315]"
                      onClick={() => removeProvider(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-orange mb-4">
        <div className="rlk-section-head">
          <h2>Add provider</h2>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={saveProvider} className="grid gap-3 max-w-xl">
            <label className="text-sm">
              Provider
              <select
                className="rlk-input"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="groq">Groq</option>
              </select>
            </label>
            <label className="text-sm">
              Label
              <input
                className="rlk-input"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </label>
            <label className="text-sm">
              Model
              <input
                className="rlk-input"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                required
              />
            </label>
            <label className="text-sm">
              API key
              <input
                className="rlk-input"
                type="password"
                autoComplete="off"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                required
              />
            </label>
            <label className="text-sm">
              Priority (lower = first)
              <input
                className="rlk-input"
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) || 0 })
                }
              />
            </label>
            <button type="submit" className="rlk-btn-green !w-auto" disabled={busy}>
              Save provider
            </button>
          </form>
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-green">
        <div className="rlk-section-head">
          <h2>Assistant persona</h2>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={saveAssistant} className="grid gap-3 max-w-2xl">
            <label className="text-sm">
              Display name
              <input
                className="rlk-input"
                value={assistant.displayName}
                onChange={(e) =>
                  setAssistant({ ...assistant, displayName: e.target.value })
                }
                required
              />
            </label>
            <label className="text-sm">
              System prompt
              <textarea
                className="rlk-input min-h-[140px]"
                value={assistant.systemPrompt}
                onChange={(e) =>
                  setAssistant({ ...assistant, systemPrompt: e.target.value })
                }
                required
              />
            </label>
            <label className="text-sm">
              Fallback message
              <input
                className="rlk-input"
                value={assistant.fallbackMessage}
                onChange={(e) =>
                  setAssistant({ ...assistant, fallbackMessage: e.target.value })
                }
                required
              />
            </label>
            <button type="submit" className="rlk-btn-green !w-auto" disabled={busy}>
              Save persona
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
