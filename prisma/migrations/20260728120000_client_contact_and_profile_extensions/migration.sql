-- ClientContact model + CustomerProfile extensions + Document.client link
-- Run: npx prisma migrate deploy

-- AlterTable CustomerProfile
ALTER TABLE "CustomerProfile" ADD COLUMN IF NOT EXISTS "companyWebsite" TEXT;
ALTER TABLE "CustomerProfile" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "CustomerProfile" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "CustomerProfile" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "CustomerProfile" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "CustomerProfile_deletedAt_idx" ON "CustomerProfile"("deletedAt");

-- AlterTable Document
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "customerProfileId" TEXT;
CREATE INDEX IF NOT EXISTS "Document_customerProfileId_idx" ON "Document"("customerProfileId");

-- CreateTable ClientContact
CREATE TABLE IF NOT EXISTS "ClientContact" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ClientContact_profileId_idx" ON "ClientContact"("profileId");
CREATE INDEX IF NOT EXISTS "ClientContact_deletedAt_idx" ON "ClientContact"("deletedAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Document" ADD CONSTRAINT "Document_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
