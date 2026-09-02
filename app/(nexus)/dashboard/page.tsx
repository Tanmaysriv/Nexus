"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Loader2,
  MessageSquare,
  Radar,
  Rocket,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

type Action = {
  id: string;
  actionId: string;
  title: string;
  priority: string;
  category: string;
  reason: string;
  impact: string;
  status: string;
  progress: number;
};

type ApiObject = Record<string, unknown>;

type DashboardData = {
  readiness: ApiObject | null;
  jobMatch: ApiObject | null;
  roadmap: ApiObject | null;
  progress: ApiObject | null;
  actions: Action[];
  github: ApiObject | null;
};

const priorityRank: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function getObject(
  value: unknown,
  key: string,
): ApiObject | null {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    const object = value as ApiObject;
    const nested = object[key];

    if (
      typeof nested === "object" &&
      nested !== null &&
      !Array.isArray(nested)
    ) {
      return nested as ApiObject;
    }
  }

  return null;
}

function getNumber(
  object: unknown,
  keys: string[],
  fallback = 0,
): number {
  if (
    typeof object !== "object" ||
    object === null ||
    Array.isArray(object)
  ) {
    return fallback;
  }

  const record = object as ApiObject;

  for (const key of keys) {
    const value = record[key];

    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }
  }

  return fallback;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Developing";
  if (score >= 40) return "Needs Work";
  return "Early Stage";
}

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 55) return "text-yellow-400";
  return "text-orange-400";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    readiness: null,
    jobMatch: null,
    roadmap: null,
    progress: null,
    actions: [],
    github: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(false);

      const endpoints = [
        "/api/career/readiness",
        "/api/career/job-match",
        "/api/career/roadmap",
        "/api/career/progress",
        "/api/career/actions",
        "/api/github",
      ];

      const responses = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint, {
              cache: "no-store",
            });

            if (!response.ok) {
              return null;
            }

            return await response.json();
          } catch {
            return null;
          }
        }),
      );

      setData({
        readiness: responses[0],
        jobMatch: responses[1],
        roadmap: responses[2],
        progress: responses[3],
        actions: responses[4]?.actions ?? [],
        github: responses[5],
      });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  // This effect intentionally loads dashboard data on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadDashboard();
}, []);

const readinessScore = useMemo(() => {
  return clamp(
    getNumber(
      getObject(data.readiness, "readiness"),
      ["score"],
    ),
  );
}, [data.readiness]);

const jobMatchScore = useMemo(() => {
  return clamp(
    getNumber(
      getObject(data.jobMatch, "readiness"),
      ["score"],
    ),
  );
}, [data.jobMatch]);

const roadmapProgress = useMemo(() => {
  return clamp(
    getNumber(
      getObject(data.progress, "progress"),
      ["overall"],
    ),
  );
}, [data.progress]);

  const githubRepos = getNumber(
    data.github,
    [
      "repositories",
      "repoCount",
      "totalRepositories",
    ],
  );

  const githubStars = getNumber(
    data.github,
    [
      "stars",
      "totalStars",
    ],
  );

  const completedActions = data.actions.filter(
    (action) =>
      action.status === "Completed" ||
      action.progress >= 100,
  ).length;

  const activeActions = data.actions.filter(
    (action) =>
      action.status === "In Progress",
  ).length;

  const nextActions = [...data.actions]
    .sort((a, b) => {
      const priority =
        (priorityRank[a.priority] ?? 99) -
        (priorityRank[b.priority] ?? 99);

      if (priority !== 0) return priority;

      return (a.progress ?? 0) - (b.progress ?? 0);
    })
    .filter(
      (action) =>
        action.status !== "Completed" &&
        action.progress < 100,
    )
    .slice(0, 4);

  const interviewScore = clamp(
  getNumber(
    getObject(data.readiness, "interview"),
    ["score"],
  ),
);

  const projectScore = clamp(
  getNumber(data.readiness, ["projectHealth"]),
);

  if (loading) {
    return (
      <main className="min-h-screen p-6 lg:p-8">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
          <div className="flex items-center gap-3 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Loading NEXUS intelligence...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan-400/80">
                <Radar className="h-4 w-4" />
                NEXUS Intelligence
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                Developer Command Center
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Your current career position, engineering signals,
                interview readiness and highest-impact next actions.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Activity className="h-4 w-4" />
              Refresh Intelligence
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.05] px-4 py-3 text-sm text-orange-400">
            Some intelligence modules could not be loaded. Available
            modules are still displayed.
          </div>
        )}

        {/* Primary scores */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ScoreCard
            icon={<Target className="h-5 w-5" />}
            label="Career Readiness"
            score={readinessScore}
            description={scoreLabel(readinessScore)}
          />

          <ScoreCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Job Match"
            score={jobMatchScore}
            description={scoreLabel(jobMatchScore)}
          />

          <ScoreCard
            icon={<Rocket className="h-5 w-5" />}
            label="Roadmap Progress"
            score={roadmapProgress}
            description={`${completedActions} actions completed`}
          />

          <ScoreCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="Interview Readiness"
            score={interviewScore}
            description={scoreLabel(interviewScore)}
          />
        </section>

        {/* Main intelligence grid */}
        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

          {/* Engineering profile */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Engineering Profile
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Your current signals
                </h2>
              </div>

              <Zap className="h-5 w-5 text-cyan-400" />
            </div>

            <div className="space-y-5">
              <SignalBar
                label="Project Engineering"
                score={projectScore}
              />

              <div>
  <div className="mb-2 flex items-center justify-between">
    <span className="text-sm text-white/60">
      GitHub Footprint
    </span>

    <span className="text-sm font-medium text-cyan-400">
      {githubRepos} repos
    </span>
  </div>

  <div className="flex gap-2">
    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
      {githubRepos} repositories
    </span>

    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
      {githubStars} stars
    </span>
  </div>
</div>

              <SignalBar
                label="Interview"
                score={interviewScore}
              />
<div>
  <div className="mb-2 flex items-center justify-between">
    <span className="text-sm text-white/60">
      System Design
    </span>

    <span className="text-xs text-yellow-400">
      Not assessed
    </span>
  </div>

  <p className="text-xs text-white/35">
    Start system-design interview practice to generate this signal.
  </p>
</div>
            </div>
          </div>

          {/* GitHub */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  GitHub Intelligence
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Engineering footprint
                </h2>
              </div>

              <Target className="h-5 w-5 text-white/60" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Repositories"
                value={githubRepos}
              />

              <StatCard
                label="Stars"
                value={githubStars}
              />

              <StatCard
                label="Active Actions"
                value={activeActions}
              />

              <StatCard
                label="Completed"
                value={completedActions}
              />
            </div>
          </div>
        </section>

        {/* Priority actions */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CircleDot className="h-5 w-5 text-cyan-400" />

                <h2 className="text-lg font-semibold text-white">
                  Priority Actions
                </h2>
              </div>

              <p className="mt-1 text-sm text-white/40">
                The highest-impact work NEXUS recommends doing next.
              </p>
            </div>

            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-400">
              {nextActions.length} next
            </span>
          </div>

          {nextActions.length === 0 ? (
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-5 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />

              <p className="mt-2 text-sm font-medium text-white">
                All current actions are complete.
              </p>

              <p className="mt-1 text-xs text-white/40">
                Generate or refresh your career actions to find
                the next opportunity.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {nextActions.map((action) => (
                <ActionCard
                  key={action.actionId}
                  action={action}
                />
              ))}
            </div>
          )}
        </section>

        {/* Roadmap */}
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-400" />

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Career Roadmap
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Progress
                </h2>
              </div>
            </div>

            <div className="mb-3 flex items-end justify-between">
              <span className="text-3xl font-semibold text-white">
                {roadmapProgress}%
              </span>

              <span className="text-xs text-white/40">
                overall completion
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                style={{
                  width: `${roadmapProgress}%`,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatCard
                label="Completed Actions"
                value={completedActions}
              />

              <StatCard
                label="Active Actions"
                value={activeActions}
              />
            </div>
          </div>

          {/* Career state */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center gap-3">
              <Radar className="h-5 w-5 text-cyan-400" />

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  NEXUS Assessment
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Current position
                </h2>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <p className="text-xs uppercase tracking-wider text-white/30">
                Overall Status
              </p>

              <p
                className={`mt-2 text-2xl font-semibold ${scoreClass(
                  readinessScore,
                )}`}
              >
                {scoreLabel(readinessScore)}
              </p>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Your next improvement should be driven by the
                highest-priority actions rather than trying to
                improve every skill simultaneously.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill
                label={`${activeActions} active`}
              />

              <StatusPill
                label={`${completedActions} completed`}
              />

              <StatusPill
                label={`${roadmapProgress}% roadmap`}
              />
            </div>
          </div>
        </section>

        {/* Footer navigation */}
        <section className="grid gap-3 sm:grid-cols-3">
          <DashboardLink
            href="/career"
            icon={<Target className="h-4 w-4" />}
            label="Career Intelligence"
          />

          <DashboardLink
            href="/interview"
            icon={<MessageSquare className="h-4 w-4" />}
            label="Interview Lab"
          />

          <DashboardLink
            href="/projects"
            icon={<Rocket className="h-4 w-4" />}
            label="Project Intelligence"
          />
        </section>
      </div>
    </main>
  );
}

function ScoreCard({
  icon,
  label,
  score,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-400">
          {icon}
        </div>

        <ArrowUpRight className="h-4 w-4 text-white/20" />
      </div>

      <p className="mt-5 text-xs uppercase tracking-wider text-white/35">
        {label}
      </p>

      <div className="mt-1 flex items-end gap-2">
        <span
          className={`text-3xl font-semibold ${scoreClass(score)}`}
        >
          {score}
        </span>

        <span className="mb-1 text-xs text-white/30">
          / 100
        </span>
      </div>

      <p className="mt-1 text-xs text-white/40">
        {description}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  );
}

function SignalBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-white/60">
          {label}
        </span>

        <span
          className={`text-sm font-medium ${scoreClass(score)}`}
        >
          {score}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 p-4">
      <p className="text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  action,
}: {
  action: Action;
}) {
  const priorityClass =
    action.priority === "Critical"
      ? "text-red-400"
      : action.priority === "High"
        ? "text-orange-400"
        : action.priority === "Medium"
          ? "text-yellow-400"
          : "text-blue-400";

  return (
    <div className="rounded-xl border border-white/5 bg-black/10 p-4 transition hover:border-white/10">
      <div className="flex items-start gap-3">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-white">
              {action.title}
            </h3>

            <span className={`text-[10px] ${priorityClass}`}>
              {action.priority}
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-white/40">
            {action.reason}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, action.progress ?? 0),
                  )}%`,
                }}
              />
            </div>

            <span className="text-[10px] text-white/40">
              {action.progress ?? 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
      {label}
    </span>
  );
}

function DashboardLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.04]"
    >
      <span className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white">
        {icon}
        {label}
      </span>

      <ArrowUpRight className="h-4 w-4 text-white/20 transition group-hover:text-cyan-400" />
    </a>
  );
}