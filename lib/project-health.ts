import type { GitHubRepo } from "@/lib/github";

export type RepositorySignals = {
  hasReadme: boolean;
  hasPackageJson: boolean;
  hasTests: boolean;
  hasDocker: boolean;
  hasCI: boolean;
  hasTypeScript: boolean;
  hasEnvironmentExample: boolean;
  hasLicense: boolean;

  technologies: string[];
};

export type ProjectHealth = {
  name: string;
  score: number;

  activity: number;
  documentation: number;
  maintenance: number;
  techStack: number;

  engineering: number;

  signals: RepositorySignals;

  verdict: string;
  recommendations: string[];
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateActivity(repo: GitHubRepo) {
  const days =
    (Date.now() - new Date(repo.updated_at).getTime()) /
    (1000 * 60 * 60 * 24);

  if (days <= 7) return 100;
  if (days <= 30) return 90;
  if (days <= 90) return 75;
  if (days <= 180) return 55;

  return 30;
}

function calculateDocumentation(repo: GitHubRepo) {
  let score = 20;

  if (repo.description) {
    score += 40;
  }

  if (repo.description && repo.description.length >= 80) {
    score += 20;
  }

  if (repo.html_url) {
    score += 20;
  }

  return clamp(score);
}

function calculateMaintenance(repo: GitHubRepo) {
  const days =
    (Date.now() - new Date(repo.updated_at).getTime()) /
    (1000 * 60 * 60 * 24);

  if (days <= 14) return 100;
  if (days <= 30) return 90;
  if (days <= 90) return 75;
  if (days <= 180) return 55;

  return 30;
}

function calculateTechStack(repo: GitHubRepo) {
  let score = 50;

  if (repo.language) {
    score += 30;
  }

  if (repo.stargazers_count > 0) {
    score += 10;
  }

  if (repo.forks_count > 0) {
    score += 10;
  }

  return clamp(score);
}

function calculateEngineering(
  signals: RepositorySignals
) {
  const checks = [
    signals.hasReadme,
    signals.hasPackageJson,
    signals.hasTests,
    signals.hasDocker,
    signals.hasCI,
    signals.hasTypeScript,
    signals.hasEnvironmentExample,
    signals.hasLicense,
  ];

  const passed = checks.filter(Boolean).length;

  return clamp((passed / checks.length) * 100);
}

function getVerdict(score: number) {
  if (score >= 90) {
    return "Excellent engineering project.";
  }

  if (score >= 80) {
    return "Strong portfolio project.";
  }

  if (score >= 70) {
    return "Good project with room for improvement.";
  }

  if (score >= 50) {
    return "Needs improvement before becoming a flagship project.";
  }

  return "Needs significant engineering improvements.";
}

function getRecommendations(
  signals: RepositorySignals
) {
  const recommendations: string[] = [];

  if (!signals.hasReadme) {
    recommendations.push(
      "Add a professional README with setup instructions."
    );
  }

  if (!signals.hasTests) {
    recommendations.push(
      "Add unit or integration tests."
    );
  }

  if (!signals.hasCI) {
    recommendations.push(
      "Add CI/CD using GitHub Actions."
    );
  }

  if (!signals.hasDocker) {
    recommendations.push(
      "Consider adding Docker support for reproducible environments."
    );
  }

  if (!signals.hasTypeScript) {
    recommendations.push(
      "Consider TypeScript for stronger type safety."
    );
  }

  if (!signals.hasEnvironmentExample) {
    recommendations.push(
      "Add a .env.example without exposing secrets."
    );
  }

  if (!signals.hasLicense) {
    recommendations.push(
      "Add an appropriate open-source license."
    );
  }

  return recommendations.slice(0, 5);
}

export function analyzeProject(
  repo: GitHubRepo,
  signals: RepositorySignals
): ProjectHealth {
  const activity = calculateActivity(repo);
  const documentation = calculateDocumentation(repo);
  const maintenance = calculateMaintenance(repo);
  const techStack = calculateTechStack(repo);
  const engineering = calculateEngineering(signals);

  const score = clamp(
    activity * 0.20 +
      documentation * 0.15 +
      maintenance * 0.15 +
      techStack * 0.15 +
      engineering * 0.35
  );

  return {
    name: repo.name,
    score,
    activity,
    documentation,
    maintenance,
    techStack,
    engineering,
    signals,
    verdict: getVerdict(score),
    recommendations: getRecommendations(signals),
  };
}