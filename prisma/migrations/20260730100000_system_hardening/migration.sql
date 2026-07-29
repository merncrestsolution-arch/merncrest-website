-- System hardening: GENERAL_STAFF org role, branch/org scoping, atomic quotation numbers, provider API audit

-- 1) Rename Employee.orgRole STAFF → GENERAL_STAFF
UPDATE "Employee" SET "orgRole" = 'GENERAL_STAFF' WHERE "orgRole" = 'STAFF';

ALTER TABLE "Employee" ALTER COLUMN "orgRole" SET DEFAULT 'GENERAL_STAFF';

-- 2) OrgNumberSequence: add branchId, extend unique constraint
ALTER TABLE "OrgNumberSequence" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "OrgNumberSequence_organizationId_kind_key";
CREATE UNIQUE INDEX IF NOT EXISTS "OrgNumberSequence_organizationId_branchId_kind_key"
  ON "OrgNumberSequence"("organizationId", "branchId", "kind");

-- 3) Tenant/branch scoping columns
ALTER TABLE "CrmLead" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "CrmLead" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "CrmLead_organizationId_branchId_idx" ON "CrmLead"("organizationId", "branchId");

ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "Ticket_organizationId_branchId_idx" ON "Ticket"("organizationId", "branchId");

ALTER TABLE "ErpProject" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "ErpProject" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "ErpProject_organizationId_branchId_idx" ON "ErpProject"("organizationId", "branchId");

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "Invoice_organizationId_branchId_idx" ON "Invoice"("organizationId", "branchId");

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Order_organizationId_branchId_idx" ON "Order"("organizationId", "branchId");

ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "branchId" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "Quotation_organizationId_branchId_idx" ON "Quotation"("organizationId", "branchId");
CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_organizationId_branchId_quoteNumber_key"
  ON "Quotation"("organizationId", "branchId", "quoteNumber");

-- 4) Backfill primary org + head-office branch for existing rows
DO $$
DECLARE
  org_id TEXT;
  branch_id TEXT;
BEGIN
  SELECT id INTO org_id FROM "Organization" WHERE "isPrimary" = true AND "deletedAt" IS NULL LIMIT 1;
  IF org_id IS NULL THEN
    SELECT id INTO org_id FROM "Organization" WHERE code = 'MCS' LIMIT 1;
  END IF;
  IF org_id IS NOT NULL THEN
    SELECT id INTO branch_id FROM "Branch" WHERE "organizationId" = org_id AND "isHeadOffice" = true AND "deletedAt" IS NULL LIMIT 1;
    IF branch_id IS NULL THEN
      SELECT id INTO branch_id FROM "Branch" WHERE "organizationId" = org_id AND "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1;
    END IF;
    IF branch_id IS NOT NULL THEN
      UPDATE "CrmLead" SET "organizationId" = org_id, "branchId" = branch_id WHERE "organizationId" IS NULL;
      UPDATE "Ticket" SET "organizationId" = org_id, "branchId" = branch_id WHERE "organizationId" IS NULL;
      UPDATE "ErpProject" SET "organizationId" = org_id, "branchId" = branch_id WHERE "organizationId" IS NULL;
      UPDATE "Invoice" SET "organizationId" = org_id, "branchId" = branch_id WHERE "organizationId" IS NULL;
      UPDATE "Order" SET "organizationId" = org_id, "branchId" = branch_id WHERE "organizationId" IS NULL;
      UPDATE "Quotation" SET "organizationId" = org_id, "branchId" = branch_id WHERE "organizationId" IS NULL;
    END IF;
  END IF;
END $$;

-- 5) Provider API audit log
CREATE TABLE IF NOT EXISTS "ProviderApiCallLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "orderItemId" TEXT,
  "providerId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestJson" TEXT NOT NULL,
  "responseJson" TEXT,
  "httpStatus" INTEGER,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "errorMessage" TEXT,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderApiCallLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProviderApiCallLog_orderId_idx" ON "ProviderApiCallLog"("orderId");
CREATE INDEX IF NOT EXISTS "ProviderApiCallLog_idempotencyKey_operation_idx" ON "ProviderApiCallLog"("idempotencyKey", "operation");
CREATE INDEX IF NOT EXISTS "ProviderApiCallLog_providerId_idx" ON "ProviderApiCallLog"("providerId");
CREATE INDEX IF NOT EXISTS "ProviderApiCallLog_createdAt_idx" ON "ProviderApiCallLog"("createdAt");

-- QUOTATION sequences seeded via ensureOrgNumberSequences() on deploy/seed
