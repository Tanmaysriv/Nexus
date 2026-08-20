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

async function githubFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `GitHub API ${response.status}: ${errorBody}`
    );
  }

  return response.json();
}

export async function getGitHubProfile(): Promise<GitHubProfile> {
  const username = process.env.GITHUB_USERNAME;

  if (!username) {
    throw new Error("GITHUB_USERNAME is not configured.");
  }

  return githubFetch<GitHubProfile>(
    `${GITHUB_API}/users/${username}`
  );
}

export async function getGitHubRepos(): Promise<GitHubRepo[]> {
  const username = process.env.GITHUB_USERNAME;

  if (!username) {
    throw new Error("GITHUB_USERNAME is not configured.");
  }

  return githubFetch<GitHubRepo[]>(
    `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=100`
  );
}

export async function getGitHubStats() {
  const [profile, repos] = await Promise.all([
    getGitHubProfile(),
    getGitHubRepos(),
  ]);

  const activeRepos = repos.filter(
    (repo) => !repo.fork && !repo.archived
  );

  const totalStars = activeRepos.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  const totalForks = activeRepos.reduce(
    (total, repo) => total + repo.forks_count,
    0
  );

  const languages = activeRepos.reduce<Record<string, number>>(
    (result, repo) => {
      if (repo.language) {
        result[repo.language] =
          (result[repo.language] ?? 0) + 1;
      }

      return result;
    },
    {}
  );

  const recentRepos = [...activeRepos]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime()
    )
    .slice(0, 5);

  return {
    profile,
    repos: activeRepos,
    repositoryCount: activeRepos.length,
    totalStars,
    totalForks,
    languages,
    recentRepos,
  };
}

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

export async function getGitHubActivity(
  username: string
): Promise<GitHubActivity> {
  const events = await githubFetch<any[]>(
    `${GITHUB_API}/users/${username}/events/public?per_page=100`
  );

  const activityMap = new Map<string, number>();

  for (const event of events) {
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
      count: activityMap.get(dateString) ?? 0,
    });
  }

  const activeDays = dailyActivity.filter(
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