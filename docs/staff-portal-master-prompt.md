# MernCrest Solutions – Enterprise Staff Portal

**Master prompt reference** for `system.merncrest.lk`.  
**Implementation rule:** `.cursor/rules/merncrest-part-06-staff-portal.mdc`  
**Design workflow:** `.cursor/skills/staff-portal-design/SKILL.md` (Google Stitch + Figma strictly)

---

## Project overview

**Objective:** Enterprise-grade staff management and business operations portal for MernCrest Solutions (Sri Lankan import/export trading company + technology services).

**Scope:** Single integrated platform — clients, leads, projects, tickets, domains/hosting, cloud ops, finance, HR, real-time comms, AI, analytics.

**Target users:** Admin/Manager · Support · Sales · Developers · Finance.

---

## Technology (aligned to this repo)

| Spec suggestion | **Use in MernCrest repo** |
|-----------------|---------------------------|
| Next.js 15 | Next.js 14 App Router today → upgrade in place |
| NestJS backend | **Not separate** — `app/api/*` + `lib/*` |
| Prisma + PostgreSQL | ✅ `prisma/schema.prisma` |
| Auth.js / Clerk | ✅ Session RBAC (`lib/auth`) |
| Socket.IO | SSE today (`lib/chat/events.ts`) — Socket.IO later if needed |
| Redis / BullMQ | Redis in `docker-compose.prod.yml` |
| shadcn/ui + Tailwind | ✅ + Stitch system (`stitch-portal.css`) |
| Docker + Nginx + Lightsail | ✅ `deploy/deploy.sh` |

---

## Module index (25 modules)

Each module must integrate: CRM · Notifications · Reports · Audit · Permissions.

| # | Module | Key features |
|---|--------|----------------|
| 1 | **Dashboard & KPIs** | Revenue, leads, clients, projects, tickets, chats; charts; alerts; quick actions; calendar; expiry widgets; attendance snapshot |
| 2 | **Auth & security** | Session/JWT, 2FA TOTP, RBAC (6 roles + custom), audit logs, device history, IP rules, lockout, idle logout |
| 3 | **Live chat** | Visitor tracking, agent panel, typing/read receipts, attachments, AI suggest, transfer, CSAT, convert to lead/ticket, WhatsApp/email follow-up, SSE |
| 4 | **CRM** | Client directory, contacts, timeline, documents, payments, projects, segments, bulk actions |
| 5 | **Leads** | Multi-source capture, pipeline, scoring, assignment, follow-ups, proposals, Kanban, automation |
| 6 | **Projects** | Gantt/Kanban, milestones, tasks/subtasks, time tracking, files, Git links, budget, risks |
| 7 | **Tickets** | SLA, priorities, internal/public notes, escalation, merge, KB suggestions, CSAT |
| 8 | **Domains** | Inventory, registrar, expiry, DNS, SSL, Cloudflare status, renewal alerts |
| 9 | **Hosting** | Shared/VPS/cloud/dedicated; usage metrics; backups; credentials (encrypted) |
| 10 | **AWS cloud** | EC2, Lightsail, S3, RDS, Route53, IAM, CloudWatch, cost tracking |
| 11 | **Website monitoring** | Uptime, SSL, performance, incidents, alerts |
| 12 | **Server monitoring** | CPU/RAM/disk, Docker, PM2, Nginx, Postgres, Redis, logs |
| 13 | **Finance** | Quotations, invoices, receipts, payments, expenses, P&L, AR/AP |
| 14 | **Staff / HR** | Profiles, attendance, leave, payroll slips, performance, activity logs |
| 15 | **Calendar** | Events, recurrence, Google sync, rooms, leave overlay |
| 16 | **File manager** | Folders, versioning, sharing, quotas, virus scan |
| 17 | **Notifications** | In-app, email, SMS, WhatsApp, push; prefs, DND |
| 18 | **AI assistant** | Internal chatbot, email/proposal writer, ticket analysis, reports |
| 19 | **Reports** | Revenue, staff, projects, sales, hosting, tickets; PDF/Excel export |
| 20 | **Knowledge base** | SOPs, FAQs, videos, versioning, search |
| 21 | **Integrations** | WhatsApp, email, Zoom/Meet, Stripe/PayHere, GitHub, Slack, Cloudflare |
| 22 | **Settings** | Company, branding, SMTP, SMS, WhatsApp, payments, security, backup, theme, i18n |
| 23 | **Super admin** | Users, roles, permissions, logs, backup/restore, maintenance, feature flags |
| 24 | **Database schema** | Users, clients, leads, projects, tasks, tickets, invoices, domains, chats, employees, notifications, audit_logs |
| 25 | **Enterprise** | Multi-company/branch, EN/TA/SI, dark/light, PWA, offline queue, global search, webhooks, GDPR |

---

## Development phases

1. **Foundation (weeks 1–4)** — Auth/RBAC, dashboard skeleton, Docker dev, Stitch screens for core shell  
2. **Core (5–12)** — CRM, leads, projects, tickets, chat, finance, files  
3. **Advanced (13–18)** — Live chat full feature set, domain/hosting, monitoring, AWS, HR depth  
4. **Enterprise (19–24)** — Multi-tenant, KB, AI, integrations, PWA  
5. **Launch (25–26)** — Perf, security audit, UAT, production deploy  

---

## Design mandate

**Google Stitch** + **Figma** only for staff portal UI.  
- Stitch project: `17402065891171962495` (Luminous Enterprise)  
- Design tokens: `.stitch/DESIGN.md`  
- Implemented CSS: `app/styles/stitch-portal.css`  
- Shell: `components/staff/staff-shell.tsx`  

No Register.lk / legacy light-teal system UI.

---

## Git & quality

- Branch flow: `main` / `feature/*` / `hotfix/*`  
- Commits: `type(scope): subject` (feat, fix, docs, refactor, test, chore)  
- Tests: Jest unit + API integration + Playwright E2E for critical flows  
- Security: HTTPS, RBAC, validation, rate limits, audit logs, encrypted secrets  

---

## API surface (target)

Auth, users, clients, leads, projects, tasks, tickets, chats/messages, invoices/payments, domains, servers, reports, notifications, AI endpoints — implement under existing `app/api` namespaces; see Part 06 rule for current route map.

---

*This document is the condensed master spec. When implementing a module, read Part 06 rule + staff-portal-design skill first.*
