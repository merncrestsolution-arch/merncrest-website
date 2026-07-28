-- Phase 5 Invoice & Billing extensions

-- Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "domainId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "hostingAccountId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx" ON "Invoice"("projectId");
CREATE INDEX IF NOT EXISTS "Invoice_domainId_idx" ON "Invoice"("domainId");
CREATE INDEX IF NOT EXISTS "Invoice_hostingAccountId_idx" ON "Invoice"("hostingAccountId");
CREATE INDEX IF NOT EXISTS "Invoice_dueAt_idx" ON "Invoice"("dueAt");
CREATE INDEX IF NOT EXISTS "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");

-- Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "isAdvance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_deletedAt_idx" ON "Payment"("deletedAt");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_hostingAccountId_fkey" FOREIGN KEY ("hostingAccountId") REFERENCES "HostingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectPaymentSchedule" ADD CONSTRAINT "ProjectPaymentSchedule_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
