import {
  createHash,
  randomBytes,
} from "node:crypto";

import { prisma } from "@/lib/prisma";

const STATE_TTL_MS = 10 * 60 * 1000;

function hashState(state: string) {
  return createHash("sha256")
    .update(state)
    .digest("hex");
}

export async function createGitHubOAuthState(
  userId: string,
) {
  const state = randomBytes(32).toString("hex");
  const stateHash = hashState(state);
  const expiresAt = new Date(
    Date.now() + STATE_TTL_MS,
  );

  await prisma.gitHubOAuthState.deleteMany({
    where: {
      OR: [
        { userId },
        { expiresAt: { lt: new Date() } },
      ],
    },
  });

  await prisma.gitHubOAuthState.create({
    data: {
      userId,
      stateHash,
      expiresAt,
    },
  });

  return state;
}

export async function consumeGitHubOAuthState(
  state: string,
) {
  const stateHash = hashState(state);

  const oauthState =
    await prisma.gitHubOAuthState.findUnique({
      where: { stateHash },
    });

  if (!oauthState) {
    return null;
  }

  await prisma.gitHubOAuthState.delete({
    where: { id: oauthState.id },
  });

  if (oauthState.expiresAt <= new Date()) {
    return null;
  }

  return oauthState.userId;
}

export function getGitHubAuthorizationUrl(
  state: string,
) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri =
    process.env.GITHUB_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      "GitHub OAuth environment variables are not configured.",
    );
  }

  const url = new URL(
    "https://github.com/login/oauth/authorize",
  );

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user repo");
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeGitHubCode(
  code: string,
) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret =
    process.env.GITHUB_CLIENT_SECRET;
  const redirectUri =
    process.env.GITHUB_OAUTH_REDIRECT_URI;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri
  ) {
    throw new Error(
      "GitHub OAuth environment variables are not configured.",
    );
  }

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub token exchange failed with status ${response.status}.`,
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!data.access_token) {
    throw new Error(
      data.error_description ??
        data.error ??
        "GitHub did not return an access token.",
    );
  }

  return data.access_token;
}

export async function getGitHubOAuthProfile(
  accessToken: string,
) {
  const response = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "NEXUS",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch GitHub profile. Status ${response.status}.`,
    );
  }

  const data = (await response.json()) as {
    id?: number;
    login?: string;
  };

  if (
    typeof data.id !== "number" ||
    typeof data.login !== "string" ||
    !data.login
  ) {
    throw new Error(
      "GitHub returned an invalid profile.",
    );
  }

  return {
    githubId: String(data.id),
    login: data.login,
  };
}
