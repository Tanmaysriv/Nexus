import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth";
import {
  createGitHubOAuthState,
  getGitHubAuthorizationUrl,
} from "@/lib/github-oauth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const existingAccount =
      await prisma.gitHubAccount.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

    if (existingAccount) {
      return NextResponse.redirect(
        new URL(
          "/settings?github=already-connected",
          process.env.NEXT_PUBLIC_APP_URL ??
            "http://localhost:3000",
        ),
      );
    }

    const state = await createGitHubOAuthState(user.id);
    const authorizationUrl =
      getGitHubAuthorizationUrl(state);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("GitHub connect error:", error);

    return NextResponse.redirect(
      new URL(
        "/settings?github=connect-error",
        process.env.NEXT_PUBLIC_APP_URL ??
          "http://localhost:3000",
      ),
    );
  }
}
