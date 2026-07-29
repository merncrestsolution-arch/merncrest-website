-- Phase 1: Multi-Service Projects, Domain & Hosting Management

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ServiceType" AS ENUM ('DOMAIN_REGISTRATION', 'HOSTING', 'SECURITY', 'SSL_CERTIFICATE', 'CLOUD_SERVICE', 'EMAIL_HOSTING', 'MAINTENANCE', 'BACKUP', 'OTHER');
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING_RENEWAL');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME');
CREATE TYPE "DomainStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TRANSFERRED', 'SUSPENDED');
CREATE TYPE "HostingStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectService" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "freePeriodDays" INTEGER,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'ANNUAL',
    "renewalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "metadata" JSONB,
    "reminderScheduleDays" INTEGER[] DEFAULT ARRAY[3]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "ProjectService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceDomain" (
    "id" TEXT NOT NULL,
    "projectServiceId" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "registrar" TEXT,
    "purchasedViaMernCrest" BOOLEAN NOT NULL DEFAULT false,
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "nameservers" TEXT[],
    "dnsRecords" JSONB,
    "domainStatus" "DomainStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "ServiceDomain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceDomainHistoryEntry" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ServiceDomainHistoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceHostingAccount" (
    "id" TEXT NOT NULL,
    "projectServiceId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "diskQuotaMb" INTEGER NOT NULL,
    "bandwidthQuotaMb" INTEGER NOT NULL,
    "diskUsedMb" INTEGER NOT NULL DEFAULT 0,
    "bandwidthUsedMb" INTEGER NOT NULL DEFAULT 0,
    "serverLocation" TEXT,
    "hostingStatus" "HostingStatus" NOT NULL DEFAULT 'ACTIVE',
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "ServiceHostingAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceHostingHistoryEntry" (
    "id" TEXT NOT NULL,
    "hostingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ServiceHostingHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

CREATE INDEX "ProjectService_projectId_idx" ON "ProjectService"("projectId");
CREATE INDEX "ProjectService_serviceType_idx" ON "ProjectService"("serviceType");
CREATE INDEX "ProjectService_status_idx" ON "ProjectService"("status");
CREATE INDEX "ProjectService_renewalDate_idx" ON "ProjectService"("renewalDate");
CREATE INDEX "ProjectService_deletedAt_idx" ON "ProjectService"("deletedAt");

CREATE UNIQUE INDEX "ServiceDomain_projectServiceId_key" ON "ServiceDomain"("projectServiceId");
CREATE INDEX "ServiceDomain_domainName_idx" ON "ServiceDomain"("domainName");
CREATE INDEX "ServiceDomain_expiryDate_idx" ON "ServiceDomain"("expiryDate");
CREATE INDEX "ServiceDomain_domainStatus_idx" ON "ServiceDomain"("domainStatus");
CREATE INDEX "ServiceDomain_deletedAt_idx" ON "ServiceDomain"("deletedAt");

CREATE INDEX "ServiceDomainHistoryEntry_domainId_idx" ON "ServiceDomainHistoryEntry"("domainId");
CREATE INDEX "ServiceDomainHistoryEntry_createdAt_idx" ON "ServiceDomainHistoryEntry"("createdAt");

CREATE UNIQUE INDEX "ServiceHostingAccount_projectServiceId_key" ON "ServiceHostingAccount"("projectServiceId");
CREATE INDEX "ServiceHostingAccount_hostingStatus_idx" ON "ServiceHostingAccount"("hostingStatus");
CREATE INDEX "ServiceHostingAccount_renewalDate_idx" ON "ServiceHostingAccount"("renewalDate");
CREATE INDEX "ServiceHostingAccount_expiryDate_idx" ON "ServiceHostingAccount"("expiryDate");
CREATE INDEX "ServiceHostingAccount_deletedAt_idx" ON "ServiceHostingAccount"("deletedAt");

CREATE INDEX "ServiceHostingHistoryEntry_hostingId_idx" ON "ServiceHostingHistoryEntry"("hostingId");
CREATE INDEX "ServiceHostingHistoryEntry_createdAt_idx" ON "ServiceHostingHistoryEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectService" ADD CONSTRAINT "ProjectService_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceDomain" ADD CONSTRAINT "ServiceDomain_projectServiceId_fkey" FOREIGN KEY ("projectServiceId") REFERENCES "ProjectService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceDomainHistoryEntry" ADD CONSTRAINT "ServiceDomainHistoryEntry_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "ServiceDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceHostingAccount" ADD CONSTRAINT "ServiceHostingAccount_projectServiceId_fkey" FOREIGN KEY ("projectServiceId") REFERENCES "ProjectService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceHostingHistoryEntry" ADD CONSTRAINT "ServiceHostingHistoryEntry_hostingId_fkey" FOREIGN KEY ("hostingId") REFERENCES "ServiceHostingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
