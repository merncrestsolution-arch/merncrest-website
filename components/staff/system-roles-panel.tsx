"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Crown, Users, UserCog, User, UserX } from "lucide-react";
import { SYSTEM_ROLE_HIERARCHY } from "@/lib/erp/roles-hierarchy";
import { Link } from "@/i18n/routing";

const tierMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; chip: string; statAccent?: string }
> = {
  SUPER_ADMIN: { icon: Crown, chip: "stitch-chip stitch-badge-danger", statAccent: "var(--stitch-primary)" },
  DEPT_HEAD: { icon: UserCog, chip: "stitch-chip stitch-chip-violet" },
  TEAM_LEAD: { icon: Users, chip: "stitch-chip stitch-badge-done" },
  STAFF: { icon: User, chip: "stitch-chip stitch-badge-pending" },
  GUEST: { icon: UserX, chip: "stitch-chip" },
};

export function SystemRolesPanel() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SYSTEM_ROLE_HIERARCHY.map((r) => [r.tier, true]))
  );

  function toggle(tier: string) {
    setExpanded((prev) => ({ ...prev, [tier]: !prev[tier] }));
  }

  return (
    <div>
      <div className="stitch-breadcrumb">Dashboard &gt; Roles &amp; Permissions</div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Roles &amp; Permissions</h1>
          <p className="stitch-page-sub">
            Owner &amp; Admin have full access. All staff roles can use billing, CRM, projects, and
            operations — only staff/role management and destructive deletes are reserved for super
            admins.
          </p>
        </div>
        <Link href="/admin/erp/permissions" className="stitch-btn-primary-sm">
          Permissions matrix
        </Link>
      </div>

      <div className="stitch-stat-grid mb-6" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {SYSTEM_ROLE_HIERARCHY.map((role) => {
          const meta = tierMeta[role.tier] ?? tierMeta.STAFF;
          const Icon = meta.icon;
          const label = role.orgRoles[0] || role.userRoles?.[0] || role.tier;
          return (
            <div key={role.tier} className="stitch-stat-card">
              <div
                className="mb-2"
                style={{ color: meta.statAccent || "var(--sp-primary)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="stitch-stat-num text-lg">{label}</div>
              <div className="stitch-stat-label">{role.title.split("/")[0].trim()}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 mb-6">
        {SYSTEM_ROLE_HIERARCHY.map((role) => {
          const meta = tierMeta[role.tier] ?? tierMeta.STAFF;
          const isOpen = expanded[role.tier] !== false;
          const maps = [...role.orgRoles, ...(role.userRoles || [])];

          return (
            <section key={role.tier} className="stitch-section-card">
              <button
                type="button"
                className="stitch-section-head w-full text-left !cursor-pointer"
                onClick={() => toggle(role.tier)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--sp-muted)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--sp-muted)]" />
                  )}
                  <h3 className="m-0 truncate">{role.title}</h3>
                </div>
                <span className={meta.chip}>{role.tier.replace(/_/g, " ")}</span>
              </button>

              {isOpen ? (
                <div className="stitch-section-body">
                  <p className="stitch-page-sub !mb-3">{role.summary}</p>
                  {maps.length > 0 ? (
                    <p className="text-xs text-[var(--sp-muted)] mb-3">
                      Maps to: {maps.join(" · ")}
                    </p>
                  ) : null}

                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] mb-2">
                    Capabilities
                  </p>
                  <ul className="m-0 p-0 list-none">
                    {role.capabilities.map((c) => (
                      <li key={c.id} className="stitch-row">
                        <span className="text-sm">{c.label}</span>
                        <span className="stitch-chip !text-[10px] font-mono">{c.id}</span>
                      </li>
                    ))}
                  </ul>

                  {role.tier === "GUEST" ? (
                    <p className="mt-4 mb-0">
                      <a href="/en/portal?system=0" className="stitch-btn-sm">
                        Open Customer Portal →
                      </a>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Manage grants</h3>
          <Link href="/admin/erp/permissions" className="stitch-btn-primary-sm">
            Open permissions matrix
          </Link>
        </div>
        <div className="stitch-section-body">
          <p className="stitch-page-sub m-0">
            Assign <code className="text-xs">Employee.orgRole</code> (CEO, DEPT_HEAD, TEAM_LEAD,
            STAFF…) under Staff Management. Extra grants use <code className="text-xs">erp.*.view|manage</code>{" "}
            via the permissions panel.
          </p>
        </div>
      </section>
    </div>
  );
}
