CREATE TABLE "DsaEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "problemUrl" TEXT,
    "difficulty" TEXT NOT NULL,
    "isSolved" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "accuracy" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "solvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DsaEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DsaEntry_userId_topic_updatedAt_idx" ON "DsaEntry"("userId", "topic", "updatedAt");
CREATE INDEX "DsaEntry_userId_isSolved_difficulty_idx" ON "DsaEntry"("userId", "isSolved", "difficulty");
CREATE INDEX "DsaEntry_userId_solvedAt_idx" ON "DsaEntry"("userId", "solvedAt");

ALTER TABLE "DsaEntry"
    ADD CONSTRAINT "DsaEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
