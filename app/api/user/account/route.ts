import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { revalidateTag } from "next/cache";

import { decryptGitHubToken } from "@/lib/github-crypto";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const password = typeof (body as Record<string, unknown>).password === "string" ? (body as Record<string, string>).password : "";
    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 403 });
    }
    const resume = await prisma.resume.findUnique({ where: { userId: user.id }, select: { blobUrl: true } });
    if (resume) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: "Resume storage is unavailable; account deletion cannot safely remove your resume." }, { status: 503 });
      }
      await del(resume.blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
    // Revoke GitHub OAuth authorization before deleting the local account.
    // Failure is logged but does not block account deletion.
    const githubAccount = await prisma.gitHubAccount.findUnique({
      where: { userId: user.id },
      select: { accessToken: true },
    });

    if (githubAccount) {
      try {
        const githubToken = decryptGitHubToken(githubAccount.accessToken);
        const githubClientId = process.env.GITHUB_CLIENT_ID;
        const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (githubClientId && githubClientSecret) {
          const revokeResponse = await fetch(
            `https://api.github.com/applications/${encodeURIComponent(githubClientId)}/token`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Basic ${Buffer.from(
                  `${githubClientId}:${githubClientSecret}`,
                ).toString("base64")}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ access_token: githubToken }),
              cache: "no-store",
            },
          );

          if (!revokeResponse.ok && revokeResponse.status !== 404) {
            logger.warn("GitHub OAuth token revocation failed during account deletion", {
              userId: user.id,
              status: revokeResponse.status,
              route: "/api/user/account",
            });
          }
        } else {
          logger.warn("GitHub OAuth credentials unavailable during account deletion", {
            userId: user.id,
            route: "/api/user/account",
          });
        }
      } catch (error) {
        logger.warn("GitHub OAuth token revocation threw during account deletion", {
          userId: user.id,
          route: "/api/user/account",
          error,
        });
      }

      revalidateTag(`github-user-${user.id}`, "max");
    }

    await prisma.user.delete({ where: { id: user.id } });
    const cookieStore = await cookies();
    cookieStore.delete("nexus_session");
    cookieStore.delete("nexus_theme");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Account deletion failed", { userId: user.id, route: "/api/user/account", error });
    return NextResponse.json({ error: "Unable to delete account." }, { status: 500 });
  }
}

