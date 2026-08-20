import Link from "next/link";
import {
  BrainCircuit,
} from "lucide-react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Code2,
  FileText,
  Activity,
  GitBranch,
} from "lucide-react";
import { calculateProjectScore } from "@/lib/project-score";
import { getCachedRepositoryAnalysis } from "@/lib/github-cache";
import {
  calculateCareerImpact,
} from "@/lib/career-impact";
type PageProps = {
  params: Promise<{
    name: string;
  }>;
};

type GitHubRepository = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
};

async function getRepository(
  owner: string,
  repo: string
): Promise<GitHubRepository> {
  const token = process.env.GITHUB_TOKEN;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
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
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch repository: ${response.status}`
    );
  }

  return response.json();
}

function Signal({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        {enabled ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}

        <span className="text-sm font-medium">
          {label}
        </span>
      </div>

      <span
        className={
          enabled
            ? "text-xs font-medium text-green-500"
            : "text-xs font-medium text-muted-foreground"
        }
      >
        {enabled ? "Detected" : "Missing"}
      </span>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: PageProps) {
  const { name } = await params;

  const repoName = decodeURIComponent(name);

  const owner =
    process.env.GITHUB_USERNAME || "Tanmaysriv";

  const repository = await getRepository(
    owner,
    repoName
  );

  const signals =
    await getCachedRepositoryAnalysis(
      owner,
      repoName
    );

  const healthScore =
  calculateProjectScore(signals);

  const careerImpact =
  calculateCareerImpact(
    signals,
    healthScore
  );

  const recommendations: string[] = [];

  if (!signals.hasReadme) {
    recommendations.push(
      "Add a detailed README explaining the project architecture, setup and usage."
    );
  }

  if (!signals.hasTests) {
    recommendations.push(
      "Add unit or integration tests to improve engineering reliability."
    );
  }

  if (!signals.hasCI) {
    recommendations.push(
      "Add GitHub Actions for automated testing and CI/CD."
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
      "Add a .env.example file without exposing secrets."
    );
  }

  if (!signals.hasLicense) {
    recommendations.push(
      "Add an open-source license if you intend to publish the project."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Excellent engineering foundation. Continue improving documentation, testing and deployment automation."
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 lg:px-8">

      {/* Back */}
      <Link
        href="/projects"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

    <div className="flex flex-wrap gap-2">

  <a
    href={repository.html_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
  >
    View on GitHub
  </a>

  <Link
    href={`/projects/${encodeURIComponent(repoName)}/interview`}
    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
  >
    <BrainCircuit className="h-4 w-4" />
    Prepare for Interview
  </Link>

</div>

        </div>
      </section>

      {/* Health Score */}
      <section className="mb-8 rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

          <div>
            <p className="text-sm text-muted-foreground">
              Engineering Health
            </p>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-bold">
                {healthScore}
              </span>

              <span className="mb-2 text-muted-foreground">
                /100
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-2 flex justify-between text-sm">
              <span>Project maturity</span>
              <span>{healthScore}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${healthScore}%`,
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* Repository Stats */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          icon={<Code2 className="h-5 w-5" />}
          label="Primary Language"
          value={repository.language || "Unknown"}
        />

        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Stars"
          value={String(repository.stargazers_count)}
        />

        <StatCard
          icon={<GitBranch className="h-5 w-5" />}
          label="Forks"
          value={String(repository.forks_count)}
        />

        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Open Issues"
          value={String(repository.open_issues_count)}
        />

      </section>

      {/* Engineering Signals */}
      <section className="mb-8">

        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Engineering Signals
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            NEXUS analyzes the repository structure to evaluate engineering maturity.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">

          <Signal
            label="README Documentation"
            enabled={signals.hasReadme}
          />

          <Signal
            label="package.json"
            enabled={signals.hasPackageJson}
          />

          <Signal
            label="Automated Tests"
            enabled={signals.hasTests}
          />

          <Signal
            label="Docker"
            enabled={signals.hasDocker}
          />

          <Signal
            label="GitHub Actions / CI"
            enabled={signals.hasCI}
          />

          <Signal
            label="TypeScript"
            enabled={signals.hasTypeScript}
          />

          <Signal
            label=".env.example"
            enabled={signals.hasEnvironmentExample}
          />

          <Signal
            label="License"
            enabled={signals.hasLicense}
          />

        </div>
      </section>

      {/* Recommendations */}
      <section className="mb-8 rounded-2xl border bg-card p-6">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              NEXUS Recommendations
            </h2>

            <p className="text-sm text-muted-foreground">
              Improvements that can increase engineering maturity.
            </p>
          </div>

        </div>

        <div className="space-y-3">

          {recommendations.map(
            (recommendation, index) => (
              <div
                key={recommendation}
                className="flex gap-3 rounded-xl bg-muted/50 p-4"
              >
                <span className="font-semibold text-primary">
                  {index + 1}.
                </span>

                <p className="text-sm leading-6">
                  {recommendation}
                </p>
              </div>
            )
          )}

        </div>
      </section>
      <section className="mt-8 rounded-2xl border bg-card p-6">

  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
      <FileText className="h-5 w-5" />
    </div>

    <div>
      <h2 className="font-semibold">
        NEXUS Career Impact
      </h2>

      <p className="text-sm text-muted-foreground">
        How this project contributes to your engineering profile.
      </p>
    </div>
  </div>

  {/* Overall */}
  <div className="mt-6 rounded-xl border bg-background/40 p-5">
    <p className="text-sm text-muted-foreground">
      Overall Career Impact
    </p>

    <div className="mt-2 flex items-end gap-2">
      <span className="text-4xl font-bold">
        {careerImpact.overall}
      </span>

      <span className="mb-1 text-sm text-muted-foreground">
        /100
      </span>
    </div>
  </div>

  {/* Career Metrics */}
  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

    <CareerMetric
      label="Resume Strength"
      value={careerImpact.resumeStrength}
    />

    <CareerMetric
      label="Interview Value"
      value={careerImpact.interviewValue}
    />

    <CareerMetric
      label="Production Readiness"
      value={careerImpact.productionReadiness}
    />

    <CareerMetric
      label="Engineering Maturity"
      value={careerImpact.engineeringMaturity}
    />

  </div>

  {/* Roles */}
  <div className="mt-6">

    <h3 className="text-sm font-semibold">
      Recommended Roles
    </h3>

    <div className="mt-3 flex flex-wrap gap-2">

      {careerImpact.roles.map((role) => (
        <span
          key={role}
          className="rounded-full border px-3 py-1.5 text-xs font-medium"
        >
          {role}
        </span>
      ))}

    </div>

  </div>

  {/* Improvements */}
  {careerImpact.improvements.length > 0 && (
    <div className="mt-6">

      <h3 className="text-sm font-semibold">
        Improve Before Interviewing
      </h3>

      <div className="mt-3 space-y-2">

        {careerImpact.improvements.map(
          (improvement, index) => (
            <div
              key={improvement}
              className="flex gap-3 rounded-xl bg-muted/50 p-3"
            >
              <span className="font-semibold text-primary">
                {index + 1}.
              </span>

              <p className="text-sm text-muted-foreground">
                {improvement}
              </p>
            </div>
          )
        )}

      </div>

    </div>
  )}

</section>

    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">

      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}

        <span className="text-sm">
          {label}
        </span>
      </div>

      <p className="text-xl font-semibold">
        {value}
      </p>

    </div>
  );
}
function CareerMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {label}
        </span>

        <span className="text-sm font-semibold">
          {value}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: `${value}%`,
          }}
        />
      </div>

    </div>
  );
}