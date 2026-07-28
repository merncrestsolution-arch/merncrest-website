-- Domain and HostingAccount extensions for Phase 3/4

-- Domain
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "registrar" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "registrationCostCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "isFreeProvided" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "freeDurationLabel" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "renewalPeriodMonths" INTEGER;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "renewalCostCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Domain_deletedAt_idx" ON "Domain"("deletedAt");

-- DnsRecord
ALTER TABLE "DnsRecord" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "DnsRecord" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "DnsRecord" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "DnsRecord_deletedAt_idx" ON "DnsRecord"("deletedAt");

-- HostingAccount
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "linkedDomainsJson" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "sslExpiresAt" TIMESTAMP(3);
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "panelUsernameEncrypted" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "panelPasswordEncrypted" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "databaseName" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "databaseUsernameEncrypted" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "databasePasswordEncrypted" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "serverIp" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "serverSpecs" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "serverLocation" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "renewalPeriodMonths" INTEGER;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "renewalCostCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "HostingAccount" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "HostingAccount_sslExpiresAt_idx" ON "HostingAccount"("sslExpiresAt");
CREATE INDEX IF NOT EXISTS "HostingAccount_deletedAt_idx" ON "HostingAccount"("deletedAt");
