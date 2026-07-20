"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ProfilePayload = {
  user: {
    id: string;
    email: string;
    fullName: string;
    company: string | null;
    emailVerifiedAt: string | null;
    createdAt: string;
  };
  profile: {
    customerCode: string | null;
    photoUrl: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    country: string | null;
    businessReg: string | null;
    nicPassport: string | null;
    timezone: string | null;
    preferredLanguage: string | null;
    notifyEmail: boolean;
    notifyWhatsApp: boolean;
    notifySms: boolean;
    marketingOptIn: boolean;
  } | null;
  loginHistory: {
    id: string;
    success: boolean;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  }[];
};

const emptyForm = {
  fullName: "",
  company: "",
  photoUrl: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Sri Lanka",
  businessReg: "",
  nicPassport: "",
  timezone: "Asia/Colombo",
  preferredLanguage: "en",
  notifyEmail: true,
  notifyWhatsApp: true,
  notifySms: false,
  marketingOptIn: false,
};

export function PortalSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [customerCode, setCustomerCode] = useState<string | null>(null);
  const [loginHistory, setLoginHistory] = useState<ProfilePayload["loginHistory"]>([]);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/profile");
      const data = (await res.json()) as ProfilePayload & { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setEmail(data.user.email);
      setCustomerCode(data.profile?.customerCode ?? null);
      setLoginHistory(data.loginHistory ?? []);
      setForm({
        fullName: data.user.fullName || "",
        company: data.user.company || "",
        photoUrl: data.profile?.photoUrl || "",
        phone: data.profile?.phone || "",
        whatsapp: data.profile?.whatsapp || "",
        address: data.profile?.address || "",
        city: data.profile?.city || "",
        province: data.profile?.province || "",
        postalCode: data.profile?.postalCode || "",
        country: data.profile?.country || "Sri Lanka",
        businessReg: data.profile?.businessReg || "",
        nicPassport: data.profile?.nicPassport || "",
        timezone: data.profile?.timezone || "Asia/Colombo",
        preferredLanguage: data.profile?.preferredLanguage || "en",
        notifyEmail: data.profile?.notifyEmail ?? true,
        notifyWhatsApp: data.profile?.notifyWhatsApp ?? true,
        notifySms: data.profile?.notifySms ?? false,
        marketingOptIn: data.profile?.marketingOptIn ?? false,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          photoUrl: form.photoUrl || null,
          company: form.company || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(data.message || "Saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (loading) return <p className="text-sm text-muted">Loading profile…</p>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-muted mt-1">
          Customer ID {customerCode || "—"} · {email}
        </p>
      </div>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <h2 className="font-semibold text-sm">Personal & business</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name" value={form.fullName} onChange={(v) => set("fullName", v)} required />
            <Field label="Company" value={form.company} onChange={(v) => set("company", v)} />
            <Field label="Business registration" value={form.businessReg} onChange={(v) => set("businessReg", v)} />
            <Field label="NIC / Passport" value={form.nicPassport} onChange={(v) => set("nicPassport", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} />
            <Field label="Profile photo URL" value={form.photoUrl} onChange={(v) => set("photoUrl", v)} className="sm:col-span-2" />
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <h2 className="font-semibold text-sm">Address</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Address" value={form.address} onChange={(v) => set("address", v)} className="sm:col-span-2" />
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
            <Field label="Province" value={form.province} onChange={(v) => set("province", v)} />
            <Field label="Postal code" value={form.postalCode} onChange={(v) => set("postalCode", v)} />
            <Field label="Country" value={form.country} onChange={(v) => set("country", v)} />
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <h2 className="font-semibold text-sm">Preferences</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-muted block">
              Preferred language
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                value={form.preferredLanguage}
                onChange={(e) => set("preferredLanguage", e.target.value)}
              >
                <option value="en">English</option>
                <option value="si">Sinhala</option>
                <option value="ta">Tamil</option>
              </select>
            </label>
            <Field label="Timezone" value={form.timezone} onChange={(v) => set("timezone", v)} />
          </div>
          <div className="space-y-2 pt-2">
            <Toggle
              label="Email notifications"
              checked={form.notifyEmail}
              onChange={(v) => set("notifyEmail", v)}
            />
            <Toggle
              label="WhatsApp notifications"
              checked={form.notifyWhatsApp}
              onChange={(v) => set("notifyWhatsApp", v)}
            />
            <Toggle
              label="SMS notifications (future)"
              checked={form.notifySms}
              onChange={(v) => set("notifySms", v)}
            />
            <Toggle
              label="Marketing updates"
              checked={form.marketingOptIn}
              onChange={(v) => set("marketingOptIn", v)}
            />
          </div>
        </section>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="font-semibold text-sm mb-3">Login history</h2>
        {loginHistory.length === 0 ? (
          <p className="text-sm text-muted">No login history recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {loginHistory.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
                <span className={l.success ? "text-success" : "text-red-400"}>
                  {l.success ? "Success" : "Failed"}
                </span>
                <span className="text-muted font-mono text-xs">{l.ip || "—"}</span>
                <span className="text-muted text-xs">
                  {new Date(l.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted mt-3">
          Password change and 2FA will connect in a later security pass. Sessions remain encrypted
          cookie-based.
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`text-xs text-muted block ${className || ""}`}>
      {label}
      <input
        required={required}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-white/20"
      />
      {label}
    </label>
  );
}
