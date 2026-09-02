-- CreateTable
CREATE TABLE "CareerRoadmap" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerRoadmapItem" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "focus" TEXT[],
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerRoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerRoadmap_role_idx" ON "CareerRoadmap"("role");

-- CreateIndex
CREATE INDEX "CareerRoadmapItem_roadmapId_idx" ON "CareerRoadmapItem"("roadmapId");

-- AddForeignKey
ALTER TABLE "CareerRoadmapItem" ADD CONSTRAINT "CareerRoadmapItem_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
