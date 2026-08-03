# System.merncrest.lk — Major Update (Cursor Cloud Agent Prompt)

Use this when a **major** staff-portal change touches multiple modules, APIs, Stitch screens, or shell navigation — not for small bugfixes or single-field edits.

**Run in:** Cursor **Cloud Agent** (isolated VM, full repo access, long-running tasks).

**Related docs:**
- Rule: `.cursor/rules/merncrest-part-06-staff-portal.mdc`
- Design skill: `.cursor/skills/staff-portal-design/SKILL.md`
- Master spec: `docs/staff-portal-master-prompt.md`
- A–Z guide: `docs/system-merncrest-complete-guide.md`
- Stitch tokens: `.stitch/DESIGN.md` · project `17402065891171962495`

---

## When to use Cloud Agent vs local Agent

| Use **Cloud Agent** | Use **local Agent** |
|---------------------|---------------------|
| New module or major UI rewrite (dashboard, live chat, billing hub, CRM panel) | Typo, single API fix, one component tweak |
| Sidebar / shell / cross-route navigation changes | CSS token adjustment in one file |
| Prisma schema + API + UI in one pass | Stitch export download only |
| 5+ files or new routes under `/staff/*` or system `/admin/*` | Documentation-only edits |

---

## Pre-flight (before pasting the prompt)

1. Commit or stash unrelated work on your branch.
2. List what changed recently on production `system.merncrest.lk` (screenshots or bullet list).
3. Pick the **module** from the table below.
4. Fill in the **Major update prompt** placeholders.
5. Start Cloud Agent on branch `feature/system-<module>-<date>` from `main`.

---

## Current module map (codebase truth)

| Module | Route(s) | Primary components / APIs |
|--------|----------|---------------------------|
| Dashboard | `/staff`, `/staff/command-center` | `components/staff/*`, `/api/staff/command-center` |
| Live chat | `/staff/live-chat` | SSE chat, smart context panel |
| Billing | `/staff/billing`, receipts, quotations | `components/staff/*`, billing APIs |
| Clients / CRM | `/staff/clients`, `/admin/crm` | `lib/crm/*`, `system-crm-panel` |
| Projects | `/staff/projects`, progress tracker | project panels, ERP projects |
| Tickets / Helpdesk | `/staff/tickets` | ticket APIs |
| Domains / DNS / Hosting | `/staff/domains`, dns, hosting, resources-hub | domain/hosting panels |
| Mailbox | `/staff/mailbox` | mail integration |
| AWS Cloud | `/staff/cloud` | `lib/cloud/aws-dashboard.ts` |
| Monitoring | `/staff/monitoring` | live probes |
| HR / ESS | attendance, leave, payslip, performance, training | ESS panels |
| Communications | announcements, notifications, internal chat | comms panels |
| Security / Roles | `/staff/security`, `/staff/roles` | RBAC, audit |
| ERP on system | `/admin/erp/*` on `system.*` | `StaffShell`, not `AdminShell` |

Shell (always): `components/staff/staff-shell.tsx` · CSS: `app/styles/stitch-portal.css` · Login: `components/auth/system-login-view.tsx`.

Local test: `http://localhost:3000/en/login?system=1` or host `system.merncrest.lk`.

---

## Major update prompt — copy into Cursor Cloud Agent

Replace `{{...}}` blocks. Paste everything below the line into a **new Cloud Agent** chat.

---

```
You are implementing a MAJOR update for MernCrest Enterprise Staff Portal (system.merncrest.lk).

## Mission
{{ONE_SENTENCE_GOAL}}
Example: "Redesign the staff billing hub with KPI strip, invoice table filters, and receipt quick-actions while keeping existing APIs."

## Scope
- Module(s): {{MODULE_NAMES}}
- Routes affected: {{ROUTES}}
- Out of scope (do NOT touch): {{OUT_OF_SCOPE}}

## What changed on production / design intent
{{BULLET_LIST_OF_NEW_FEATURES_OR_STITCH_NOTES}}
Attach screenshots or Stitch screen names if available.

## Mandatory reads (do this first)
1. `.cursor/rules/merncrest-part-06-staff-portal.mdc`
2. `.cursor/skills/staff-portal-design/SKILL.md`
3. `.stitch/DESIGN.md` (Luminous Enterprise system variant)
4. `components/staff/staff-shell.tsx` (navigation — extend, do not duplicate shell)
5. `app/styles/stitch-portal.css` (use existing `stitch-*` classes; no new random hex colors)
6. Relevant existing panel under `components/staff/` or `components/crm/system-*.tsx` for this module

## Architecture rules (non-negotiable)
- Deepen in place: Next.js App Router, `app/api/*`, Prisma — NO new NestJS app, NO `/apps/web` split.
- System surface: `StaffShell` on ALL `/staff/*` and `/admin/*` when host is `system.*` or `?system=1`.
- Do NOT remove or rebuild existing ERP, CRM, portal, chat, or commerce modules.
- Do NOT use Register.lk / light-teal legacy UI or marketing-site hero layouts on system routes.
- Migrate `rlk-*` to `stitch-*` only in files you touch.
- Customer-facing links in chat/email: `https://merncrest.lk` only (not system host).

## Integrations (every new write path)
Wire where applicable: CRM · Notifications · Reports/Analytics · Audit (`writeAuditLog`) · Permissions (`requirePermission`).
Reuse `lib/erp/*`, `lib/crm/*`, `lib/chat/*`, `lib/billing/*` — never duplicate domain logic.

## Design workflow
1. If no Stitch screen exists for this module, generate/update in Google Stitch project `17402065891171962495` (Luminous Enterprise, dark `#0e0e12`, primary `#7c3aed`).
2. Export reference to `.stitch/designs/staff-{{MODULE}}-merncrest.json` when possible.
3. Implement React to match Stitch: `stitch-page-head`, `stitch-stat-grid`, `stitch-card`, etc.
4. Verify side-by-side with Stitch export and local `?system=1`.

## API conventions
- REST under `app/api/staff/*`, `app/api/erp/*`, `app/api/crm/*`
- Zod validation, paginated lists, audit on mutations
- Extend Prisma schema only when needed — no parallel tables for clients/leads/projects

## Deliverables
1. Working UI on affected routes inside `StaffShell`
2. APIs validated and permission-guarded
3. Audit logs on material mutations
4. Short summary: files changed, how to test locally, any follow-up Stitch/Figma gaps

## Quality gates before you finish
- [ ] No new shell component — only `StaffShell`
- [ ] Tokens match `.stitch/DESIGN.md`
- [ ] Mobile: sidebar drawer works
- [ ] Accessible focus rings on dark surfaces
- [ ] No secrets committed
- [ ] Typecheck/lint clean on touched files

Do not create git commits unless I explicitly ask. Do not push unless I explicitly ask.
```

---

## Stitch screen prompt (companion — Google Stitch MCP or Stitch UI)

Use when Cloud Agent or you need a **new screen** before coding. Project ID: `17402065891171962495`.

```
Design a desktop screen for MernCrest Enterprise Staff Portal (system.merncrest.lk) — NOT the public marketing site.

Surface: Staff / system internal app (dark enterprise shell with left sidebar + top bar already exists; design ONLY the main content area unless login is requested).

Module: {{MODULE_NAME}}
Route: {{ROUTE}}
Purpose: {{WHAT_USERS_DO_HERE}}

Visual system — Luminous Enterprise (system variant):
- Background #0e0e12, surfaces #131317–#353439
- Primary #7c3aed, glow accents #d2bbff
- Typography: Plus Jakarta Sans headings, Inter body, JetBrains Mono labels/chips
- Cards: rounded-2xl, 1px border #4a4455, optional violet gradient border on featured KPI blocks
- Dark sidebar context — content area must match existing stitch-system aesthetic

Layout pattern:
- Page header: title, short subtitle, primary action button(s) on the right
- Optional KPI stat grid (4 cards max in first row)
- Primary content in stitch-card sections (tables with filters, forms, or split panels)

Content blocks to include:
{{LIST_UI_SECTIONS}}

States to show (if applicable): loading skeleton, empty state, error banner, success toast area.

Do NOT use: light gray Register.lk styling, marketing hero sections, red brand from public site, stock photo heroes.

Export naming: staff-{{MODULE}}-merncrest
```

---

## Example — filled prompt (billing hub major update)

```
## Mission
Upgrade `/staff/billing` to a billing command hub: revenue KPIs, overdue alerts, invoice table with status filters, and quick links to receipts and quotations.

## Scope
- Module(s): Finance / Billing
- Routes: `/staff/billing`, `/staff/receipts`, `/staff/quotations`
- Out of scope: payment gateway integration, customer portal invoices

## What changed on production / design intent
- KPI row: MTD revenue, outstanding, overdue count, collected this week
- Invoice table: search, status filter, client column, due date chips
- Sidebar billing group already exists — do not rename routes
```

---

## After Cloud Agent completes

1. Pull branch locally: `git fetch && git checkout feature/system-...`
2. Run app: `npm run dev` → login `?system=1`
3. Compare UI to Stitch export / Figma
4. Run tests on touched APIs if present
5. Deploy via existing `deploy/deploy.sh` when approved

---

*When implementing any module, read Part 06 rule + staff-portal-design skill first, then use this Cloud Agent prompt for major cross-cutting updates.*
