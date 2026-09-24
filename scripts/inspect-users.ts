import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          interviewSessions: true,
          careerRoadmaps: true,
          careerActions: true,
          copilotConversations: true,
        },
      },
      githubAccount: {
        select: {
          login: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n=== NEXUS USERS ===");
  console.dir(users, { depth: null });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
