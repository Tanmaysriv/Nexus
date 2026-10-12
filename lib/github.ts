import { revalidateTag, unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { decryptGitHubToken } from "@/lib/github-crypto";

const GITHUB_API = "https://api.github.com";

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string | null;
  fork: boolean;
  archived: boolean;
};

export type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
};

export type GitHubActivityDay = {
  date: string;
  count: number;
};

export type GitHubActivity = {
  totalEvents: number;
  activeDays: number;
  longestStreak: number;
  dailyActivity: GitHubActivityDay[];
};

type GitHubAccountData = {
  login: string;
  accessToken: string;
};

export async function hasGitHubAccount(userId: string) {
  const account = await prisma.gitHubAccount.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(account);
}
export async function getGitHubAccount(
  userId: string
): Promise<GitHubAccountData> {
  const account = await prisma.gitHubAccount.findUnique({
    where: {
      userId,
    },
    select: {
      login: true,
      accessToken: true,
    },
  });

  if (!account) {
    throw new Error(
      "GitHub account is not connected."
    );
  }

  return {
    login: account.login,
    accessToken: decryptGitHubToken(
      account.accessToken
    ),
  };
}

async function githubFetch<T>(
  url: string,
  accessToken: string
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    Authorization: `Bearer ${accessToken}`,
  };

  const response = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `GitHub API ${response.status}: ${errorBody}`
    );
  }

  return response.json();
}

async function fetchGitHubProfile(
  userId: string,
  accessToken: string
): Promise<GitHubProfile> {
  return githubFetch<GitHubProfile>(
    `${GITHUB_API}/user`,
    accessToken
  );
}

async function fetchGitHubRepos(
  userId: string,
  accessToken: string
): Promise<GitHubRepo[]> {
  return githubFetch<GitHubRepo[]>(
    `${GITHUB_API}/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member`,
    accessToken
  );
}

async function fetchGitHubActivity(
  username: string,
  accessToken: string
): Promise<GitHubActivity> {
  type GitHubEvent = {
    created_at?: string;
  };

  const events = await githubFetch<GitHubEvent[]>(
    `${GITHUB_API}/users/${encodeURIComponent(
      username
    )}/events/public?per_page=100`,
    accessToken
  );

  const activityMap = new Map<string, number>();

  for (const event of events) {
    if (!event.created_at) {
      continue;
    }

    const date = new Date(event.created_at)
      .toISOString()
      .split("T")[0];

    activityMap.set(
      date,
      (activityMap.get(date) ?? 0) + 1
    );
  }

  const dailyActivity: GitHubActivityDay[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    const dateString = date
      .toISOString()
      .split("T")[0];

    dailyActivity.push({
      date: dateString,
      count:
        activityMap.get(dateString) ?? 0,
    });
  }

  const activeDays =
    dailyActivity.filter(
      (day) => day.count > 0
    ).length;

  let longestStreak = 0;
  let currentStreak = 0;

  for (const day of dailyActivity) {
    if (day.count > 0) {
      currentStreak++;

      longestStreak = Math.max(
        longestStreak,
        currentStreak
      );
    } else {
      currentStreak = 0;
    }
  }

  return {
    totalEvents: events.length,
    activeDays,
    longestStreak,
    dailyActivity,
  };
}

function cachedProfile(
  userId: string,
  accessToken: string
) {
  return unstable_cache(
    () =>
      fetchGitHubProfile(
        userId,
        accessToken
      ),
    ["github-profile", userId],
    {
      revalidate: 3600,
      tags: [`github-user-${userId}`],
    }
  )();
}

function cachedRepos(
  userId: string,
  accessToken: string
) {
  return unstable_cache(
    () =>
      fetchGitHubRepos(
        userId,
        accessToken
      ),
    ["github-repositories", userId],
    {
      revalidate: 3600,
      tags: [`github-user-${userId}`],
    }
  )();
}

function cachedActivity(
  userId: string,
  username: string,
  accessToken: string
) {
  return unstable_cache(
    () =>
      fetchGitHubActivity(
        username,
        accessToken
      ),
    ["github-activity", userId],
    {
      revalidate: 3600,
      tags: [`github-user-${userId}`],
    }
  )();
}

export function invalidateGitHubCache(userId: string) {
  revalidateTag(`github-user-${userId}`, { expire: 0 });
}

export async function getGitHubProfile(
  userId: string
): Promise<GitHubProfile> {
  const account = await getGitHubAccount(userId);

  return cachedProfile(
    userId,
    account.accessToken
  );
}

export async function getGitHubRepos(
  userId: string
): Promise<GitHubRepo[]> {
  const account = await getGitHubAccount(userId);

  return cachedRepos(
    userId,
    account.accessToken
  );
}

export async function getGitHubStats(
  userId: string
) {
  const [profile, repos] =
    await Promise.all([
      getGitHubProfile(userId),
      getGitHubRepos(userId),
    ]);

  const activeRepos = repos.filter(
    (repo) =>
      !repo.fork &&
      !repo.archived
  );

  const totalStars =
    activeRepos.reduce(
      (total, repo) =>
        total +
        repo.stargazers_count,
      0
    );

  const totalForks =
    activeRepos.reduce(
      (total, repo) =>
        total +
        repo.forks_count,
      0
    );

  const languages =
    activeRepos.reduce<
      Record<string, number>
    >((result, repo) => {
      if (repo.language) {
        result[repo.language] =
          (result[repo.language] ?? 0) + 1;
      }

      return result;
    }, {});

  const recentRepos = [
    ...activeRepos,
  ]
    .sort(
      (a, b) =>
        new Date(
          b.updated_at
        ).getTime() -
        new Date(
          a.updated_at
        ).getTime()
    )
    .slice(0, 5);

  return {
    profile,
    repos: activeRepos,
    repositoryCount:
      activeRepos.length,
    totalStars,
    totalForks,
    languages,
    recentRepos,
  };
}

export async function getGitHubActivity(
  userId: string
): Promise<GitHubActivity> {
  const account = await getGitHubAccount(userId);

  return cachedActivity(
    userId,
    account.login,
    account.accessToken
  );
}


