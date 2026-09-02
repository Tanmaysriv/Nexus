import { unstable_cache } from "next/cache";

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

/**
 * Generic GitHub API fetcher.
 *
 * Authentication is read at request time so the token
 * supplied by Next.js from .env.local is always used.
 */
async function githubFetch<T>(url: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN?.trim();

  console.log("=== GITHUB DEBUG ===");
  console.log("Username:", process.env.GITHUB_USERNAME);
  console.log("Has token:", Boolean(token));
  console.log("Token length:", token?.length);
  console.log("Token prefix:", token?.slice(0, 10));
  console.log("URL:", url);

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(
    "Authorization header created:",
    Boolean(headers.Authorization)
  );

  const response = await fetch(url, {
    headers,
    cache: "no-store",
  });

  console.log("GitHub response:", response.status);
  console.log(
    "GitHub remaining:",
    response.headers.get("x-ratelimit-remaining")
  );
  console.log(
    "GitHub limit:",
    response.headers.get("x-ratelimit-limit")
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `GitHub API ${response.status}: ${errorBody}`
    );
  }

  return response.json();
}

/**
 * Cached GitHub profile.
 *
 * Revalidated once every hour.
 */
const getCachedGitHubProfile = unstable_cache(
  async (): Promise<GitHubProfile> => {
    const username = process.env.GITHUB_USERNAME;

    if (!username) {
      throw new Error(
        "GITHUB_USERNAME is not configured."
      );
    }

    return githubFetch<GitHubProfile>(
      `${GITHUB_API}/users/${username}`
    );
  },
  ["github-profile"],
  {
    revalidate: 3600,
  }
);

/**
 * Cached GitHub repositories.
 *
 * Revalidated once every hour.
 */
const getCachedGitHubRepos = unstable_cache(
  async (): Promise<GitHubRepo[]> => {
    const username = process.env.GITHUB_USERNAME;

    if (!username) {
      throw new Error(
        "GITHUB_USERNAME is not configured."
      );
    }

    return githubFetch<GitHubRepo[]>(
      `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=100`
    );
  },
  ["github-repositories"],
  {
    revalidate: 3600,
  }
);

/**
 * Cached GitHub activity.
 *
 * Revalidated once every hour.
 */
const getCachedGitHubActivity = unstable_cache(
  async (
    username: string
  ): Promise<GitHubActivity> => {
    type GitHubEvent = {
  created_at?: string;
};

const events = await githubFetch<GitHubEvent[]>(
      `${GITHUB_API}/users/${username}/events/public?per_page=100`
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

      date.setDate(
        date.getDate() - i
      );

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
  },
  ["github-activity"],
  {
    revalidate: 3600,
  }
);

/**
 * Public GitHub profile getter.
 */
export async function getGitHubProfile(): Promise<GitHubProfile> {
  return getCachedGitHubProfile();
}

/**
 * Public GitHub repositories getter.
 */
export async function getGitHubRepos(): Promise<GitHubRepo[]> {
  return getCachedGitHubRepos();
}

/**
 * Calculates GitHub portfolio statistics
 * from cached profile and repository data.
 */
export async function getGitHubStats() {
  const [profile, repos] =
    await Promise.all([
      getGitHubProfile(),
      getGitHubRepos(),
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

/**
 * Public GitHub activity getter.
 */
export async function getGitHubActivity(
  username: string
): Promise<GitHubActivity> {
  return getCachedGitHubActivity(
    username
  );
}