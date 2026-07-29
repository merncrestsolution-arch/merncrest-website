-- CreateEnum
CREATE TYPE "BusinessMailboxStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "BusinessMailbox" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'merncrest.lk',
    "passwordEnc" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "imapHost" TEXT,
    "imapPort" INTEGER NOT NULL DEFAULT 993,
    "status" "BusinessMailboxStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT,
    "provisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "BusinessMailbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMailbox_email_key" ON "BusinessMailbox"("email");

-- CreateIndex
CREATE INDEX "BusinessMailbox_userId_idx" ON "BusinessMailbox"("userId");

-- CreateIndex
CREATE INDEX "BusinessMailbox_projectId_idx" ON "BusinessMailbox"("projectId");

-- CreateIndex
CREATE INDEX "BusinessMailbox_status_idx" ON "BusinessMailbox"("status");

-- CreateIndex
CREATE INDEX "BusinessMailbox_deletedAt_idx" ON "BusinessMailbox"("deletedAt");

-- AddForeignKey
ALTER TABLE "BusinessMailbox" ADD CONSTRAINT "BusinessMailbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMailbox" ADD CONSTRAINT "BusinessMailbox_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
