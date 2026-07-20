# P0 Bug Fix & Hardening — PR summary

## Summary

- Orders provision automatically once bank-transfer payment is verified (`PAID` → provider adapters with 3× retry; failures → `PROVISIONING_FAILED` + admin/customer notify + AuditLog). Manual **Retry provision** remains on Admin → Orders as fallback only.
- Admin → Payments **Pending Verification** queue is oldest-first with receipt, reference, order lines, and 2h SLA flags on one screen.
- NIC/passport (`nicPassport`) and BR (`businessReg`) are AES-256-GCM encrypted at rest; Admin/Owner reads are audited (`pii.read`); staff sees redacted values.
- Pricing is FX-safe for USD (Namecheap): rate locked at quote on cart/order lines, configurable FX buffer + percent margin mode in Admin → Pricing Margins.

## Migration notes (existing margin configs)

- New columns on `PricingMargin`: `marginMode` (default `FIXED`), `fxBufferPercent` (default `2`).
- Existing `marginCents` / `marginPercent` values are **not** rewritten. Changing mode only changes how those numbers are applied.
- New USD-priced quotes prefer percent margin when a percent is configured (does not mutate stored rows).
- Run once after deploy: `npx prisma db push` then `npm run migrate:crm-contacted`.

## Out of scope (unchanged)

ERP / IVR / manufacturing / SCM · RBAC expansion · Redis · PayHere build-out · WhatsApp/CRM beyond CONTACTED cleanup.

## Test plan

- [ ] Follow `docs/phase1-sandbox-e2e-checklist.md` (Namecheap + DomainLK sandbox, bank transfer → verify → auto-provision → invoice).
- [ ] Force provider failure → `PROVISIONING_FAILED` + Admin Orders filter + customer notify.
- [ ] Portal NIC save → DB `enc:v1:…`; Admin Customer 360 → AuditLog `pii.read`.
- [ ] CRM Kanban has no CONTACTED column after migration.

**Launch gate:** Do not mark Phase 1 launch-ready until the checklist E2E pass succeeds without manual provisioning clicks.
