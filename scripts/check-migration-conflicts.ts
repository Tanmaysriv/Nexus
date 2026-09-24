import "dotenv/config";
import { prisma } from "../lib/prisma";

const userId = "cmuaz7aan0000igmvgdnhthog";

async function main() {
  const orphanActionIds = [
    "improve-interview-score",
    "improve-interview-depth",
    "improve-communication",
    "improve-project-knowledge",
    "roadmap-git",
    "project-documentation-Nexus",
  ];

  const existingActions = await prisma.careerAction.findMany({
    where: {
      userId,
      actionId: { in: orphanActionIds },
    },
    select: {
      id: true,
      actionId: true,
      title: true,
      status: true,
      progress: true,
    },
  });

  const existingRoadmaps = await prisma.careerRoadmap.findMany({
    where: { userId },
    select: {
      id: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n=== EXISTING ACTION CONFLICTS ===");
  console.dir(existingActions, { depth: null });

  console.log("\n=== EXISTING ROADMAPS ===");
  console.dir(existingRoadmaps, { depth: null });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
