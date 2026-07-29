-- Phase 2-7: Platform upgrade — project links, billing, domain docs, sales RBAC

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "erpProjectId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Project_erpProjectId_key" ON "Project"("erpProjectId");
CREATE INDEX IF NOT EXISTS "Project_erpProjectId_idx" ON "Project"("erpProjectId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_erpProjectId_fkey"
  FOREIGN KEY ("erpProjectId") REFERENCES "ErpProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "serviceProjectId" TEXT;
CREATE INDEX IF NOT EXISTS "Invoice_serviceProjectId_idx" ON "Invoice"("serviceProjectId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_serviceProjectId_fkey"
  FOREIGN KEY ("serviceProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "DomainDocStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CORRECTIONS_REQUESTED');
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "DomainRegistrationSubmission" (
    "id" TEXT NOT NULL,
    "projectServiceId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT,
    "purpose" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "letterheadUrl" TEXT,
    "supportingDocsJson" JSONB,
    "idDocsJson" JSONB,
    "status" "DomainDocStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    CONSTRAINT "DomainRegistrationSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesClientAssignment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "SalesClientAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrossClientAccessRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrossClientAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DomainRegistrationSubmission_projectServiceId_idx" ON "DomainRegistrationSubmission"("projectServiceId");
CREATE INDEX "DomainRegistrationSubmission_status_idx" ON "DomainRegistrationSubmission"("status");
CREATE INDEX "DomainRegistrationSubmission_deletedAt_idx" ON "DomainRegistrationSubmission"("deletedAt");
CREATE UNIQUE INDEX "SalesClientAssignment_agentId_clientId_key" ON "SalesClientAssignment"("agentId", "clientId");
CREATE INDEX "SalesClientAssignment_agentId_idx" ON "SalesClientAssignment"("agentId");
CREATE INDEX "SalesClientAssignment_clientId_idx" ON "SalesClientAssignment"("clientId");
CREATE INDEX "CrossClientAccessRequest_requesterId_idx" ON "CrossClientAccessRequest"("requesterId");
CREATE INDEX "CrossClientAccessRequest_clientId_idx" ON "CrossClientAccessRequest"("clientId");
CREATE INDEX "CrossClientAccessRequest_status_idx" ON "CrossClientAccessRequest"("status");

ALTER TABLE "DomainRegistrationSubmission" ADD CONSTRAINT "DomainRegistrationSubmission_projectServiceId_fkey"
  FOREIGN KEY ("projectServiceId") REFERENCES "ProjectService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DomainRegistrationSubmission" ADD CONSTRAINT "DomainRegistrationSubmission_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DomainRegistrationSubmission" ADD CONSTRAINT "DomainRegistrationSubmission_submittedBy_fkey"
  FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesClientAssignment" ADD CONSTRAINT "SalesClientAssignment_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesClientAssignment" ADD CONSTRAINT "SalesClientAssignment_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrossClientAccessRequest" ADD CONSTRAINT "CrossClientAccessRequest_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrossClientAccessRequest" ADD CONSTRAINT "CrossClientAccessRequest_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrossClientAccessRequest" ADD CONSTRAINT "CrossClientAccessRequest_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrossClientAccessRequest" ADD CONSTRAINT "CrossClientAccessRequest_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
