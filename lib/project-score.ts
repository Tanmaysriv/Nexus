import type { RepositorySignals } from "@/lib/project-health";

export function calculateProjectScore(
  signals: RepositorySignals
) {
  const weights = {
    readme: 15,
    packageJson: 10,
    tests: 15,
    docker: 10,
    ci: 15,
    typescript: 10,
    environmentExample: 10,
    license: 5,
  };

  let score = 0;

  if (signals.hasReadme) {
    score += weights.readme;
  }

  if (signals.hasPackageJson) {
    score += weights.packageJson;
  }

  if (signals.hasTests) {
    score += weights.tests;
  }

  if (signals.hasDocker) {
    score += weights.docker;
  }

  if (signals.hasCI) {
    score += weights.ci;
  }

  if (signals.hasTypeScript) {
    score += weights.typescript;
  }

  if (signals.hasEnvironmentExample) {
    score += weights.environmentExample;
  }

  if (signals.hasLicense) {
    score += weights.license;
  }

  return score;
}