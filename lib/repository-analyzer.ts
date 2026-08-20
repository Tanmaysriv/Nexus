import type {
  RepositorySignals,
} from "@/lib/project-health";

const GITHUB_API = "https://api.github.com";

async function githubRequest<T>(
  url: string
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;


  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },

    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    // GitHub returns 404 for empty repositories.
    if (
      response.status === 404 &&
      errorText.includes("This repository is empty")
    ) {
      return [] as T;
    }

    throw new Error(
      `GitHub API ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

type GitHubContent = {
  name: string;
  path: string;
  type: string;
};

export async function analyzeRepository(
  owner: string,
  repo: string
): Promise<RepositorySignals> {
  const contents = await githubRequest<GitHubContent[]>(
    `${GITHUB_API}/repos/${owner}/${repo}/contents`
  );

  const names = contents.map((item) =>
    item.name.toLowerCase()
  );

  const paths = contents.map((item) =>
    item.path.toLowerCase()
  );

  const hasReadme = names.some((name) =>
    /^readme(\.md|\.mdx|\.txt)?$/.test(name)
  );

  const hasPackageJson = names.includes(
    "package.json"
  );

  const hasDocker =
    names.includes("dockerfile") ||
    names.includes("docker-compose.yml") ||
    names.includes("docker-compose.yaml");

  const hasLicense =
    names.includes("license") ||
    names.some((name) =>
      name.startsWith("license.")
    );

  const hasEnvironmentExample =
    names.includes(".env.example") ||
    names.includes(".env.sample");

  const hasCI =
    paths.some((path) =>
      path.startsWith(".github/workflows/")
    );

  const hasTypeScript =
    names.includes("tsconfig.json") ||
    contents.some((item) =>
      /\.(ts|tsx)$/i.test(item.name)
    );

  const hasTests =
    paths.some((path) =>
      /(^|\/)(__tests__|tests?|spec)(\/|$)/i.test(
        path
      )
    ) ||
    paths.some((path) =>
      /\.(test|spec)\.(js|jsx|ts|tsx)$/i.test(
        path
      )
    );

  return {
    hasReadme,
    hasPackageJson,
    hasTests,
    hasDocker,
    hasCI,
    hasTypeScript,
    hasEnvironmentExample,
    hasLicense,
  };
}