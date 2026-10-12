import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { clearRepositoryAnalysisCache } from "@/lib/github-cache";
import { decryptGitHubToken } from "@/lib/github-crypto";
import { invalidateGitHubCache } from "@/lib/github";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const account = await prisma.gitHubAccount.findUnique({
      where: { userId: user.id },
      select: { accessToken: true },
    });
    if (!account) return NextResponse.json({ success: true, connected: false });

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (clientId && clientSecret) {
      try {
        const token = decryptGitHubToken(account.accessToken);
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const response = await fetch(`https://api.github.com/applications/${encodeURIComponent(clientId)}/grant`, {
          method: "DELETE",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({ access_token: token }),
          signal: AbortSignal.timeout(5000),
          cache: "no-store",
        });
        if (!response.ok && response.status !== 404) {
          logger.warn("GitHub token revocation was not confirmed", { userId: user.id, status: response.status });
        }
      } catch (error) {
        logger.warn("GitHub token revocation failed; local connection will still be removed", { userId: user.id, error });
      }
    }

    await prisma.gitHubAccount.deleteMany({ where: { userId: user.id } });
    clearRepositoryAnalysisCache(user.id);
    invalidateGitHubCache(user.id);
    return NextResponse.json({ success: true, connected: false });
  } catch (error) {
    logger.error("GitHub disconnect failed", { userId: user.id, route: "/api/github/disconnect", error });
    return NextResponse.json({ error: "Unable to disconnect GitHub." }, { status: 500 });
  }
}
