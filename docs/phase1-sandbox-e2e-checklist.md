# Phase 1 marketplace — sandbox E2E checklist (Fix 7)

Do **not** mark Phase 1 launch-ready until this flow passes at least once end-to-end
**without** manual provisioning clicks (payment verification is the only manual step).

PayHere / card gateway is **out of scope** for this pass (`PAYMENT_GATEWAY_ENABLED=false`).

## Prerequisites

- [ ] `npx prisma db push` applied (includes `PROVISIONING_FAILED`, FX fields, payment receipt fields, margin mode)
- [ ] `npx tsx scripts/migrate-crm-contacted.ts` run once
- [ ] Seed / admin user available
- [ ] `NAMECHEAP_SANDBOX=true` (or mock adapter active without live creds)
- [ ] DomainLK sandbox or mock for `.lk`
- [ ] Bank account env vars set (Commercial + People's)

## Flow A — Namecheap gTLD (USD → LKR FX)

1. [ ] Domain search for a `.com` (or other gTLD) — confirm selling price is **LKR** and response includes `providerCurrency: "USD"`, `exchangeRate`, `fxBufferPercent`
2. [ ] Add to cart → checkout → order + invoice created (`WAITING_PAYMENT` / `PENDING` + invoice `SENT`)
3. [ ] Portal Billing: both bank accounts visible; upload receipt + reference number → payment `AWAITING_VERIFICATION`
4. [ ] Admin → Payments: item appears oldest-first with receipt thumbnail, ref, order lines; SLA flag if >2h
5. [ ] Approve → customer notified ("Payment confirmed…"); order → `PAID` → `PROVISIONING` → `COMPLETED` (or queued `PENDING` domain without live API)
6. [ ] Invoice `PAID`; portal services / domains list updated; invoice PDF available
7. [ ] AuditLog contains `payment.approve` + `domain.provision` / `domain.provision_queued`

## Flow B — DomainLK (.lk, LKR)

1. [ ] Search `.lk` domain — `providerCurrency: "LKR"` (no USD FX required)
2. [ ] Repeat cart → checkout → bank transfer + receipt → admin approve → auto-provision
3. [ ] Confirm DomainLK adapter (or mock) path used; order completes without second admin action

## Failure path (Fix 6)

1. [ ] Force provider failure (invalid API key / adapter throw) after a verified payment
2. [ ] Order status = `PROVISIONING_FAILED`; admin notified; customer notified ("may take a bit longer")
3. [ ] Admin → Orders filter **Provisioning failed** → **Retry provision** succeeds or remains escalated

## PII / CRM smoke

1. [ ] Portal settings: save NIC → DB value starts with `enc:v1:`
2. [ ] Admin Customer 360 (ADMIN/OWNER): PII decrypts; AuditLog `pii.read` written
3. [ ] Staff (non-admin): PII redacted
4. [ ] CRM Kanban: no `CONTACTED` column; no CONTACTED rows after migration

## Sign-off

| Role | Name | Date | Pass? |
|------|------|------|-------|
| Engineering | | | |
| Ops | | | |

**Launch gate:** All Flow A + Flow B checkboxes checked, and at least one Failure path observed.
