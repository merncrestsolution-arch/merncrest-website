---
name: staff-portal-design
description: >-
  Google Stitch + Figma design workflow for system.merncrest.lk (Enterprise Staff
  Portal). Use when designing or implementing staff/system UI, dashboards,
  panels, login, or when the user mentions Stitch, Figma, staff portal design,
  or system.merncrest.lk look and feel.
---

# Staff Portal Design — Stitch + Figma (strict)

**All `system.merncrest.lk` UI must be designed in Google Stitch and Figma before (or alongside) code.**

Marketing site (`merncrest.lk`) uses the same **Luminous Enterprise** family but different layout patterns — do not copy marketing hero sections into the staff shell.

## Sources of truth

| Tool | Purpose | Location |
|------|---------|----------|
| **Google Stitch** | Screen layout, design system, dark enterprise aesthetic | Project `17402065891171962495` · `.stitch/DESIGN.md` · `.stitch/project.json` |
| **Figma** | Component specs, variants, spacing, redlines, design review | Team file (link in project when available) |
| **Code tokens** | Implemented CSS | `app/styles/stitch-portal.css` |
| **Shell** | Chrome for every authenticated page | `components/staff/staff-shell.tsx` |

## Major updates → Cursor Cloud Agent

For **major** system changes (new module, shell/nav rewrite, multi-route UI, schema + API + UI together), use the copy-paste prompt in `docs/system-major-update-cloud-agent-prompt.md` in a **Cursor Cloud Agent** session — not a quick local edit.

Small single-file fixes stay on local Agent.

## Workflow (required order)

1. **Stitch** — Generate or update the screen in Stitch (Staff Portal / System surface).
   - Export snapshot to `.stitch/designs/staff-{feature}-merncrest.json` (+ `.png` if exported).
   - Name pattern: `staff-portal-{module}.json` or `staff-{feature}-merncrest.json`.
2. **Figma** — Mirror the Stitch screen; define components (buttons, tables, cards, sidebar items).
   - States: default, hover, focus, disabled, loading, error.
   - Breakpoints: mobile (sidebar drawer), tablet, desktop.
3. **Implement** — Match Stitch/Figma in React:
   - Wrap pages in existing `StaffShell` (do not create a second shell).
   - Use `stitch-app stitch-system` classes and tokens from `stitch-portal.css`.
   - Prefer `components/ui/stitch.tsx` primitives where they exist.
4. **Verify** — Side-by-side with Stitch export; check `system.merncrest.lk` and local `?system=1`.

## Visual system (Luminous Enterprise — System variant)

From `.stitch/DESIGN.md`:

- **Background:** `#0e0e12` / surfaces `#131317`–`#353439`
- **Primary:** `#7c3aed` · glow `#d2bbff`
- **Typography:** Plus Jakarta Sans (headings) · Inter (body) · JetBrains Mono (labels/chips)
- **Cards:** rounded-2xl, `1px` border `#4a4455`, optional violet gradient border on featured blocks
- **Staff shell:** dark sidebar + topbar (see existing `stitch-sidebar`, `stitch-topbar`, `stitch-content`)

### System login

Use `components/auth/system-login-view.tsx` pattern: `stitch-auth` split hero + card form.

## Page patterns (inside `stitch-content`)

```tsx
<>
  <header className="stitch-page-head">
    <h1>Module title</h1>
    <p className="stitch-page-sub">Short description</p>
    <div className="stitch-page-actions">{/* primary CTA */}</div>
  </header>

  <div className="stitch-stat-grid">{/* KPI cards */}</div>

  <section className="stitch-card">
    <div className="stitch-card-head">
      <h2>Section</h2>
    </div>
    <div className="stitch-card-body">{/* table / form / list */}</div>
  </section>
</>
```

Use existing classes in `stitch-portal.css` — search before inventing new ones.

## Legacy `rlk-*` classes

Being phased out. When editing a panel that still uses `rlk-welcome`, `rlk-section`, etc., **convert to `stitch-*` equivalents** in the same PR. Bridge styles exist under `.stitch-app .rlk-*` in `stitch-portal.css` — do not add new `rlk-*` markup.

## Modules needing Stitch screens (priority)

Create Stitch + Figma for each before major UI rewrites:

1. Dashboard `/staff`
2. Live chat `/staff/live-chat`
3. Billing hub `/staff/billing`
4. Clients `/staff/clients`
5. Projects `/staff/projects`
6. Tickets `/staff/tickets`
7. Command center `/staff/command-center`

## Checklist before finishing UI

- [ ] Stitch screen exists and is referenced in `.stitch/metadata.json` (when updated)
- [ ] Figma component states documented
- [ ] Page uses `StaffShell` only (no marketing navbar)
- [ ] Tokens match `.stitch/DESIGN.md` (no ad-hoc hex colors)
- [ ] Mobile: sidebar drawer + horizontal scroll nav if needed
- [ ] Accessible focus rings and contrast on dark surfaces
- [ ] No Register.lk / light-gray portal styling on system routes

## Files to touch

- CSS: `app/styles/stitch-portal.css`
- Shell: `components/staff/staff-shell.tsx`
- Panels: `components/staff/*`, `components/erp/*`, `components/admin/system-*.tsx`
- Login: `components/auth/system-login-view.tsx`
