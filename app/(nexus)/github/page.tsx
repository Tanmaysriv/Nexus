import {
  GitBranch,
  GitFork,
  Star,
  Users,
  ExternalLink,
  Code2,
  Sparkles,
} from "lucide-react";

import {
  getGitHubStats,
  getGitHubActivity,
} from "@/lib/github";

import { calculateCareerReadiness } from "@/lib/career-readiness";

import CareerReadinessCard from "@/components/dashboard/career-readiness";

import GitHubActivityCard from "@/components/dashboard/github-activity";

import { analyzeProject } from "@/lib/project-health";
import {
  getCachedRepositoryAnalysis,
} from "@/lib/github-cache";

import ProjectHealthCard from "@/components/dashboard/project-health";
export const dynamic = "force-dynamic";
export default async function GithubPage() {
  const github = await getGitHubStats();

const activity = await getGitHubActivity(
  github.profile.login
);

const analyzedProjects = await Promise.all(
  github.repos.map(async (repo) => {
    const signals =
      await getCachedRepositoryAnalysis(
        github.profile.login,
        repo.name
      );

    return analyzeProject(repo, signals);
  })
);

const careerReadiness =
  calculateCareerReadiness(
    github.repos,
    analyzedProjects
  );

  const languageEntries = Object.entries(github.languages).sort(
    ([, a], [, b]) => b - a
  );

  const totalLanguageRepos = languageEntries.reduce(
    (total, [, count]) => total + count,
    0
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <section>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Developer Intelligence
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              GitHub Intelligence
            </h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          A live overview of your GitHub repositories, technology
          usage, activity and development footprint.
        </p>
      </section>

      {/* Profile */}
      <section className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={github.profile.avatar_url}
              alt={github.profile.login}
              className="h-14 w-14 rounded-full border border-border"
            />

            <div>
              <h2 className="font-semibold">
                {github.profile.name || github.profile.login}
              </h2>

              <p className="text-sm text-muted-foreground">
                @{github.profile.login}
              </p>
            </div>
          </div>

          <a
            href={`https://github.com/${github.profile.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            View GitHub
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Metrics */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={GitBranch}
          title="Repositories"
          value={github.repositoryCount}
          description="Active public repositories"
        />

        <MetricCard
          icon={Star}
          title="Stars"
          value={github.totalStars}
          description="Total repository stars"
        />

        <MetricCard
          icon={GitFork}
          title="Forks"
          value={github.totalForks}
          description="Total repository forks"
        />

        <MetricCard
          icon={Users}
          title="Followers"
          value={github.profile.followers}
          description="GitHub followers"
        />
      </section>
            {/* GitHub Activity */}
      <div className="mt-6">
        <GitHubActivityCard activity={activity} />
      </div>

      {/* Project Health */}
      <div className="mt-6">
        <ProjectHealthCard projects={analyzedProjects} />
      </div>

      {/* Career Readiness */}
      <div className="mt-6">
        <CareerReadinessCard
          readiness={careerReadiness}
        />
      </div>

      {/* Main content */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Recent repositories */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Recently Updated
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Your latest active repositories
              </p>
            </div>

            <GitBranch className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 space-y-3">
            {github.recentRepos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  group block rounded-xl
                  border border-border/50
                  bg-background/40
                  p-4
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-primary/30
                  hover:bg-muted/40
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">
                      {repo.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {repo.description ||
                        "No repository description available."}
                    </p>
                  </div>

                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {repo.language && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      {repo.language}
                    </span>
                  )}

                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5" />
                    {repo.stargazers_count}
                  </span>

                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GitFork className="h-3.5 w-3.5" />
                    {repo.forks_count}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Updated{" "}
                    {new Date(repo.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Technology Footprint
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Languages across active repositories
              </p>
            </div>

            <Code2 className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-6 space-y-5">
            {languageEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No language data available.
              </p>
            ) : (
              languageEntries.map(([language, count]) => {
                const percentage =
                  totalLanguageRepos > 0
                    ? Math.round(
                        (count / totalLanguageRepos) * 100
                      )
                    : 0;

                return (
                  <div key={language}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {language}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {count} repo
                        {count !== 1 ? "s" : ""} · {percentage}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      {/* Intelligence */}
      <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>

          <div>
            <h2 className="font-semibold">
              NEXUS Insight
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your GitHub profile currently contains{" "}
              <span className="font-medium text-foreground">
                {github.repositoryCount} active repositories
              </span>{" "}
              with{" "}
              <span className="font-medium text-foreground">
                {github.totalStars} total stars
              </span>
              . NEXUS will use this development footprint
              to calculate project health and career readiness.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {title}
        </p>

        <Icon className="h-4 w-4 text-primary" />
      </div>

      <p className="mt-4 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}