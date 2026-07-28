"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Megaphone, Plus } from "lucide-react";
import { formatSriLankaDateTime } from "@/lib/timezone";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";

type Announcement = {
  id: string;
  title: string;
  body: string;
  bodyHtml?: string | null;
  tone: string;
  href?: string | null;
  status: string;
  audience: string;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

type Tab = "feed" | "manage";

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "PUBLISHED") return "success";
  if (status === "SCHEDULED") return "warning";
  if (status === "EXPIRED") return "destructive";
  return "secondary";
}

export function StaffAnnouncementsHub() {
  const [tab, setTab] = useState<Tab>("feed");
  const [feed, setFeed] = useState<Announcement[]>([]);
  const [adminList, setAdminList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    status: "DRAFT" as "DRAFT" | "SCHEDULED" | "PUBLISHED",
    audience: "ALL_STAFF" as "ALL_STAFF" | "ROLE" | "TEAM",
    scheduledFor: "",
  });

  const loadFeed = useCallback(() => {
    fetch("/api/staff/announcements")
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setFeed(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  const loadAdmin = useCallback(() => {
    fetch("/api/staff/announcements?admin=1")
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setAdminList(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadFeed(), loadAdmin()]).finally(() => setLoading(false));
  }, [loadFeed, loadAdmin]);

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          status: form.status,
          audience: form.audience,
          scheduledFor: form.status === "SCHEDULED" ? form.scheduledFor : null,
          surface: "STAFF",
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      setShowForm(false);
      setForm({ title: "", body: "", status: "DRAFT", audience: "ALL_STAFF", scheduledFor: "" });
      loadFeed();
      loadAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function publishNow(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      loadFeed();
      loadAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const displayList = tab === "feed" ? feed : adminList;

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Announcements</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title">Announcements</h1>
          <p className="stitch-page-sub !mb-0">
            Internal staff updates — published feed and admin scheduling.
          </p>
        </div>
        {tab === "manage" ? (
          <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New announcement
          </button>
        ) : null}
      </div>

      <div className="stitch-tab-row mb-4">
        <button type="button" className={tab === "feed" ? "active" : ""} onClick={() => setTab("feed")}>
          Feed ({feed.length})
        </button>
        <button
          type="button"
          className={tab === "manage" ? "active" : ""}
          onClick={() => setTab("manage")}
        >
          Manage
        </button>
        <Link href="/staff/notifications" className="stitch-btn-outline-sm ml-auto">
          Personal inbox
        </Link>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      {showForm ? (
        <section className="stitch-section-card mb-6">
          <div className="stitch-section-head">
            <h3>Create announcement</h3>
            <button type="button" className="stitch-btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <div className="stitch-section-body">
            <form onSubmit={createAnnouncement} className="grid gap-3 max-w-xl">
              <input
                className="stitch-input"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                className="stitch-input min-h-[120px]"
                placeholder="Message (supports plain text; HTML can be added via API)"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
              />
              <select
                className="stitch-input"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as "DRAFT" | "SCHEDULED" | "PUBLISHED",
                  })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Publish now</option>
              </select>
              {form.status === "SCHEDULED" ? (
                <input
                  className="stitch-input"
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                  required
                />
              ) : null}
              <select
                className="stitch-input"
                value={form.audience}
                onChange={(e) =>
                  setForm({
                    ...form,
                    audience: e.target.value as "ALL_STAFF" | "ROLE" | "TEAM",
                  })
                }
              >
                <option value="ALL_STAFF">All staff</option>
                <option value="ROLE">By system role</option>
                <option value="TEAM">By org role / team</option>
              </select>
              <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                Save
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : displayList.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Check back later or create one in Manage." />
      ) : (
        <div className="space-y-4">
          {displayList.map((a) => (
            <article key={a.id} className="stitch-section-card">
              <div className="stitch-section-body">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{a.title}</h3>
                  <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                </div>
                <p className="text-sm text-[var(--sp-muted)] mb-2">
                  {a.publishedAt
                    ? formatSriLankaDateTime(a.publishedAt)
                    : formatSriLankaDateTime(a.createdAt)}
                  · {a.audience}
                </p>
                <div className="text-sm whitespace-pre-wrap">{a.body}</div>
                {a.href ? (
                  <a href={a.href} className="text-violet-400 text-sm mt-2 inline-block" target="_blank" rel="noreferrer">
                    More info →
                  </a>
                ) : null}
                {tab === "manage" && a.status !== "PUBLISHED" ? (
                  <button
                    type="button"
                    className="stitch-btn-primary-sm mt-3"
                    disabled={busy}
                    onClick={() => publishNow(a.id)}
                  >
                    Publish now
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
