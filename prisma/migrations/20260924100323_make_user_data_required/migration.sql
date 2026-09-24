/*
  Warnings:

  - Made the column `userId` on table `CareerAction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `CareerRoadmap` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `CopilotConversation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `InterviewSession` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CareerAction" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CareerRoadmap" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CopilotConversation" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InterviewSession" ALTER COLUMN "userId" SET NOT NULL;
