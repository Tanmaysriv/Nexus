import type { RepositorySignals } from "@/lib/project-health";

export type ProjectEvidenceInput = {
  name: string;
  description: string | null;
  contribution: string;
  signals: RepositorySignals;
};

function detectedPractices(signals: RepositorySignals) {
  return [
    signals.hasTests ? "automated tests" : null,
    signals.hasCI ? "CI workflows" : null,
    signals.hasDocker ? "Docker configuration" : null,
    signals.hasEnvironmentExample ? "an environment example file" : null,
    signals.hasLicense ? "a license file" : null,
    signals.hasReadme ? "a README" : null,
  ].filter((item): item is string => item !== null);
}

export function createProjectEvidenceDrafts(input: ProjectEvidenceInput) {
  const contribution = input.contribution.trim();
  const technologies = input.signals.technologies;
  const practices = detectedPractices(input.signals);
  const stack = technologies.length ? technologies.join(", ") : "No technology was detected by the repository analyzer";
  const practiceSummary = practices.length ? practices.join(", ") : "No tests, CI, Docker, README, license, or environment example signals were detected";
  const description = input.description?.trim();

  return {
    resumeBullet: `Contributed to ${input.name}${contribution ? ` by ${contribution.replace(/[.\s]+$/, "")}` : ""}. Repository analysis detected: ${stack}. Verified repository practices: ${practiceSummary}.`,
    projectExplanation: [
      `${input.name}${description ? `: ${description}` : ". No repository description is available."}`,
      `Your contribution: ${contribution || "Add your specific contribution before using this explanation."}`,
      `Detected technologies: ${stack}.`,
      `Repository signals: ${practiceSummary}.`,
      "Confirm the architecture and behavior from the source code before presenting details that repository metadata does not establish.",
    ].join("\n\n"),
    architectureExplanation: [
      `Repository: ${input.name}`,
      `Detected technologies: ${stack}.`,
      `Detected engineering practices: ${practiceSummary}.`,
      "These are repository-level signals. They do not establish runtime components, data flow, or deployment architecture; inspect the source code before describing those details.",
    ].join("\n\n"),
  };
}
