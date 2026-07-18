# MernCrest Solutions Pvt Ltd — Complete Platform Bible

**Brand:** MernCrest Solutions (Pvt) Ltd  
**Website:** https://merncrest.lk  
**Local:** http://localhost:3000  
**Package:** `web` @ `0.1.0`

---

## 1. Vision

MernCrest is an **AI-powered Enterprise Technology Company** providing end-to-end digital business solutions through a single integrated web platform:

- Company Website
- Customer Portal
- AI Customer Support
- WhatsApp Automation
- Customer Care (IVR)
- CRM & Sales CRM
- ERP & Internal Operations
- Billing & Marketplace (Domains, Hosting, Software, Cloud, Security, Email)
- Enterprise Business Solutions
- Analytics & Reporting

Everything operates from **one centralized system**.

---

## 2. Tech Stack (Current + Target)

| Layer | Current (Phase 1–2) | Target |
|--------|---------------------|--------|
| Framework | Next.js 14 App Router | Same + monorepo `apps/web` |
| UI | React 18, TypeScript, Tailwind, shadcn/ui | Ocean-crest design system |
| Motion | Framer Motion | Cinematic hero + scroll motion |
| i18n | next-intl (`en`, `ta`, `si`) | Full copy localization over time |
| Theming | next-themes (dark default) | Navy/teal tokens |
| API | Next.js Route Handlers (`/api/auth/*`) | Expand + optional Nest/Express later |
| Database | SQLite local / PostgreSQL via Docker | + Redis (Phase 3+) |
| Auth | Session cookies, bcrypt, RBAC roles | + 2FA (later) |
| Mail | Nodemailer / Brevo SMTP (optional) | Production SMTP |
| Infra | Docker Compose Postgres local / future AWS | Ubuntu, Nginx, Docker, PM2, Cloudflare, SSL |

### Auth API (Phase 2)

| Method | Path | Role |
|--------|------|------|
| POST | `/api/auth/register` | Create customer + profile + session |
| POST | `/api/auth/login` | Session login + login history |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Current user + profile |
| GET | `/api/auth/verify-email?token=` | Email verification |

### Commerce API (Phase 3)

| Method | Path | Role |
|--------|------|------|
| GET | `/api/catalog` | Public product SKUs |
| GET/POST/PATCH | `/api/cart` | Customer cart |
| GET/POST | `/api/orders` | List orders / checkout |
| GET | `/api/invoices` | Customer invoices |
| POST | `/api/payments/demo` | Demo pay invoice |
| GET | `/api/admin/commerce` | Staff orders + billing stats |

| GET/POST/PATCH | `/api/tickets` | Portal + staff tickets |
| GET/POST | `/api/chat` | Live AI chat sessions |
| GET/POST/PUT | `/api/whatsapp` | WhatsApp webhook stub + inbox |
| GET/POST/PATCH | `/api/callbacks` | IVR callback queue |
| GET/PATCH | `/api/notifications` | In-portal notifications |
| GET/POST/PATCH | `/api/crm` | Staff CRM leads & pipeline |
| GET/POST/PATCH | `/api/quotations` | Quotes; accept → order |
| GET/POST/PATCH | `/api/ivr` | IVR call simulator + logs |
| POST | `/api/email/inbound` | Email → support ticket |
| GET | `/api/admin/customers` | Customer directory |
| GET | `/api/admin/customers/[id]` | Customer 360 profile |

Roles: `CUSTOMER`, `STAFF`, `ADMIN`, `OWNER`. Portal requires login; Admin requires staff roles.

### Local database

Default local DB is **PostgreSQL via Docker** on port **5434**.

```bash
npm run db:up          # docker compose postgres
npm run db:setup       # prisma generate + db push + seed
npm run dev
```

For Vercel, set `DATABASE_URL` to a hosted Postgres (Neon/Supabase) with `sslmode=require`, then run `db:setup` against that URL once.

Seeded accounts (password `ChangeMe123!`):
- `owner@merncrest.lk` — OWNER → `/admin`
- `demo@merncrest.lk` — CUSTOMER → `/portal`


---

## 3. Architecture

```text
                    Customers
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
 Website            WhatsApp          Customer Care
      │                  │                  │
      └──────────────┬───┴──────────────────┘
                     │
              Live Chat & Email
                     │
              MERNCREST API PLATFORM
                     │
 ┌──────────────────────────────────────────────────┐
 │ CRM │ ERP │ Billing │ Orders │ Domains │ Hosting │
 │ Projects │ Finance │ HR │ Analytics │ Support   │
 └──────────────────────────────────────────────────┘
                     │
             PostgreSQL + Redis
                     │
               AWS Cloud Infrastructure
```

---

## 4. Phase Roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **1** | Public platform rebuild + portal/admin/auth shells + cinematic UI | Done |
| **2** | Core API + Auth (PostgreSQL, email verify, RBAC) | Done |
| **3** | Commerce (catalog, orders, invoices, payments) | Done |
| **4** | Domains & Hosting adapters | Done (Part 03 — mock registry + auto-provision) |
| **5** | Support (tickets, live chat, KB CMS) | Done (Part 04) |
| **6** | CRM + Sales pipeline | Done (Part 04) |
| **7** | WhatsApp AI (EN/TA/SI) | Done (stub + AI replies; live Meta API later) |
| **8** | Internal ERP modules | Done (Part 05) |
| **9** | Projects + server monitoring + status page | Partial (ERP projects done; monitoring later) |
| **10** | Landline IVR + callbacks | Done (callback queue; telephony later) |
| **11** | AWS production hardening | Planned |

---

## 5. Public Website IA (`/{locale}/...`) — Part 02 aligned

| Route | Role |
|-------|------|
| `/` | Home — hero, highlights, featured services, why-us, platform, solutions, portfolio, testimonials, blog, CTA |
| `/about` | Company story |
| `/services` | Service catalog |
| `/domains` | Domain landing + catalog |
| `/hosting` | Hosting landing + catalog |
| `/cloud` | Cloud solutions landing |
| `/solutions` | Enterprise solutions |
| `/products` | Marketplace hub |
| `/industries` | Industries |
| `/pricing` | Pricing |
| `/portfolio` | Case studies |
| `/blog` | Blog |
| `/knowledge-base` | KB |
| `/downloads` | Brochures & resources |
| `/partners` | Technology partners |
| `/support` | Support Center |
| `/careers` | Jobs |
| `/contact` | Contact |
| `/login` `/register` `/forgot-password` | Auth |
| Legal | privacy, terms, refund, policies, SLA… |

Portal: overview widgets, My Services, cart, orders, domains, hosting, billing, support, notifications, settings.


### Customer Portal (`/(portal)/`)

| Route | Role |
|-------|------|
| `/portal` | Overview dashboard |
| `/portal/orders` | Orders |
| `/portal/domains` | Domains |
| `/portal/hosting` | Hosting / VPS / Cloud |
| `/portal/invoices` | Invoices & payments |
| `/portal/tickets` | Support tickets |
| `/portal/downloads` | Downloads / licenses |
| `/portal/settings` | Account settings |

### Admin (`/(admin)/`)

| Route | Role |
|-------|------|
| `/admin` | Owner dashboard |
| `/admin/customers` | Customers |
| `/admin/orders` | Orders |
| `/admin/billing` | Billing |
| `/admin/crm` | CRM |
| `/admin/support` | Support |
| `/admin/erp` | Full ERP hub (5.1–5.20 module map) |
| `/staff` | Internal staff portal (ESS, tasks, chat) |
| `/admin/reports` | BI / Reports |
| `/admin/settings` | Settings |

---

## 6. Design System (Phase 1)

- **Direction:** Ocean-crest — deep navy surfaces, electric teal accents
- **Fonts:** Syne (display) + Manrope (body) + JetBrains Mono
- **Hero:** Full-bleed muted video atmosphere; brand + one headline + one line + CTA group
- **Motion:** Page transitions, scroll reveals, ambient gradient drift
- Avoid purple-indigo default AI look

---

## 7. Marketplace Categories

- Domains (.lk, .com, .net, .org, TLDs)
- Hosting (Shared, cPanel, Business, VPS, Cloud, AWS, Managed)
- Software (Websites, E-Commerce, ERP, CRM, POS, HR, Custom)
- Digital Services (UI/UX, Branding, SEO, Marketing)
- Cloud Services (AWS, Migration, Management, Security)
- Security (SSL, Protection, Backup, Firewall, Monitoring)
- Business Email (Professional, Google Workspace, Microsoft 365)

---

## 8. Enterprise Solutions

ERP, EAM, ESM, FSM, Project Management, Supply Chain, Finance, HR, Manufacturing, AI & Cloud, IIoT, Predictive Maintenance, Analytics, CSM — plus Document, Inventory, Warehouse, Fleet, Visitor, LMS, Workflow, Procurement, Multi-Company/Branch, BI.

---

## 9. Security Targets

SSL, 2FA, email verification, login history, device management, audit logs, RBAC, CAPTCHA, rate limiting, daily backups.

---

## 10. Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 → redirects to `/en`.

---

## 11. Explicit Phase Boundaries

**Phase 1 done:** Public IA, cinematic UI, static marketplace/KB/pricing data, portal/admin shells.

**Phase 2 done:** Auth (register/login/session), RBAC portal/admin guards, Prisma + PostgreSQL.

**Phase 3 / Part 03 done:** Catalog SKUs (domains, hosting tiers, SSL, email), cart with registrant + coupons, checkout → order + invoice, demo + PayHere checkout stubs, domain search (SL + intl TLDs), DNS/lock/auto-renew, hosting dashboard metrics, auto-provisioning after payment, invoice HTML/PDF print, refund requests, activation emails (SMTP when configured).

**Part 04 done:** Tickets + replies + CSAT, live AI chat (KB-aware, handoff → ticket), WhatsApp business menu (domain search, orders, invoices, tickets, human handover, EN/TA/SI detection), IVR simulator (language/department → call log + callback + CRM), email→ticket stub, quotations (accept → order), Customer ID 360 profiles, Admin CRM pipeline (NEW→WON), Support inbox (tickets/callbacks/WhatsApp/IVR).

**Part 05 done (full blueprint map):** 20 ERP sections (5.1–5.20) as navigable modules — Overview, HRM (+ attendance/recruitment/payroll APIs), Finance, Procurement, Inventory, SCM, Manufacturing (BOM/MO), EAM, ESM, FSM, Projects, CSM (via Support), IoT, Predictive Maintenance, AI assistant, BI, DMS, Staff Portal, Roles/Permissions (org-role presets), Executive Dashboards. Granular `erp.*.view|manage` ACL + Employee.orgRole presets (CEO→Auditor).

**Next blueprint parts:** Part 06 Admin panel depth · Part 07 AWS/DevOps/Security · Part 08 UI/UX/SOP.

**Still stubs / deepen later:** Full GL/AR/AP ledgers, barcode hardware, GPS route optimization, OCR, live LLM providers, multi-company consolidation, Redis.
