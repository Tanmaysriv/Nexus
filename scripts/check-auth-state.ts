import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../lib/prisma");

  try {
    const userCount = await prisma.user.count();
    const githubAccountCount = await prisma.gitHubAccount.count();
    const sessionCount = await prisma.session.count();

    console.log("");
    console.log("NEXUS authentication database state");
    console.log("------------------------------------");
    console.log(`Users:          ${userCount}`);
    console.log(`GitHub accounts:${githubAccountCount}`);
    console.log(`Sessions:       ${sessionCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Auth state check failed.");
  console.error(
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
});
