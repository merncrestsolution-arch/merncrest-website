"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { formatSriLankaDateTime } from "@/lib/timezone";

type DomainService = {
  projectServiceId: string;
  projectName: string;
  domainName: string | null;
  latestSubmission: {
    id: string;
    status: string;
    reviewNotes: string | null;
    createdAt: string;
  } | null;
};

type DocFile = { name: string; url: string };

function statusLabel(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DomainRegistrationPanel() {
  const [services, setServices] = useState<DomainService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    purpose: "",
    phone: "",
    email: "",
    letterheadUrl: "",
    supportingDocs: [] as DocFile[],
    idDocs: [] as DocFile[],
  });

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/portal/domain-registration")
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setServices(d.data ?? []);
        if (d.data?.[0] && !selectedId) setSelectedId(d.data[0].projectServiceId);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  function addDoc(
    field: "supportingDocs" | "idDocs",
    name: string,
    url: string
  ) {
    if (!name.trim() || !url.trim()) return;
    setForm((f) => ({
      ...f,
      [field]: [...f[field], { name: name.trim(), url: url.trim() }],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/domain-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectServiceId: selectedId,
          fullName: form.fullName,
          companyName: form.companyName || null,
          purpose: form.purpose,
          phone: form.phone,
          email: form.email,
          letterheadUrl: form.letterheadUrl || null,
          supportingDocsJson: form.supportingDocs.length ? form.supportingDocs : undefined,
          idDocsJson: form.idDocs.length ? form.idDocs : undefined,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Submission failed");
      setMessage("Documents submitted. Our team will review and contact you if anything is needed.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rlk-card p-6 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No domain registration services are linked to your account yet.</p>
      </div>
    );
  }

  const selected = services.find((s) => s.projectServiceId === selectedId);

  return (
    <div className="space-y-6">
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      {message ? <p className="text-emerald-700 text-sm">{message}</p> : null}

      <div className="rlk-card p-4">
        <label className="block text-sm font-medium mb-2">Domain registration service</label>
        <select
          className="rlk-input w-full"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {services.map((s) => (
            <option key={s.projectServiceId} value={s.projectServiceId}>
              {s.projectName}
              {s.domainName ? ` — ${s.domainName}` : ""}
            </option>
          ))}
        </select>
        {selected?.latestSubmission ? (
          <p className="text-sm text-muted-foreground mt-2">
            Latest submission: <strong>{statusLabel(selected.latestSubmission.status)}</strong>
            {selected.latestSubmission.reviewNotes
              ? ` — ${selected.latestSubmission.reviewNotes}`
              : ""}
            {" · "}
            {formatSriLankaDateTime(selected.latestSubmission.createdAt)}
          </p>
        ) : null}
      </div>

      <form onSubmit={submit} className="rlk-card p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Registration documents
        </h2>
        <p className="text-sm text-muted-foreground">
          Provide the information and document URLs required for .lk and international domain
          registration. Files can be uploaded to your cloud storage; paste the public link below.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm">
            Full name *
            <input
              className="rlk-input w-full mt-1"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Company name
            <input
              className="rlk-input w-full mt-1"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            Purpose of domain registration *
            <textarea
              className="rlk-input w-full mt-1 min-h-[80px]"
              required
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Phone *
            <input
              className="rlk-input w-full mt-1"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Email *
            <input
              type="email"
              className="rlk-input w-full mt-1"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            Company letterhead (URL)
            <input
              type="url"
              className="rlk-input w-full mt-1"
              placeholder="https://…"
              value={form.letterheadUrl}
              onChange={(e) => setForm({ ...form, letterheadUrl: e.target.value })}
            />
          </label>
        </div>

        <DocUrlList
          title="Supporting documents"
          docs={form.supportingDocs}
          onAdd={(name, url) => addDoc("supportingDocs", name, url)}
        />
        <DocUrlList
          title="Identification documents"
          docs={form.idDocs}
          onAdd={(name, url) => addDoc("idDocs", name, url)}
        />

        <button type="submit" className="rlk-btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Submit for approval"}
        </button>
      </form>
    </div>
  );
}

function DocUrlList({
  title,
  docs,
  onAdd,
}: {
  title: string;
  docs: DocFile[];
  onAdd: (name: string, url: string) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <h3 className="font-medium text-sm">{title}</h3>
      {docs.length > 0 ? (
        <ul className="text-sm space-y-1">
          {docs.map((d, i) => (
            <li key={`${d.url}-${i}`}>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-violet-600">
                {d.name}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No documents added yet.</p>
      )}
      <div className="flex flex-wrap gap-2 pt-2">
        <input
          className="rlk-input flex-1 min-w-[120px]"
          placeholder="Label"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rlk-input flex-[2] min-w-[180px]"
          placeholder="Document URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          className="rlk-btn-sm"
          onClick={() => {
            onAdd(name, url);
            setName("");
            setUrl("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
