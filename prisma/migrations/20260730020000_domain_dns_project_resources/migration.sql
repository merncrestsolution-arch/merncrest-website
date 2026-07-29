-- Domain, hosting, git, and DNS change request extensions (Req 29-37)

ALTER TABLE "ServiceDomain" ADD COLUMN IF NOT EXISTS "domainExtension" TEXT;
ALTER TABLE "ServiceDomain" ADD COLUMN IF NOT EXISTS "renewalDate" TIMESTAMP(3);
ALTER TABLE "ServiceDomain" ADD COLUMN IF NOT EXISTS "registrationPeriodMonths" INTEGER;
ALTER TABLE "ServiceDomain" ADD COLUMN IF NOT EXISTS "dnsZone" TEXT;
ALTER TABLE "ServiceDomain" ADD COLUMN IF NOT EXISTS "sslCertificateStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "ServiceDomain" ADD COLUMN IF NOT EXISTS "autoRenew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ServiceDomain" ADD COLUMN IF NOT EXISTS "whoisStatus" TEXT;

CREATE INDEX IF NOT EXISTS "ServiceDomain_renewalDate_idx" ON "ServiceDomain"("renewalDate");

ALTER TABLE "ServiceHostingAccount" ADD COLUMN IF NOT EXISTS "serverStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "ServiceHostingAccount" ADD COLUMN IF NOT EXISTS "cpuUsagePct" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ServiceHostingAccount" ADD COLUMN IF NOT EXISTS "memoryUsagePct" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ServiceHostingAccount" ADD COLUMN IF NOT EXISTS "sslStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "ServiceHostingAccount" ADD COLUMN IF NOT EXISTS "uptimePct" DOUBLE PRECISION NOT NULL DEFAULT 100;

ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "gitProvider" TEXT;
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "defaultBranch" TEXT;
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "deploymentBranch" TEXT;
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "latestCommitSha" TEXT;
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "latestCommitMessage" TEXT;
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "latestCommitAt" TIMESTAMP(3);
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "repositoryStatus" TEXT DEFAULT 'UNKNOWN';
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "devEnvironmentUrl" TEXT;
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "productionEnvironmentUrl" TEXT;
ALTER TABLE "ProjectResource" ADD COLUMN IF NOT EXISTS "clientCanViewGit" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Domain" ADD COLUMN IF NOT EXISTS "managedByMernCrest" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "DnsChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED');

CREATE TABLE "DnsChangeRequest" (
    "id" TEXT NOT NULL,
    "serviceDomainId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "DnsChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "proposedRecords" JSONB NOT NULL,
    "clientNotes" TEXT,
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "DnsChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DnsChangeRequest_serviceDomainId_idx" ON "DnsChangeRequest"("serviceDomainId");
CREATE INDEX "DnsChangeRequest_requestedBy_idx" ON "DnsChangeRequest"("requestedBy");
CREATE INDEX "DnsChangeRequest_status_idx" ON "DnsChangeRequest"("status");
CREATE INDEX "DnsChangeRequest_deletedAt_idx" ON "DnsChangeRequest"("deletedAt");

ALTER TABLE "DnsChangeRequest" ADD CONSTRAINT "DnsChangeRequest_serviceDomainId_fkey" FOREIGN KEY ("serviceDomainId") REFERENCES "ServiceDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DnsChangeRequest" ADD CONSTRAINT "DnsChangeRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DnsChangeRequest" ADD CONSTRAINT "DnsChangeRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
