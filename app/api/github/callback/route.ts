import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  consumeGitHubOAuthState,
  exchangeGitHubCode,
  getGitHubOAuthProfile,
} from "@/lib/github-oauth";
import { encryptGitHubToken } from "@/lib/github-crypto";
import { prisma } from "@/lib/prisma";

function settingsUrl(result: string) {
  return new URL(
    `/settings?github=${result}`,
    process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000",
  );
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.redirect(
        settingsUrl("authentication-required"),
      );
    }

    const url = new URL(request.url);

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        settingsUrl("authorization-denied"),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        settingsUrl("invalid-callback"),
      );
    }

    const stateUserId =
      await consumeGitHubOAuthState(state);

    if (
      !stateUserId ||
      stateUserId !== currentUser.id
    ) {
      return NextResponse.redirect(
        settingsUrl("invalid-state"),
      );
    }

    const accessToken =
      await exchangeGitHubCode(code);

    const profile =
      await getGitHubOAuthProfile(accessToken);

    const existingGitHubAccount =
      await prisma.gitHubAccount.findUnique({
        where: {
          githubId: profile.githubId,
        },
        select: {
          userId: true,
        },
      });

    if (
      existingGitHubAccount &&
      existingGitHubAccount.userId !== currentUser.id
    ) {
      return NextResponse.redirect(
        settingsUrl("account-already-connected"),
      );
    }

    const currentUserGitHubAccount =
      await prisma.gitHubAccount.findUnique({
        where: {
          userId: currentUser.id,
        },
        select: {
          githubId: true,
        },
      });

    if (
      currentUserGitHubAccount &&
      currentUserGitHubAccount.githubId !==
        profile.githubId
    ) {
      return NextResponse.redirect(
        settingsUrl("different-account-connected"),
      );
    }

    const encryptedToken =
      encryptGitHubToken(accessToken);

    await prisma.gitHubAccount.upsert({
      where: {
        userId: currentUser.id,
      },
      create: {
        userId: currentUser.id,
        githubId: profile.githubId,
        login: profile.login,
        accessToken: encryptedToken,
      },
      update: {
        githubId: profile.githubId,
        login: profile.login,
        accessToken: encryptedToken,
      },
    });

    return NextResponse.redirect(
      settingsUrl("connected"),
    );
  } catch (error) {
    console.error(
      "GitHub OAuth callback error:",
      error,
    );

    return NextResponse.redirect(
      settingsUrl("connect-error"),
    );
  }
}
