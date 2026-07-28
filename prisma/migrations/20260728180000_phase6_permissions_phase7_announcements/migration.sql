-- Phase 6 ProjectMember + Phase 7 Announcement extensions

-- ProjectMember
ALTER TABLE "ProjectMember" ADD COLUMN IF NOT EXISTS "accessLevel" TEXT NOT NULL DEFAULT 'edit';
ALTER TABLE "ProjectMember" ADD COLUMN IF NOT EXISTS "assignedById" TEXT;
ALTER TABLE "ProjectMember" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProjectMember" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProjectMember" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx" ON "ProjectMember"("userId");
CREATE INDEX IF NOT EXISTS "ProjectMember_deletedAt_idx" ON "ProjectMember"("deletedAt");

-- Announcement
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "bodyHtml" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "surface" TEXT NOT NULL DEFAULT 'PORTAL';
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "audience" TEXT NOT NULL DEFAULT 'ALL_STAFF';
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "audienceJson" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3);
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Announcement_surface_idx" ON "Announcement"("surface");
CREATE INDEX IF NOT EXISTS "Announcement_status_idx" ON "Announcement"("status");
CREATE INDEX IF NOT EXISTS "Announcement_scheduledFor_idx" ON "Announcement"("scheduledFor");
CREATE INDEX IF NOT EXISTS "Announcement_deletedAt_idx" ON "Announcement"("deletedAt");
