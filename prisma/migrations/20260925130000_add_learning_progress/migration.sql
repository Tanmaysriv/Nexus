CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "resourceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "practiceNotes" TEXT,
    "assessmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearningProgress_userId_skill_key" ON "LearningProgress"("userId", "skill");
CREATE INDEX "LearningProgress_userId_status_updatedAt_idx" ON "LearningProgress"("userId", "status", "updatedAt");

ALTER TABLE "LearningProgress"
    ADD CONSTRAINT "LearningProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
