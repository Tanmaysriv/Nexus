export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  Code2,
  ExternalLink,
  Wrench,
  ShieldCheck,
  TestTube2,
  Container,
  GitBranch,
} from "lucide-react";

import { getGitHubRepos } from "@/lib/github";
import { analyzeRepository } from "@/lib/repository-analyzer";
import { analyzeProject } from "@/lib/project-health";

export default async function ProjectsPage() {
  const repos = await getGitHubRepos();

  const username = process.env.GITHUB_USERNAME;

  if (!username) {
    throw new Error("GITHUB_USERNAME is not configured.");
  }

  const projects = await Promise.all(
    repos
      .filter((repo) => !repo.fork && !repo.archived)
      .map(async (repo) => {
        const signals = await analyzeRepository(
          username,
          repo.name
        );

        return analyzeProject(repo, signals);
      })
  );

  return (
    <main className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />

          <h1 className="text-3xl font-bold tracking-tight">
            Project Intelligence
          </h1>
        </div>

        <p className="mt-2 text-muted-foreground">
          NEXUS analyzes your GitHub projects and identifies
          engineering strengths, weaknesses and improvement
          opportunities.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={projects.length}
        />

        <StatCard
          label="Average Health"
          value={
            projects.length > 0
              ? Math.round(
                  projects.reduce(
                    (total, project) =>
                      total + project.score,
                    0
                  ) / projects.length
                )
              : 0
          }
        />

        <StatCard
          label="Strong Projects"
          value={
            projects.filter(
              (project) => project.score >= 80
            ).length
          }
        />

        <StatCard
          label="Needs Improvement"
          value={
            projects.filter(
              (project) => project.score < 70
            ).length
          }
        />
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-10 text-center">
          <Code2 className="mx-auto h-10 w-10 text-muted-foreground" />

          <h2 className="mt-4 text-lg font-semibold">
            No projects found
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Make sure GITHUB_USERNAME is configured correctly.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------- */
/* Project Card */
/* -------------------------------------------------- */

function ProjectCard({
  project,
}: {
  project: ReturnType<typeof analyzeProject>;
}) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl transition hover:border-border">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">
            {project.name}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {project.verdict}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-3xl font-bold">
            {project.score}
          </div>

          <div className="text-xs text-muted-foreground">
            /100
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Overall Health
          </span>

          <span className="text-xs font-medium">
            {project.score}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${project.score}%`,
            }}
          />
        </div>
      </div>

      {/* Health Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <HealthMetric
          icon={Activity}
          label="Activity"
          value={project.activity}
        />

        <HealthMetric
          icon={BookOpen}
          label="Documentation"
          value={project.documentation}
        />

        <HealthMetric
          icon={Wrench}
          label="Maintenance"
          value={project.maintenance}
        />

        <HealthMetric
          icon={Code2}
          label="Tech Stack"
          value={project.techStack}
        />

        <HealthMetric
          icon={ShieldCheck}
          label="Engineering"
          value={project.engineering}
        />

        <HealthMetric
          icon={TestTube2}
          label="Tests"
          value={
            project.signals.hasTests
              ? 100
              : 0
          }
        />

        <HealthMetric
          icon={Container}
          label="Docker"
          value={
            project.signals.hasDocker
              ? 100
              : 0
          }
        />

        <HealthMetric
          icon={GitBranch}
          label="CI/CD"
          value={
            project.signals.hasCI
              ? 100
              : 0
          }
        />
      </div>

      {/* Recommendations */}
      {project.recommendations.length > 0 && (
        <div className="mt-6 border-t border-border/50 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            NEXUS Recommendations
          </p>

          <ul className="mt-3 space-y-2">
            {project.recommendations.map(
              (recommendation) => (
                <li
                  key={recommendation}
                  className="text-sm text-muted-foreground"
                >
                  • {recommendation}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border/50 pt-5">
        <Link
          href={`/projects/${encodeURIComponent(
            project.name
          )}`}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          View Intelligence

          <ExternalLink className="h-4 w-4" />
        </Link>

        <Link
          href={`/projects/${encodeURIComponent(
            project.name
          )}/interview`}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Practice Interview
        </Link>
      </div>
    </article>
  );
}

/* -------------------------------------------------- */
/* Health Metric */
/* -------------------------------------------------- */

function HealthMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />

        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{
              width: `${value}%`,
            }}
          />
        </div>

        <span className="text-xs font-medium">
          {value}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* Stat Card */
/* -------------------------------------------------- */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}