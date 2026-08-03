-- MernCrest Connect: staff signature, face enrollment, chat pins, attendance verify method
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "signatureJson" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "faceEnrollmentHash" TEXT;
ALTER TABLE "AttendanceRecord" ADD COLUMN IF NOT EXISTS "verifyMethod" TEXT;

CREATE TABLE IF NOT EXISTS "ChatSessionPin" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatSessionPin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChatSessionPin_agentId_sessionId_key" ON "ChatSessionPin"("agentId", "sessionId");
CREATE INDEX IF NOT EXISTS "ChatSessionPin_agentId_idx" ON "ChatSessionPin"("agentId");

DO $$ BEGIN
  ALTER TABLE "ChatSessionPin" ADD CONSTRAINT "ChatSessionPin_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "SupportAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChatSessionPin" ADD CONSTRAINT "ChatSessionPin_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
