-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "category" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "technicalCorrectness" INTEGER NOT NULL,
    "relevance" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "projectKnowledge" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "strengths" TEXT[],
    "missingConcepts" TEXT[],
    "improvements" TEXT[],
    "idealAnswer" TEXT NOT NULL,
    "followUpQuestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewSession_project_idx" ON "InterviewSession"("project");

-- CreateIndex
CREATE INDEX "InterviewSession_createdAt_idx" ON "InterviewSession"("createdAt");

-- CreateIndex
CREATE INDEX "InterviewAnswer_sessionId_idx" ON "InterviewAnswer"("sessionId");

-- AddForeignKey
ALTER TABLE "InterviewAnswer" ADD CONSTRAINT "InterviewAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
