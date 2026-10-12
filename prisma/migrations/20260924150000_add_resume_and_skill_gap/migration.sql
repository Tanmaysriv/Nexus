CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "analysis" JSONB,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'dark';

CREATE TABLE "SkillGapAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "jobDescription" TEXT,
    "requiredSkills" TEXT[] NOT NULL,
    "currentSkills" TEXT[] NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillGapAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Resume_userId_key" ON "Resume"("userId");
CREATE INDEX "Resume_updatedAt_idx" ON "Resume"("updatedAt");
CREATE INDEX "SkillGapAnalysis_userId_createdAt_idx" ON "SkillGapAnalysis"("userId", "createdAt");

ALTER TABLE "Resume"
    ADD CONSTRAINT "Resume_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillGapAnalysis"
    ADD CONSTRAINT "SkillGapAnalysis_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
