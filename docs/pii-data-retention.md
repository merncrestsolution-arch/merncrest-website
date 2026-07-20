# PII data retention — NIC / Passport / BR

**Status:** Policy decision pending. Do **not** implement automatic deletion yet.

## Fields

| Field | Storage | Encryption |
|-------|---------|------------|
| `CustomerProfile.nicPassport` | PostgreSQL | AES-256-GCM via `lib/security/pii.ts` |
| `CustomerProfile.businessReg` | PostgreSQL | AES-256-GCM via `lib/security/pii.ts` |
| Order `registrantJson.nicOrBr` | PostgreSQL JSON | Prefer encrypt before snapshot |

## Access

- **Customer:** own portal profile (`/api/portal/profile`) — full decrypt for self-service.
- **Admin / Owner:** Customer 360 (`/api/admin/customers/[id]`) — decrypt + **AuditLog `pii.read`** on every admin read.
- **Staff (non-admin):** redacted or denied for these fields.

## Retention (TBD)

MernCrest retains identity documents for:

1. Domain registry / WHOIS compliance for active domains
2. Tax and invoicing audit trails
3. Fraud / chargeback disputes

Recommended next step: legal sign-off on a retention window (e.g. account lifetime + N years), then a scheduled soft-delete / purge job that also writes AuditLog entries.
