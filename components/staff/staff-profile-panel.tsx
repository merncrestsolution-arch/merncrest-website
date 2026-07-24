"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, MapPin, Pencil, Phone, User, X } from "lucide-react";

type ProfileData = {
  user?: { email: string; fullName: string };
  employee?: {
    fullName: string;
    jobTitle: string;
    orgRole: string;
    employeeCode?: string;
    email?: string;
    phone?: string;
    workPhone?: string;
    dateOfBirth?: string | null;
    hireDate?: string;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    department?: { name: string } | null;
    branch?: { name: string; city?: string | null } | null;
    manager?: { fullName: string } | null;
  } | null;
};

function initials(name?: string) {
  if (!name) return "MC";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="stitch-profile-row">
      <span className="stitch-profile-label">{label}</span>
      <span className="stitch-profile-value">{value}</span>
    </div>
  );
}

export function StaffProfilePanel() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(() => {
    fetch("/api/staff")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const emp = data?.employee;
  const email = emp?.email || data?.user?.email || "—";
  const location = emp?.branch
    ? [emp.branch.name, emp.branch.city].filter(Boolean).join(", ")
    : "—";

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Profile</div>
      <h1 className="stitch-page-title">Profile</h1>
      <p className="stitch-page-sub">Your employee information and job details.</p>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      <section className="stitch-section-card stitch-profile-header mb-6">
        <div className="stitch-section-body flex flex-wrap items-center gap-6 py-6">
          <div className="stitch-profile-avatar">{initials(emp?.fullName)}</div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-xl font-semibold m-0">{emp?.fullName || "—"}</h2>
            <p className="text-sm text-[var(--sp-muted)] mt-1 mb-0">
              {emp?.jobTitle || "Staff Member"}
            </p>
            {emp?.department ? (
              <p className="text-xs text-[var(--sp-muted)] mt-1 mb-0">{emp.department.name}</p>
            ) : null}
          </div>
          <button type="button" className="stitch-btn-sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </button>
        </div>
      </section>

      <div className="stitch-dash-grid-2 mb-6">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <User className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Personal Information
            </h3>
          </div>
          <div className="stitch-section-body">
            <InfoRow label="Email" value={email} />
            <InfoRow label="Phone" value={emp?.phone || "—"} />
            <InfoRow label="Work Phone" value={emp?.workPhone || "—"} />
            <InfoRow
              label="Date of Birth"
              value={
                emp?.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : "—"
              }
            />
            <InfoRow label="Location" value={location} />
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>
              <MapPin className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Job Information
            </h3>
          </div>
          <div className="stitch-section-body">
            <InfoRow label="Employee ID" value={emp?.employeeCode || "—"} />
            <InfoRow label="Department" value={emp?.department?.name || "—"} />
            <InfoRow label="Role" value={emp?.orgRole || "—"} />
            <InfoRow
              label="Join Date"
              value={emp?.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "—"}
            />
            <InfoRow label="Reporting Manager" value={emp?.manager?.fullName || "—"} />
          </div>
        </section>
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>
            <Phone className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Emergency Contact
          </h3>
        </div>
        <div className="stitch-section-body">
          <div className="stitch-dash-grid-2 !gap-4">
            <InfoRow label="Name" value={emp?.emergencyName || "—"} />
            <InfoRow label="Phone" value={emp?.emergencyPhone || "—"} />
          </div>
        </div>
      </section>

      {showEdit ? (
        <div className="stitch-modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="stitch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Edit Profile</h3>
              <button type="button" className="stitch-btn-icon" onClick={() => setShowEdit(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="stitch-modal-body space-y-3 text-sm">
              <p className="text-[var(--sp-muted)]">
                Profile updates are managed by HR. Contact your administrator or HR department to
                change personal or job information.
              </p>
              <div className="rounded-lg border border-[var(--sp-outline)] bg-[var(--stitch-surface-low)] p-3">
                <p className="flex items-center gap-2 m-0">
                  <Mail className="h-4 w-4 text-[var(--stitch-primary)]" />
                  hr@merncrest.lk
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowEdit(false)}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
