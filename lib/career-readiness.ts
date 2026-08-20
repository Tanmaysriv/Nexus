import type { GitHubRepo } from "@/lib/github";
import type { ProjectHealth } from "@/lib/project-health";

export type CareerReadiness = {
  overall: number;
  development: number;
  github: number;
  frontend: number;
  backend: number;
  systemDesign: number;
  testing: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateCareerReadiness(
  repos: GitHubRepo[],
  projects: ProjectHealth[]
): CareerReadiness {
  const languages = repos
    .map((repo) => repo.language)
    .filter(Boolean)
    .map((language) => language!.toLowerCase());

  const hasJavaScript =
    languages.includes("javascript");

  const hasTypeScript =
    languages.includes("typescript");

  const hasPython =
    languages.includes("python");

  const hasJava =
    languages.includes("java");

  const repositoryCount = repos.length;

  const averageProjectHealth =
    projects.length > 0
      ? projects.reduce(
          (total, project) => total + project.score,
          0
        ) / projects.length
      : 0;

  const development = clamp(
    Math.min(100, averageProjectHealth + repositoryCount * 2)
  );

  const github = clamp(
    Math.min(
      100,
      50 +
        repositoryCount * 3 +
        repos.reduce(
          (total, repo) =>
            total +
            repo.stargazers_count * 2 +
            repo.forks_count,
          0
        )
    )
  );

  const frontend = clamp(
    35 +
      (hasJavaScript ? 25 : 0) +
      (hasTypeScript ? 25 : 0)
  );

  const backend = clamp(
    30 +
      (hasPython ? 25 : 0) +
      (hasJava ? 25 : 0)
  );

  // This is intentionally conservative.
  // We don't claim system-design knowledge simply
  // because someone has GitHub repositories.
  const systemDesign = clamp(
    35 +
      Math.min(repositoryCount * 3, 20)
  );

  // Same principle for testing.
  // We'll improve this when we inspect repositories
  // for actual test/CI files.
  const testing = clamp(
    40 +
      Math.min(repositoryCount * 2, 20)
  );

  const overall = clamp(
    development * 0.30 +
      github * 0.20 +
      frontend * 0.15 +
      backend * 0.15 +
      systemDesign * 0.10 +
      testing * 0.10
  );

  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];

  if (development >= 80) {
    strengths.push("Strong project development");
  }

  if (github >= 80) {
    strengths.push("Strong GitHub presence");
  }

  if (frontend >= 75) {
    strengths.push("Good frontend foundation");
  }

  if (backend >= 75) {
    strengths.push("Good backend foundation");
  }

  if (systemDesign < 60) {
    gaps.push("System design");
    recommendations.push(
      "Study scalable backend architecture and system design."
    );
  }

  if (testing < 60) {
    gaps.push("Testing");
    recommendations.push(
      "Add unit, integration and end-to-end testing to projects."
    );
  }

  if (backend < 70) {
    gaps.push("Backend engineering");
    recommendations.push(
      "Build a production-style backend with authentication, caching and database design."
    );
  }

  if (frontend < 70) {
    gaps.push("Frontend engineering");
    recommendations.push(
      "Strengthen advanced React and TypeScript patterns."
    );
  }

  if (hasPython) {
    strengths.push("Python experience");
  }

  if (hasJava) {
    strengths.push("Java experience");
  }

  return {
    overall,
    development,
    github,
    frontend,
    backend,
    systemDesign,
    testing,
    strengths,
    gaps,
    recommendations: recommendations.slice(0, 4),
  };
}