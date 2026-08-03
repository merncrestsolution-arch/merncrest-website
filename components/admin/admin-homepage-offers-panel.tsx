"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Loader2,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OfferRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: string | null;
  badge: string | null;
  category: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  featuresJson: string | null;
  gradientTheme: string;
  ctaText: string;
  ctaUrl: string | null;
  priority: number;
  sortOrder: number;
  isEnabled: boolean;
  status: string;
  startDate: string | null;
  endDate: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const EMPTY_FORM = {
  slug: "",
  title: "",
  description: "",
  price: "",
  badge: "",
  category: "",
  imageUrl: "",
  bannerImageUrl: "",
  features: "",
  gradientTheme: "blue",
  ctaText: "View Details",
  ctaUrl: "",
  priority: 0,
  sortOrder: 0,
  isEnabled: true,
  status: "DRAFT" as "DRAFT" | "PUBLISHED" | "EXPIRED",
  startDate: "",
  endDate: "",
  seoTitle: "",
  seoDescription: "",
};

function parseFeatures(json: string | null): string {
  if (!json) return "";
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join("\n") : "";
  } catch {
    return "";
  }
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminHomepageOffersPanel() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"image" | "banner" | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/offers");
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed to load offers");
    else {
      setOffers(d.offers ?? []);
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(offer: OfferRow) {
    setEditingId(offer.id);
    setForm({
      slug: offer.slug,
      title: offer.title,
      description: offer.description || "",
      price: offer.price || "",
      badge: offer.badge || "",
      category: offer.category || "",
      imageUrl: offer.imageUrl || "",
      bannerImageUrl: offer.bannerImageUrl || "",
      features: parseFeatures(offer.featuresJson),
      gradientTheme: offer.gradientTheme || "blue",
      ctaText: offer.ctaText || "View Details",
      ctaUrl: offer.ctaUrl || "",
      priority: offer.priority,
      sortOrder: offer.sortOrder,
      isEnabled: offer.isEnabled,
      status: offer.status as "DRAFT" | "PUBLISHED" | "EXPIRED",
      startDate: toDatetimeLocal(offer.startDate),
      endDate: toDatetimeLocal(offer.endDate),
      seoTitle: offer.seoTitle || "",
      seoDescription: offer.seoDescription || "",
    });
    setShowForm(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "banner") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind === "banner" ? "banner" : "image");
    const res = await fetch("/api/admin/offers/upload", { method: "POST", body: fd });
    const d = await res.json();
    setUploading(null);
    if (!res.ok) {
      setError(d.error || "Upload failed");
      return;
    }
    if (kind === "banner") setForm((f) => ({ ...f, bannerImageUrl: d.url }));
    else setForm((f) => ({ ...f, imageUrl: d.url }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const featuresArr = form.features
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description || null,
      price: form.price || null,
      badge: form.badge || null,
      category: form.category || null,
      imageUrl: form.imageUrl || null,
      bannerImageUrl: form.bannerImageUrl || null,
      featuresJson: JSON.stringify(featuresArr),
      gradientTheme: form.gradientTheme,
      ctaText: form.ctaText,
      ctaUrl: form.ctaUrl || `/offers/${form.slug}`,
      priority: Number(form.priority),
      sortOrder: Number(form.sortOrder),
      isEnabled: form.isEnabled,
      status: form.status,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      ...(editingId ? { id: editingId } : {}),
    };

    const res = await fetch("/api/admin/offers", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(d.error || "Save failed");
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    await load();
  }

  async function toggleEnabled(offer: OfferRow) {
    await fetch("/api/admin/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: offer.id, isEnabled: !offer.isEnabled }),
    });
    await load();
  }

  async function deleteOffer(id: string) {
    if (!confirm("Delete this offer permanently?")) return;
    await fetch(`/api/admin/offers?id=${id}`, { method: "DELETE" });
    await load();
  }

  const statusColor: Record<string, string> = {
    PUBLISHED: "text-emerald-600",
    DRAFT: "text-amber-600",
    EXPIRED: "text-rose-600",
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="stitch-page-title flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Homepage Offers
          </h1>
          <p className="stitch-page-sub">
            Website Management — promotional cards on the homepage carousel
          </p>
        </div>
        <button type="button" onClick={openCreate} className="stitch-btn-sm gap-2">
          <Plus className="h-4 w-4" />
          Create Offer
        </button>
      </div>

      {error ? <p className="stitch-auth-error !mb-4">{error}</p> : null}

      {showForm && (
        <section className="stitch-section-card !mb-6">
          <div className="stitch-section-head">
            <h3>{editingId ? "Edit Offer" : "New Offer"}</h3>
            <button type="button" className="stitch-btn-outline !text-xs" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="stitch-section-body grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Title *
              <input className="rlk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className="grid gap-1 text-sm">
              Slug *
              <input
                className="rlk-input font-mono text-sm"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Description
              <textarea className="rlk-input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Price
              <input className="rlk-input" placeholder="LKR 130,000.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Badge
              <input className="rlk-input" placeholder="HOT OFFER" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Category
              <input className="rlk-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Gradient Theme
              <select className="rlk-input" value={form.gradientTheme} onChange={(e) => setForm({ ...form, gradientTheme: e.target.value })}>
                <option value="blue">Blue (ERP / Business)</option>
                <option value="purple">Purple (Mobile / Apps)</option>
                <option value="green">Green (Finance)</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Features (one per line)
              <textarea className="rlk-input min-h-[100px] font-mono text-xs" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Inventory\nSales\nBilling"} />
            </label>

            <div className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Card Image</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="stitch-btn-outline !text-xs cursor-pointer gap-2">
                  {uploading === "image" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Upload Image
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleUpload(e, "image")} />
                </label>
                <input className="rlk-input flex-1 text-xs" placeholder="/uploads/offers/..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Banner Image</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="stitch-btn-outline !text-xs cursor-pointer gap-2">
                  {uploading === "banner" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Upload Banner
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e, "banner")} />
                </label>
                <input className="rlk-input flex-1 text-xs" placeholder="/uploads/offers/banners/..." value={form.bannerImageUrl} onChange={(e) => setForm({ ...form, bannerImageUrl: e.target.value })} />
              </div>
            </div>

            <label className="grid gap-1 text-sm">
              CTA Text
              <input className="rlk-input" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              CTA URL
              <input className="rlk-input" placeholder={`/offers/${form.slug || "slug"}`} value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Priority
              <input type="number" className="rlk-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm">
              Sort Order
              <input type="number" className="rlk-input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </label>
            <label className="grid gap-1 text-sm">
              Status
              <select className="rlk-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} />
              Enabled on homepage
            </label>
            <label className="grid gap-1 text-sm">
              Start Date
              <input type="datetime-local" className="rlk-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              End Date (Expiry)
              <input type="datetime-local" className="rlk-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              SEO Title
              <input className="rlk-input" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              SEO Description
              <textarea className="rlk-input min-h-[60px]" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
            </label>

            <button type="submit" disabled={saving} className="stitch-btn-sm sm:col-span-2 !w-fit gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update Offer" : "Create Offer"}
            </button>
          </form>
        </section>
      )}

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>All Offers ({offers.length})</h3>
        </div>
        <div className="stitch-section-body">
          {loading ? (
            <p className="text-sm" style={{ color: "var(--sp-muted)" }}>Loading…</p>
          ) : offers.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--sp-muted)" }}>No offers yet. Create your first promotional card.</p>
          ) : (
            offers.map((offer) => (
              <div key={offer.id} className="stitch-row">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong>{offer.title}</strong>
                    <span className={cn("text-xs font-mono uppercase", statusColor[offer.status])}>
                      {offer.status}
                    </span>
                    {offer.badge && (
                      <span className="text-[10px] rounded bg-orange-500/10 text-orange-600 px-2 py-0.5 font-bold">
                        {offer.badge}
                      </span>
                    )}
                  </div>
                  <span className="block text-xs font-mono mt-0.5" style={{ color: "var(--sp-muted)" }}>
                    /offers/{offer.slug} · Priority {offer.priority} · {offer.isEnabled ? "Enabled" : "Disabled"}
                    {offer.price ? ` · ${offer.price}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => toggleEnabled(offer)} title={offer.isEnabled ? "Disable" : "Enable"} className="stitch-btn-outline !p-2">
                    {offer.isEnabled ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => openEdit(offer)} className="stitch-btn-outline !p-2">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => deleteOffer(offer.id)} className="stitch-btn-outline !p-2 !text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
