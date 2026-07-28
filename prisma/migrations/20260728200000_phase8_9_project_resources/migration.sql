-- Phase 8+9: project dev notes, progress override, resources, backlog
ALTER TABLE "ErpProject" ADD COLUMN IF NOT EXISTS "developmentNotes" TEXT;
ALTER TABLE "ErpProject" ADD COLUMN IF NOT EXISTS "progressOverridePct" INTEGER;

CREATE TABLE IF NOT EXISTS "ProjectResource" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "gitRepoUrl" TEXT,
  "sourceCodeNotes" TEXT,
  "docsUrl" TEXT,
  "apiDocsUrl" TEXT,
  "deploymentMethod" TEXT,
  "lastDeployedAt" TIMESTAMP(3),
  "lastDeployedVersion" TEXT,
  "hostingAccountId" TEXT,
  "domainId" TEXT,
  "envVarsEncrypted" TEXT,
  "credentialsEncrypted" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProjectResource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectResource_projectId_key" ON "ProjectResource"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectResource_hostingAccountId_idx" ON "ProjectResource"("hostingAccountId");
CREATE INDEX IF NOT EXISTS "ProjectResource_domainId_idx" ON "ProjectResource"("domainId");
CREATE INDEX IF NOT EXISTS "ProjectResource_deletedAt_idx" ON "ProjectResource"("deletedAt");

ALTER TABLE "ProjectResource"
  ADD CONSTRAINT "ProjectResource_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectResource"
  ADD CONSTRAINT "ProjectResource_hostingAccountId_fkey"
  FOREIGN KEY ("hostingAccountId") REFERENCES "HostingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectResource"
  ADD CONSTRAINT "ProjectResource_domainId_fkey"
  FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProjectFutureImprovement" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'BACKLOG',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProjectFutureImprovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectFutureImprovement_projectId_idx" ON "ProjectFutureImprovement"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectFutureImprovement_status_idx" ON "ProjectFutureImprovement"("status");
CREATE INDEX IF NOT EXISTS "ProjectFutureImprovement_deletedAt_idx" ON "ProjectFutureImprovement"("deletedAt");

ALTER TABLE "ProjectFutureImprovement"
  ADD CONSTRAINT "ProjectFutureImprovement_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "ErpProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
