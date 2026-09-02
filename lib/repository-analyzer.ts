import { unstable_cache } from "next/cache";
import type {
  RepositorySignals,
} from "@/lib/project-health";

const GITHUB_API =
  "https://api.github.com";

async function githubRequest<T>(
  url: string
): Promise<T> {
  const token =
    process.env.GITHUB_TOKEN;

  const response = await fetch(url, {
    headers: {
      Accept:
        "application/vnd.github+json",

      "X-GitHub-Api-Version":
        "2022-11-28",

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
    const errorText =
      await response.text();

    // GitHub returns 404 for empty repositories.
    if (
      response.status === 404 &&
      errorText.includes(
        "This repository is empty"
      )
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

type GitHubFile = {
  name: string;
  path: string;
  content?: string;
  encoding?: string;
};

type GitHubTreeItem = {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url?: string;
};

type GitHubTreeResponse = {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
};

/*
 * --------------------------------------------------
 * GitHub Repository Tree
 * --------------------------------------------------
 */

async function getRepositoryTree(
  owner: string,
  repo: string
): Promise<GitHubTreeItem[]> {
  try {
    const repoInfo =
      await githubRequest<{
        default_branch: string;
      }>(
        `${GITHUB_API}/repos/${owner}/${repo}`
      );

    const tree =
      await githubRequest<GitHubTreeResponse>(
        `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(
          repoInfo.default_branch
        )}?recursive=1`
      );

    return tree.tree;
  } catch (error) {
    /*
     * Empty GitHub repositories do not have a Git tree.
     * GitHub returns HTTP 409 in this situation.
     *
     * Treat the repository as having an empty tree rather
     * than breaking the entire Projects/GitHub page.
     */
    if (
      error instanceof Error &&
      error.message.includes(
        "GitHub API 409"
      )
    ) {
      return [];
    }

    throw error;
  }
}

/*
 * --------------------------------------------------
 * Read package.json from any repository path
 * --------------------------------------------------
 */

async function getPackageJsonAtPath(
  owner: string,
  repo: string,
  path: string
): Promise<Record<string, unknown> | null> {
  try {
    const file =
      await githubRequest<GitHubFile>(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`
      );

    if (
      !file.content ||
      file.encoding !== "base64"
    ) {
      return null;
    }

    const decoded =
      Buffer.from(
        file.content,
        "base64"
      ).toString("utf-8");

    return JSON.parse(
      decoded
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/*
 * --------------------------------------------------
 * Technology Detection
 * --------------------------------------------------
 */

function detectTechnologies(
  contents: GitHubContent[],
  paths: string[],
  packageJson?: Record<
    string,
    unknown
  > | null
) {
  const names = contents.map(
    (item) =>
      item.name.toLowerCase()
  );

  const normalizedPaths =
    paths.map((path) =>
      path.toLowerCase()
    );

  const technologies =
    new Set<string>();

  const dependencies = {
    ...(typeof packageJson?.dependencies ===
      "object" &&
    packageJson.dependencies !== null
      ? packageJson.dependencies
      : {}),

    ...(typeof packageJson?.devDependencies ===
      "object" &&
    packageJson.devDependencies !== null
      ? packageJson.devDependencies
      : {}),
  };

  const dependencyNames =
    Object.keys(dependencies).map(
      (name) =>
        name.toLowerCase()
    );

  const hasFile = (
    file: string
  ) =>
    names.includes(file);

  const hasPath = (
    pattern: RegExp
  ) =>
    normalizedPaths.some(
      (path) =>
        pattern.test(path)
    );

  /*
   * ------------------------------------------------
   * JavaScript
   * ------------------------------------------------
   */

  if (
    hasFile("package.json") ||
    hasPath(
      /\.(js|jsx|mjs|cjs)$/
    )
  ) {
    technologies.add(
      "JavaScript"
    );
  }

  /*
   * ------------------------------------------------
   * TypeScript
   * ------------------------------------------------
   */

  if (
    hasFile("tsconfig.json") ||
    hasPath(
      /\.(ts|tsx)$/
    )
  ) {
    technologies.add(
      "TypeScript"
    );
  }

  /*
   * ------------------------------------------------
   * React
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "react"
    ) ||
    dependencyNames.includes(
      "react-dom"
    )
  ) {
    technologies.add(
      "React"
    );
  }

  /*
   * ------------------------------------------------
   * Next.js
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "next"
    ) ||
    hasPath(
      /(^|\/)next\.config\./
    )
  ) {
    technologies.add(
      "Next.js"
    );
  }

  /*
   * ------------------------------------------------
   * Node.js
   * ------------------------------------------------
   */

  if (
    hasFile("package.json") ||
    dependencyNames.some(
      (name) =>
        name === "node" ||
        name === "@types/node"
    )
  ) {
    technologies.add(
      "Node.js"
    );
  }

  /*
   * ------------------------------------------------
   * Three.js / React Three Fiber
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "three"
    ) ||
    dependencyNames.includes(
      "@react-three/fiber"
    ) ||
    dependencyNames.includes(
      "@react-three/drei"
    )
  ) {
    technologies.add(
      "Three.js"
    );
  }

  /*
   * ------------------------------------------------
   * TensorFlow
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "@tensorflow/tfjs"
    ) ||
    dependencyNames.includes(
      "@tensorflow/tfjs-core"
    ) ||
    hasPath(
      /tensorflow/
    ) ||
    hasPath(
      /tfjs/
    )
  ) {
    technologies.add(
      "TensorFlow"
    );
  }

  /*
   * ------------------------------------------------
   * MediaPipe
   * ------------------------------------------------
   */

  if (
    dependencyNames.some(
      (name) =>
        name.includes(
          "mediapipe"
        )
    ) ||
    hasPath(
      /mediapipe/
    )
  ) {
    technologies.add(
      "MediaPipe"
    );
  }

  /*
   * ------------------------------------------------
   * Tailwind CSS
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "tailwindcss"
    ) ||
    hasPath(
      /tailwind/
    )
  ) {
    technologies.add(
      "Tailwind CSS"
    );
  }

  /*
   * ------------------------------------------------
   * Framer Motion
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "framer-motion"
    )
  ) {
    technologies.add(
      "Framer Motion"
    );
  }

  /*
   * ------------------------------------------------
   * Express
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "express"
    )
  ) {
    technologies.add(
      "Express"
    );
  }

  /*
   * ------------------------------------------------
   * Prisma
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "prisma"
    ) ||
    dependencyNames.includes(
      "@prisma/client"
    )
  ) {
    technologies.add(
      "Prisma"
    );
  }

  /*
   * ------------------------------------------------
   * FastAPI
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "fastapi"
    ) ||
    hasPath(
      /fastapi/
    )
  ) {
    technologies.add(
      "FastAPI"
    );
  }

  /*
   * ------------------------------------------------
   * LangChain
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "langchain"
    ) ||
    dependencyNames.some(
      (name) =>
        name.startsWith(
          "@langchain/"
        )
    )
  ) {
    technologies.add(
      "LangChain"
    );
  }

  /*
   * ------------------------------------------------
   * Python
   * ------------------------------------------------
   */

  if (
    hasPath(
      /\.py$/
    ) ||
    hasPath(
      /(^|\/)requirements\.txt$/
    ) ||
    hasPath(
      /(^|\/)pyproject\.toml$/
    ) ||
    hasPath(
      /(^|\/)setup\.py$/
    )
  ) {
    technologies.add(
      "Python"
    );
  }

  /*
   * ------------------------------------------------
   * Machine Learning
   * ------------------------------------------------
   */

  if (
    hasPath(
      /\.(ipynb|py)$/
    ) ||
    dependencyNames.some(
      (name) =>
        [
          "scikit-learn",
          "tensorflow",
          "torch",
          "pytorch",
          "keras",
        ].includes(name)
    )
  ) {
    technologies.add(
      "Machine Learning"
    );
  }

  /*
   * ------------------------------------------------
   * PyTorch
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "torch"
    ) ||
    dependencyNames.includes(
      "pytorch"
    ) ||
    hasPath(
      /pytorch/
    )
  ) {
    technologies.add(
      "PyTorch"
    );
  }

  /*
   * ------------------------------------------------
   * Keras
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "keras"
    ) ||
    hasPath(
      /keras/
    )
  ) {
    technologies.add(
      "Keras"
    );
  }

  /*
   * ------------------------------------------------
   * Scikit-learn
   * ------------------------------------------------
   */

  if (
    dependencyNames.includes(
      "scikit-learn"
    ) ||
    hasPath(
      /scikit-learn/
    )
  ) {
    technologies.add(
      "Scikit-learn"
    );
  }

  /*
   * ------------------------------------------------
   * SQL
   * ------------------------------------------------
   */

  if (
    hasPath(
      /\.sql$/
    ) ||
    hasPath(
      /schema\.prisma$/
    ) ||
    dependencyNames.some(
      (name) =>
        [
          "pg",
          "postgres",
          "mysql",
          "mysql2",
          "sqlite3",
          "sequelize",
          "typeorm",
          "prisma",
        ].includes(name)
    )
  ) {
    technologies.add(
      "SQL"
    );
  }

  /*
   * ------------------------------------------------
   * PostgreSQL
   * ------------------------------------------------
   */

  if (
    hasPath(
      /schema\.prisma$/
    ) ||
    dependencyNames.some(
      (name) =>
        [
          "pg",
          "postgres",
          "@prisma/adapter-pg",
        ].includes(name)
    )
  ) {
    technologies.add(
      "PostgreSQL"
    );
  }

  /*
   * ------------------------------------------------
   * Docker
   * ------------------------------------------------
   */

  if (
    hasPath(
      /(^|\/)dockerfile$/
    ) ||
    hasPath(
      /docker-compose\.ya?ml$/
    )
  ) {
    technologies.add(
      "Docker"
    );
  }

  /*
   * ------------------------------------------------
   * GitHub Actions / CI/CD
   * ------------------------------------------------
   */

  if (
    hasPath(
      /^\.github\/workflows\//
    )
  ) {
    technologies.add(
      "GitHub Actions"
    );

    technologies.add(
      "CI/CD"
    );
  }

  /*
   * ------------------------------------------------
   * Kubernetes
   * ------------------------------------------------
   */

  if (
    hasPath(
      /(^|\/)(kubernetes|k8s)(\/|$)/
    ) ||
    hasPath(
      /(^|\/)deployment\.ya?ml$/
    )
  ) {
    technologies.add(
      "Kubernetes"
    );
  }

  /*
   * ------------------------------------------------
   * Terraform
   * ------------------------------------------------
   */

  if (
    hasPath(
      /\.tf$/
    )
  ) {
    technologies.add(
      "Terraform"
    );
  }

  return Array.from(
    technologies
  ).sort();
}

/*
 * --------------------------------------------------
 * Repository Analyzer
 * --------------------------------------------------
 */

export async function analyzeRepositoryUncached(
  owner: string,
  repo: string
): Promise<RepositorySignals> {
  /*
   * Root contents
   */

  const contents =
    await githubRequest<
      GitHubContent[]
    >(
      `${GITHUB_API}/repos/${owner}/${repo}/contents`
    );

  /*
   * Complete repository tree
   */

  const tree =
    await getRepositoryTree(
      owner,
      repo
    );

  const treePaths =
    tree
      .filter(
        (item) =>
          item.type === "blob"
      )
      .map(
        (item) =>
          item.path.toLowerCase()
      );

  /*
   * Combine root contents and
   * recursive tree paths.
   */

  

  const paths = [
    ...contents.map(
      (item) =>
        item.path.toLowerCase()
    ),
    ...treePaths,
  ];

  /*
   * ------------------------------------------------
   * Repository Signals
   * ------------------------------------------------
   */

  const hasReadme =
    paths.some(
      (path) =>
        /(^|\/)readme(\.md|\.mdx|\.txt)?$/.test(
          path
        )
    );

  const hasPackageJson =
    paths.some(
      (path) =>
        /(^|\/)package\.json$/.test(
          path
        )
    );

  const hasDocker =
    paths.some(
      (path) =>
        /(^|\/)dockerfile$/.test(
          path
        )
    ) ||
    paths.some(
      (path) =>
        /docker-compose\.ya?ml$/.test(
          path
        )
    );

  const hasLicense =
    paths.some(
      (path) =>
        /(^|\/)license(\..*)?$/.test(
          path
        )
    );

  const hasEnvironmentExample =
    paths.some(
      (path) =>
        /(^|\/)\.env\.(example|sample)$/.test(
          path
        )
    );

  const hasCI =
    paths.some(
      (path) =>
        path.startsWith(
          ".github/workflows/"
        )
    );

  const hasTypeScript =
    paths.some(
      (path) =>
        /(^|\/)tsconfig\.json$/.test(
          path
        )
    ) ||
    paths.some(
      (path) =>
        /\.(ts|tsx)$/.test(
          path
        )
    );

  const hasTests =
    paths.some(
      (path) =>
        /(^|\/)(__tests__|tests?|spec)(\/|$)/i.test(
          path
        )
    ) ||
    paths.some(
      (path) =>
        /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(
          path
        )
    );

  /*
   * ------------------------------------------------
   * Find EVERY package.json
   * ------------------------------------------------
   */

  const packagePaths =
    tree
      .filter(
        (item) =>
          item.type ===
            "blob" &&
          item.path
            .toLowerCase()
            .endsWith(
              "package.json"
            )
      )
      .map(
        (item) =>
          item.path
      );

  /*
   * Read every package.json.
   *
   * This is important for monorepos
   * such as ARVANA:
   *
   * package.json
   * frontend/package.json
   * backend/package.json
   */

  const packageJsonFiles =
    await Promise.all(
      packagePaths.map(
        (path) =>
          getPackageJsonAtPath(
            owner,
            repo,
            path
          )
      )
    );

  /*
   * Merge dependencies from all
   * package.json files.
   */

  const mergedPackageJson: Record<
    string,
    unknown
  > = {
    dependencies: {},
    devDependencies: {},
  };

  for (
    const packageJson of
      packageJsonFiles
  ) {
    if (!packageJson) {
      continue;
    }

    if (
  typeof packageJson.dependencies ===
    "object" &&
  packageJson.dependencies !== null
) {
  Object.assign(
    mergedPackageJson.dependencies as Record<
      string,
      unknown
    >,
    packageJson.dependencies as Record<
      string,
      unknown
    >
  );
}

if (
  typeof packageJson.devDependencies ===
    "object" &&
  packageJson.devDependencies !== null
) {
  Object.assign(
    mergedPackageJson.devDependencies as Record<
      string,
      unknown
    >,
    packageJson.devDependencies as Record<
      string,
      unknown
    >
  );
}
  }

  /*
   * Detect technologies.
   */

  const technologies =
    detectTechnologies(
      contents,
      paths,
      mergedPackageJson
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
    technologies,
  };
}

const getCachedRepositoryAnalysis =
  unstable_cache(
    async (
      owner: string,
      repo: string
    ): Promise<RepositorySignals> => {
      return analyzeRepositoryUncached(
        owner,
        repo
      );
    },
    ["repository-analysis"],
    {
      revalidate: 3600,
      tags: ["repository-analysis"],
    }
  );

export async function analyzeRepository(
  owner: string,
  repo: string
): Promise<RepositorySignals> {
  return getCachedRepositoryAnalysis(
    owner,
    repo
  );
}

/*
 * --------------------------------------------------
 * Cached batch repository analysis
 * --------------------------------------------------
 *
 * This is the important part.
 *
 * Career readiness and job matching can request
 * the same repository set. We analyze the repositories
 * once and reuse the complete snapshot.
 */

const getCachedRepositoryAnalyses =
  unstable_cache(
    async (
      owner: string,
      repositories: string[]
    ): Promise<
      Record<string, RepositorySignals>
    > => {
      const results =
        await Promise.all(
          repositories.map(
            async (repo) => {
              try {
                const signals =
                  await analyzeRepositoryUncached(
                    owner,
                    repo
                  );

                return [
                  repo,
                  signals,
                ] as const;
              } catch (error) {
                console.warn(
                  `Unable to analyze repository ${repo}:`,
                  error
                );

                return null;
              }
            }
          )
        );

      return Object.fromEntries(
        results.filter(
          (
            result
          ): result is readonly [
            string,
            RepositorySignals
          ] => result !== null
        )
      );
    },
    ["repository-analyses"],
    {
      revalidate: 3600,
      tags: ["repository-analyses"],
    }
  );

export async function analyzeRepositories(
  owner: string,
  repositories: string[]
): Promise<
  Record<string, RepositorySignals>
> {
  const uniqueRepositories =
    Array.from(
      new Set(repositories)
    ).sort();

  return getCachedRepositoryAnalyses(
    owner,
    uniqueRepositories
  );
}