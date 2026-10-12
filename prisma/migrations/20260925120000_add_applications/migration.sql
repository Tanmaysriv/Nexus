CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "jobUrl" TEXT,
    "location" TEXT,
    "salary" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SAVED',
    "appliedAt" TIMESTAMP(3),
    "interviewAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Application_userId_status_updatedAt_idx" ON "Application"("userId", "status", "updatedAt");
CREATE INDEX "Application_userId_createdAt_idx" ON "Application"("userId", "createdAt");

ALTER TABLE "Application"
    ADD CONSTRAINT "Application_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
