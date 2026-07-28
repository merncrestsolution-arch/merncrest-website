"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { ProjectAccessLevel } from "@/shared/roles";

type Member = {
  id: string;
  userId: string;
  role: string;
  accessLevel: ProjectAccessLevel;
  user: { id: string; fullName: string; email: string };
};

export function ProjectTeamPanel({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffResults, setStaffResults] = useState<
    Array<{ id: string; fullName: string; email: string }>
  >([]);
  const [newAccess, setNewAccess] = useState<ProjectAccessLevel>("edit");

  const [canManage, setCanManage] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/staff/projects/${projectId}/members`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setMembers(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [projectId]);

  useEffect(() => {
    load();
    fetch("/api/staff/users")
      .then(async (r) => setCanManage(r.ok))
      .catch(() => setCanManage(false));
  }, [load]);

  useEffect(() => {
    if (!staffSearch || staffSearch.length < 2) {
      setStaffResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/staff/users?q=${encodeURIComponent(staffSearch)}`)
        .then(async (r) => {
          const d = await r.json();
          if (!d.success) throw new Error(d.error?.message ?? "Failed");
          setStaffResults(d.data ?? []);
        })
        .catch(() => setStaffResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [staffSearch]);

  async function addMember(userId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, accessLevel: newAccess }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      setShowAdd(false);
      setStaffSearch("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setAccess(userId: string, accessLevel: ProjectAccessLevel) {
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, accessLevel }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/staff/projects/${projectId}/members?userId=${userId}`,
        { method: "DELETE" }
      );
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stitch-section-card">
      <div className="stitch-section-head">
        <h3>Team &amp; access</h3>
        {canManage ? (
          <button type="button" className="stitch-btn-sm" onClick={() => setShowAdd((v) => !v)}>
            <UserPlus className="h-3.5 w-3.5" />
            Add member
          </button>
        ) : null}
      </div>
      <div className="stitch-section-body space-y-3">
        {error ? <p className="stitch-auth-error text-sm">{error}</p> : null}

        {showAdd && canManage ? (
          <div className="rounded-lg border border-[var(--sp-border)] p-3 space-y-2">
            <input
              className="stitch-input"
              placeholder="Search staff by name or email…"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
            />
            <select
              className="stitch-input"
              value={newAccess}
              onChange={(e) => setNewAccess(e.target.value as ProjectAccessLevel)}
            >
              <option value="view">View only</option>
              <option value="edit">Edit</option>
              <option value="admin">Admin</option>
            </select>
            {staffResults.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-[var(--sp-surface-2)]"
                disabled={busy}
                onClick={() => addMember(s.id)}
              >
                {s.fullName} · {s.email}
              </button>
            ))}
          </div>
        ) : null}

        {members.length === 0 ? (
          <p className="text-sm text-[var(--sp-muted)]">No members assigned.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-medium">{m.user.fullName}</span>
                <span className="text-[var(--sp-muted)] text-xs block">{m.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                {canManage ? (
                  <>
                    <select
                      className="stitch-input !w-auto !py-1 text-xs"
                      value={m.accessLevel}
                      disabled={busy}
                      onChange={(e) =>
                        setAccess(m.userId, e.target.value as ProjectAccessLevel)
                      }
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="button"
                      className="stitch-btn-danger-sm !p-1.5"
                      disabled={busy}
                      onClick={() => removeMember(m.userId)}
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="stitch-chip text-[10px]">{m.accessLevel}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
