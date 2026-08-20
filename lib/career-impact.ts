import type { RepositorySignals } from "@/lib/project-health";

export type CareerImpact = {
  resumeStrength: number;
  interviewValue: number;
  productionReadiness: number;
  engineeringMaturity: number;
  overall: number;
  roles: string[];
  improvements: string[];
};

export function calculateCareerImpact(
  signals: RepositorySignals,
  projectScore: number
): CareerImpact {
  let resumeStrength = projectScore;
  let interviewValue = projectScore;
  let productionReadiness = projectScore;
  let engineeringMaturity = projectScore;

  // Documentation improves resume presentation
  if (signals.hasReadme) {
    resumeStrength += 8;
  }

  // Tests strongly improve interview confidence
  if (signals.hasTests) {
    interviewValue += 10;
    engineeringMaturity += 8;
  }

  // CI/CD improves production readiness
  if (signals.hasCI) {
    productionReadiness += 12;
    engineeringMaturity += 8;
  }

  // Docker improves deployment readiness
  if (signals.hasDocker) {
    productionReadiness += 10;
  }

  // TypeScript improves engineering signal
  if (signals.hasTypeScript) {
    interviewValue += 5;
    engineeringMaturity += 5;
  }

  // Environment configuration
  if (signals.hasEnvironmentExample) {
    productionReadiness += 5;
  }

  // License improves open-source credibility
  if (signals.hasLicense) {
    resumeStrength += 3;
  }

  resumeStrength = Math.min(100, resumeStrength);
  interviewValue = Math.min(100, interviewValue);
  productionReadiness = Math.min(
    100,
    productionReadiness
  );
  engineeringMaturity = Math.min(
    100,
    engineeringMaturity
  );

  const overall = Math.round(
    (
      resumeStrength +
      interviewValue +
      productionReadiness +
      engineeringMaturity
    ) / 4
  );

  const roles: string[] = [];

  if (signals.hasTypeScript) {
    roles.push("Software Engineer");
    roles.push("Full Stack Developer");
  }

  if (signals.hasDocker || signals.hasCI) {
    roles.push("DevOps / Cloud Engineer");
  }

  if (projectScore >= 70) {
    roles.push("Product Engineer");
  }

  if (roles.length === 0) {
    roles.push("Software Engineer");
  }

  const improvements: string[] = [];

  if (!signals.hasTests) {
    improvements.push(
      "Add automated tests before presenting this project in interviews."
    );
  }

  if (!signals.hasCI) {
    improvements.push(
      "Add GitHub Actions to demonstrate CI/CD knowledge."
    );
  }

  if (!signals.hasDocker) {
    improvements.push(
      "Add Docker support to improve deployment readiness."
    );
  }

  if (!signals.hasReadme) {
    improvements.push(
      "Improve the README with architecture, setup and technical decisions."
    );
  }

  if (!signals.hasEnvironmentExample) {
    improvements.push(
      "Add a safe .env.example for reproducible project setup."
    );
  }

  return {
    resumeStrength,
    interviewValue,
    productionReadiness,
    engineeringMaturity,
    overall,
    roles,
    improvements,
  };
}