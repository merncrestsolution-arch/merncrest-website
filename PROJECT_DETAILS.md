# MernCrest Enterprise AI Platform — Foundation Bible

**Project:** MernCrest Enterprise AI Platform  
**Company:** MernCrest Solutions (Pvt) Ltd  
**Website:** https://merncrest.lk  
**Local:** http://localhost:3000  
**Package:** `web` @ `0.1.0`  
**Master Prompt:** Part 01 (this document is the foundation for all future development)

---

## Part 01 — Master Specification

### Project purpose

This is **not** just a company website.

This is a complete **Enterprise Digital Business Platform** — the company’s core operating system.

- Everything operates from **one centralized web application**
- Every module communicates through a **centralized architecture**
- The system must be **modular, scalable, and enterprise-grade**

### Business model

MernCrest is primarily:

- Enterprise Technology Company
- Software Development Company
- AI Solutions Provider
- Cloud Consulting Company
- Business Digital Transformation Partner

**Services offered:** Custom Software, Enterprise Software, ERP, CRM, HRM, AI Solutions, Business Automation, Website Development, Web Applications, Cloud Consulting, Digital Marketing, UI/UX, Business Intelligence, Analytics, IT Consulting, Managed IT Services.

**Also sold (reseller marketplace):** Domains, Hosting, VPS, Cloud Hosting, SSL, Business Email.

These products are **not** hosted by MernCrest. They are purchased from third-party providers and resold through the platform.

### Important business rule

| Never | Instead |
|-------|---------|
| Design as a Hosting Company | Design as a **Reseller Marketplace** |
| Assume MernCrest owns datacenters | Orchestrate **Provider APIs** |
| Assume MernCrest owns hosting servers | Support **multiple providers** |

```text
Customer → MernCrest Platform → Provider API → Customer receives service
```

### Primary goal

Build the most modern AI-powered enterprise platform.

- Every module reusable
- Every feature scalable
- Every API enterprise-standard
- Production-ready mindset

### System architecture

```text
Customers
    ↓
Public Website
    ↓
Customer Portal
    ↓
Communication Hub
    ↓
Business Core
    ↓
Admin Panel
    ↓
Database
    ↓
AWS Infrastructure
```

### Main platform modules (27)

1. Public Website  
2. Customer Portal  
3. Marketplace  
4. CRM  
5. Sales CRM  
6. ERP  
7. HRM  
8. Finance  
9. Inventory  
10. Procurement  
11. Manufacturing  
12. Supply Chain  
13. Project Management  
14. Asset Management  
15. Customer Support  
16. AI Assistant  
17. WhatsApp AI  
18. Live Chat  
19. IVR  
20. Billing  
21. Reports  
22. Analytics  
23. Admin Panel  
24. Staff Portal  
25. Knowledge Base  
26. Notification Center  
27. Settings  

### Public website

Professional landing pages, company profile, services, enterprise solutions, products, marketplace, portfolio, industries, pricing, blog, knowledge base, support center, contact, careers, partners, downloads, legal pages.

**UI source of truth (Google Stitch):**

- Project: [MernCrest Enterprise AI Platform](https://stitch.withgoogle.com/projects/17402065891171962495) (`17402065891171962495`)
- Design system: **Luminous Enterprise** — see [`.stitch/DESIGN.md`](.stitch/DESIGN.md) and [`.stitch/metadata.json`](.stitch/metadata.json)
- Screen exports: [`.stitch/html/`](.stitch/html/) + [`.stitch/designs/`](.stitch/designs/) (PNG references)
- Shell: `stitch-page` · `PageHero` · `stitch-page-body` · `stitch-card` (`#4a4455` borders, glass blur, luminous glow)
- Primitives: `components/ui/stitch.tsx`, `components/ui/page-hero.tsx`, `components/ui/brand-logo.tsx`
- Mapped screens → routes: Homepage `/` · Services `/services` · Marketplace `/products` · Contact `/contact` · Portal `/portal` · ERP SCM `/admin/erp/scm`
- **Rule:** Match Stitch layout/spacing/components; keep reseller/CRM/portal logic unchanged

### Customer portal

Dashboard, orders, invoices, domains, hosting, cloud, software, support tickets, downloads, notifications, settings.

### Marketplace

Domains, Hosting, Cloud, SSL, Business Email, Software, ERP, CRM, AI Products, Digital Services, Custom Development.

### Communication platform

Website · WhatsApp · Live Chat · Email · Customer Care — every conversation stored in CRM.

### AI platform

Help customers: search products, choose hosting/software, answer questions, create tickets, generate quotations, book meetings, summarize conversations, recommend services.

### ERP platform

HR, Finance, Inventory, Procurement, Manufacturing, Assets, Projects, Customer Service, Analytics, BI.

### Customer support channels

Website · WhatsApp · Live Chat · Email · Phone · Knowledge Base · IVR

### Roles (RBAC)

Guest · Customer · Sales · Support · Developer · Finance · HR · Manager · Administrator · Owner · CEO

*(Current auth roles: `CUSTOMER`, `STAFF`, `ADMIN`, `OWNER` + ERP `orgRole` presets. Expand toward full role matrix without breaking existing guards.)*

### Design system

**Google Stitch “Luminous Enterprise”** (marketing + shared dark surfaces):

- Dark enterprise UI · Violet brand (unchanged palette) · Responsive · Accessible · Fast · Professional
- Layout rhythm: 1440px container · consistent section padding · atmospheric page heroes
- Homepage sections compose `StitchSection` / `StitchHeader` / `StitchGrid` / `StitchCard` / `StitchReveal`
- Auth screens (`/login`, `/register`, `/forgot-password`) may keep centered form chrome; marketing pages must stay on the Stitch shell

### Coding standards

- Clean, reusable components — no duplicated business logic
- TypeScript everywhere · Prisma · SOLID · Clean Architecture
- Modular folders · Separate UI from business logic
- Every API validates input · consistent JSON responses

### Security

HTTPS · CSRF · XSS · SQL injection protection · Rate limiting · Audit logs · Role permissions · Email verification · 2FA-ready · Password hashing · Secure sessions

### Database rules

Normalize · UUIDs/CUIDs · Soft delete (target) · Audit tables · Created/Updated By · Created/Updated At

### Performance

Lazy loading · Image optimization · Server Components · Caching · Pagination · Search optimization · SEO · Accessibility

### Development rules (non-negotiable)

1. **Never remove existing features**
2. **Never break compatibility**
3. Always improve architecture
4. Always write scalable, enterprise-first code
5. Every new module must integrate with: **CRM · Notifications · Reports · Analytics · Permissions · Audit Logs**

---

## Tech Stack

| Layer | Current | Target (Part 01) |
|--------|---------|------------------|
| Framework | Next.js 14 App Router | Next.js 15 (upgrade without breaking features) |
| UI | React 18, TypeScript, Tailwind, shadcn/ui + Stitch primitives | Same + design system depth |
| Motion | Framer Motion (`StitchReveal`, page heroes) | Cinematic + purposeful motion |
| i18n | next-intl (`en`, `ta`, `si`) | Full copy localization |
| Theming | next-themes (dark default) + Stitch CSS vars | Keep Stitch palette; deepen tokens only if brand-approved |
| Images | `next/image` — Unsplash + `cdn.simpleicons.org` (see `next.config.mjs`) | Optional local brand assets under `public/` later |
| API | Next.js Route Handlers | Expand + optional Nest/Express later |
| Database | PostgreSQL via Docker (port 5434) | + Redis |
| ORM | Prisma | Same |
| Auth | Session cookies, bcrypt, RBAC | Session + JWT + RBAC + 2FA |
| Mail | Nodemailer / Brevo SMTP | Production SMTP |
| Infra | Docker Compose local | AWS · Docker · Nginx · PM2 · Cloudflare |

### Auth API

| Method | Path | Role |
|--------|------|------|
| POST | `/api/auth/register` | Create customer + profile + session |
| POST | `/api/auth/login` | Session login + login history |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Current user + profile |
| GET | `/api/auth/verify-email?token=` | Email verification |

### Commerce & reseller API

| Method | Path | Role |
|--------|------|------|
| GET | `/api/catalog` | Public SKUs (selling price only) |
| GET/POST/PATCH | `/api/cart` | Customer cart |
| GET/POST | `/api/orders` | Checkout (stores provider cost internally) |
| GET | `/api/invoices` | Customer invoices |
| GET/POST | `/api/payments/manual` | Bank transfer → admin verification |
| POST | `/api/payments/demo` | Dev demo pay |
| POST | `/api/payments/payhere/*` | Gateway stub (`PAYMENT_GATEWAY_ENABLED`) |
| GET/POST/PATCH/PUT | `/api/admin/providers` | Provider CRUD + product sync |
| GET/PATCH | `/api/admin/pricing-margins` | Category profit margins |
| GET/POST | `/api/admin/payments` | Approve/reject pending payments |
| GET/PATCH | `/api/admin/catalog` | Catalog + marketing overlays |
| POST | `/api/hosting/recommend` | AI hosting recommendation |
| GET | `/api/domains/search` | Domain search via Provider API |

### Support / CRM / ERP APIs (selected)

| Method | Path | Role |
|--------|------|------|
| GET/POST/PATCH | `/api/tickets` | Portal + staff tickets |
| GET/POST | `/api/chat` | Live AI chat |
| GET/POST/PUT | `/api/whatsapp` | WhatsApp stub + inbox |
| GET/POST/PATCH | `/api/callbacks` | IVR callback queue |
| GET/PATCH | `/api/notifications` | In-portal notifications |
| GET/POST/PATCH | `/api/crm` | CRM leads & pipeline |
| GET/POST/PATCH | `/api/quotations` | Quotes → order |
| GET/POST/PATCH | `/api/ivr` | IVR simulator |
| GET | `/api/admin/customers` | Customer directory |
| GET | `/api/admin/customers/[id]` | Customer 360 |

### Local database

```bash
npm run db:up          # docker compose postgres
npm run db:setup       # prisma generate + db push + seed
npm run dev
```

Seeded accounts (password `ChangeMe123!`):

- `owner@merncrest.lk` — OWNER → `/admin`
- `demo@merncrest.lk` — CUSTOMER → `/portal`

---

## Reseller architecture (implemented)

```text
Customer → MernCrest Website → Provider API → Customer receives service
```

- **Providers** configurable in Admin → Providers (multi-provider ready)
- **Pricing Engine:** Selling Price = Provider Price + Margin (domains, hosting, VPS, SSL, email, cloud)
- **Product Sync:** hosting / SSL / email packages from provider adapters
- **Payments:** manual / bank transfer + admin verification (gateways pluggable later)
- **Invoices:** MernCrest brand to customer; provider cost kept internally for profit

---

## Part 03 — Customer Portal (self-service)

The Customer Portal is the customer’s complete self-service workspace. Every registered customer has a unique profile (`customerCode`). Purchased services appear automatically after provider activation.

### Dashboard widgets

Welcome banner · Customer ID · Announcements · Domains / Hosting / Cloud / Software counts · Pending invoices · Open tickets · Notifications · Renewals (30 days) · Pending payments · Quotations · Recent orders · Active services · Recent activity · Quick actions

### Portal APIs

| Method | Path | Role |
|--------|------|------|
| GET | `/api/portal/dashboard` | Aggregated self-service dashboard |
| GET/PATCH | `/api/portal/profile` | Profile + preferences + login history |
| GET | `/api/portal/services` | Domains, hosting, subscriptions, projects |
| GET | `/api/portal/downloads` | Invoices PDF + manuals/licenses |
| GET | `/api/portal/activity` | Customer activity trail |
| GET | `/api/portal/announcements` | Active announcements |

### CRM integration

Register, checkout, tickets, and manual payment submissions write to:

- `CustomerActivity` (portal feed)
- `CrmLead` + `CrmActivity` (sales/support pipeline)
- `Notification` (portal alerts)

### Profile fields

Customer ID · photo URL · name · company · BR · NIC/passport · email · phone · WhatsApp · address · language · timezone · notify email/WhatsApp/SMS · marketing opt-in · login history

### Order statuses (canonical)

`DRAFT` · `PENDING` · `WAITING_PAYMENT` · `PAID` · `PROCESSING` · `PROVISIONING` · `COMPLETED` · `CANCELLED` · `REFUNDED`

---

## Part 04 — Omnichannel CRM & Communication Hub

Every channel feeds **one centralized CRM**. No isolated conversations.

```text
Customer → Website | WhatsApp | Live Chat | Email | IVR | Portal
    → Communication Hub → CRM → Sales / Support / Finance / Projects
```

### Lead stages (Kanban)

`NEW` · `ASSIGNED` · `QUALIFIED` · `MEETING` · `QUOTATION` · `NEGOTIATION` · `WON` · `LOST` · `ON_HOLD`  
(+ legacy `CONTACTED` maps into Qualified column)

### Models added/extended

- `CrmLead`: leadNumber, leadScore, timeline, expanded stages
- `CrmFollowUp`: CALL / WHATSAPP / EMAIL / MEETING / DEMO / REMINDER / ESCALATION
- `CrmMeeting`: consultation / online / office / technical / sales
- `CustomerSatisfaction`: CSAT + NPS
- Profile: assignedSalesId, assignedSupportId, customerRating

### APIs

| Method | Path | Role |
|--------|------|------|
| GET/POST/PATCH | `/api/crm` | Pipeline, leads, follow-ups, meetings, KPIs |
| GET | `/api/admin/communication-hub` | Omnichannel feed + stats |
| GET | `/api/admin/customers/[id]` | Customer 360 (services + WA + CRM + timeline) |
| GET/POST | `/api/csat` | Satisfaction / NPS |

Channel auto-CRM: WhatsApp, Live Chat, Email inbound, IVR all call `ensureLeadFromChannel`.

### Admin CRM UI

`/admin/crm` — Kanban drag-and-drop, list view, Communication Hub tab, follow-up scheduling, quick quotations.

### IVR menu (recorded voice only — no AI voice)

1 Sales · 2 Technical · 3 Hosting · 4 Domains · 5 Billing · 6 Enterprise · 7 Existing Customers · 8 Customer Care · 9 Voicemail

---

## Route map

### Public (`/{locale}/...`)

All listed routes use the **Stitch marketing shell** (PageHero + stitch cards/grids) unless noted as auth.

`/` · `/about` · `/services` · `/services/[slug]` · `/technologies` · `/domains` · `/hosting` · `/cloud` · `/solutions` · `/solutions/[slug]` · `/products` · `/products/[category]` · `/industries` · `/pricing` · `/portfolio` · `/portfolio/[id]` · `/blog` · `/blog/[slug]` · `/knowledge-base` · `/knowledge-base/[slug]` · `/downloads` · `/partners` · `/team` · `/support` · `/careers` · `/contact` · auth (`/login` · `/register` · `/forgot-password`) · legal (`/privacy` · `/terms` · `/sla` · `/aup` · `/refund` · `/cookie-policy` · `/domain-policy` · `/hosting-policy` · `/service-agreement`)

### Customer Portal (`/(portal)/`)

`/portal` (full dashboard) · services · cart · orders · domains · hosting · invoices · refunds · tickets · notifications · downloads · settings

### Admin (`/(admin)/`)

`/admin` · customers · orders · billing · **payments** · **providers** · **catalog** · crm · support · erp · reports · settings · `/staff`

---

## Design tokens (Stitch — do not recolor casually)

Defined in `app/globals.css` (`--stitch-*`) and mirrored in Tailwind / shadcn HSL tokens:

| Token | Value | Role |
|-------|--------|------|
| `--stitch-bg` | `#0e0e12` | Page background |
| `--stitch-surface` | `#131317` | Elevated surface |
| `--stitch-surface-low` | `#1b1b1f` | Low surface |
| `--stitch-surface-container` | `#1f1f23` | Containers |
| `--stitch-surface-high` | `#2a292e` | High contrast surface |
| `--stitch-on` | `#e5e1e7` | Primary text |
| `--stitch-muted` | `#ccc3d8` | Secondary text |
| `--stitch-primary` | `#7c3aed` | Brand violet |
| `--stitch-primary-glow` | `#d2bbff` | Glow / highlights |
| `--stitch-secondary` | `#3131c0` | Indigo secondary |
| `--stitch-outline` | `#4a4455` | Borders / outlines |

- Layout classes: `.stitch-container` (max 1440px) · `.stitch-section` · `.stitch-card` · `.stitch-page` · `.stitch-page-body` · `.brand-mesh`
- Fonts: Plus Jakarta Sans (display) · Inter (body) · JetBrains Mono (eyebrows / chips)
- **Marketing redesign rule:** align and compose with Stitch primitives; keep this palette; never invent a parallel color system

---

## Phase roadmap (v1.0 — revenue-first)

**Guiding principle:** Ship what generates revenue or unblocks operations first. Defer heavy enterprise modules until the core marketplace is live. Each phase should be independently launchable.

| Phase | Focus | Revenue | Status in this repo |
|-------|-------|---------|---------------------|
| **0** | Foundation & design system | Enabler | **Done** — Next.js 14, Prisma, Google Stitch project `17402065891171962495` (Luminous Enterprise) applied to public + portal/ERP shells; `.stitch/DESIGN.md` is the design source of truth. AWS Docker / production brand pack still open. |
| **1** | Website relaunch + marketplace core | **High — direct** | **Core shipped** — Stitch website + live Namecheap/DomainLK adapters + PayHere portal path + PENDING manual provision. Wire real API keys to go live. |
| **2** | Automation + CRM | High — scales Phase 1 | **Scaffold done** — CRM hub, tickets, WhatsApp hooks, invoices. Deepen live Meta + full order lifecycle after Phase 1 launch. |
| **3** | Internal ERP core | Indirect | **Scaffold done** — Org/HR/Finance/COA/Approvals/Audit/ESS. Do not deepen until Phase 1 is live. |
| **4** | AI layer | Medium | **Scaffold done** — chat/WhatsApp AI + hosting recommend. Live LLMs after real ticket/sales data. |
| **5** | Mobile staff app (Flutter) | Indirect | **Not started** — wait for stable CRM/ERP APIs. |
| **6** | Advanced enterprise (IVR, manufacturing, SCM, own infra, BI) | Situational | **Shells only** — defer deepening. |
| **7** | Scale / multi-tenant SaaS | Long-term | **Foundation only** (Organization → Branch). |

**Must-ship now:** Phase 0 polish + Phase 1 marketplace. Do not expand ERP / IVR / manufacturing until Phase 1 is generating orders.

**Still deepen later:** Full GL journals/AR/AP, biometric/GPS attendance, manufacturing costing, live LLM providers, Redis, soft-delete on all ERP entities, Next.js 15, full SaaS tenancy isolation, AWS production hardening.

---

## Phase 1 launch backlog (file-level)

### P0 — Launch blockers

| Ticket | Files / area | Done when |
|--------|--------------|-----------|
| **P1-01** Namecheap adapter | `lib/providers/namecheap-adapter.ts`, `lib/providers/registry.ts` | ✅ Implemented |
| **P1-02** DomainLK adapter | `lib/providers/domainlk-adapter.ts`, registry | ✅ Implemented |
| **P1-03** Seed live providers | `prisma/seed.ts` | ✅ Implemented |
| **P1-04** TLD routing | `lib/providers/registry.ts`, `lib/domains/registry.ts` | ✅ Implemented |
| **P1-05** PayHere portal checkout | `components/commerce/invoices-list.tsx`, `app/api/payments/payhere/*` | ✅ Implemented |
| **P1-06** Manual-assisted provision | `lib/services/fulfillment.ts` | ✅ Implemented |
| **P1-07** Env template | `.env.example` | ✅ Implemented |

### P1 — Already in place (verify, don’t rebuild)

- Public marketing pages on **Stitch shell** (PageHero / stitch-card / brand logos) · auth/register · cart → order → invoice
- Pricing engine (`lib/providers/pricing-engine.ts`) · admin margins
- Manual / bank transfer + admin verify (`app/api/payments/manual`, `app/api/admin/payments`)
- Portal: orders, invoices, domains, hosting, tickets
- Provider registry + mock adapter (dev fallback)
- Stitch UI kit: `components/ui/stitch.tsx`, `components/ui/page-hero.tsx`, `components/ui/brand-logo.tsx`, `lib/data/resources.ts` (partners + `techBrands`)

### P1 — After soft launch

- Full automation of renewals · transactional email polish · live Meta WhatsApp (Phase 2)

---

## Part 05 — ERP / Internal OS

Enterprise Resource Planning for MernCrest operations, designed multi-tenant ready.

### Surfaces

| Area | Path |
|------|------|
| ERP hub | `/admin/erp` |
| Organization & branches | `/admin/erp/organization` |
| Chart of Accounts | `/admin/erp/coa` |
| Approvals | `/admin/erp/approvals` |
| Audit logs | `/admin/erp/audit` |
| Staff ESS | `/staff` |

### New / deepened models

`Organization` · `Branch` · `AuditLog` · `ApprovalRequest` · `ChartOfAccount` · `SalarySlip`

### APIs

`/api/erp` · `/api/erp/org` · `/api/erp/audit` · `/api/erp/approvals` · `/api/erp/finance/coa` · `/api/erp/hr/salary-slips` · existing HR/Finance/Procurement/Inventory/Projects/… modules

### Integrations

Leave create → `ApprovalRequest` + audit · approval decide → notifications + audit · ESS returns slips & approvals · COA auto-seeds on first finance COA GET · seed creates MCS org + CMB-HO + COA + sample slip

### Module groups (20)

Organization · HRM · Finance · COA · Approvals · Procurement · Inventory · SCM · Manufacturing · Assets · ESM · FSM · Projects · CSM · IoT · Maintenance · AI · BI · DMS · Audit · Staff · Permissions · Dashboards

See `.cursor/rules/merncrest-part-05.mdc`.

---

## Objective

Build the most complete AI-powered Enterprise Digital Platform for MernCrest Solutions.

**Every future implementation must follow this Part 01 specification.**
