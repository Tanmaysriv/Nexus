import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { encryptGitHubToken } = await import("../lib/github-crypto");

  function looksEncrypted(value: string): boolean {
    const parts = value.split(".");

    if (parts.length !== 3) {
      return false;
    }

    try {
      const iv = Buffer.from(parts[0], "base64");
      const authTag = Buffer.from(parts[1], "base64");
      const ciphertext = Buffer.from(parts[2], "base64");

      return (
        iv.length === 12 &&
        authTag.length === 16 &&
        ciphertext.length > 0
      );
    } catch {
      return false;
    }
  }

  try {
    const accounts = await prisma.gitHubAccount.findMany({
      select: {
        id: true,
        login: true,
        accessToken: true,
      },
    });

    console.log(`Found ${accounts.length} GitHub account(s).`);

    let encryptedCount = 0;
    let skippedCount = 0;

    for (const account of accounts) {
      if (looksEncrypted(account.accessToken)) {
        console.log(
          `Skipping ${account.login} (${account.id}) - already encrypted.`
        );
        skippedCount++;
        continue;
      }

      const encryptedToken = encryptGitHubToken(
        account.accessToken
      );

      await prisma.gitHubAccount.update({
        where: {
          id: account.id,
        },
        data: {
          accessToken: encryptedToken,
        },
      });

      console.log(
        `Encrypted GitHub token for ${account.login} (${account.id}).`
      );

      encryptedCount++;
    }

    console.log("");
    console.log("GitHub token encryption migration complete.");
    console.log(`Encrypted: ${encryptedCount}`);
    console.log(`Skipped:   ${skippedCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("GitHub token encryption migration failed.");
  console.error(
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
});
