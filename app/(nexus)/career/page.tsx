import CareerProgress from "./career-progress";
import ActionCenter from "./action-center";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Code2,
  GitBranch,
  GraduationCap,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";

type ReadinessResponse = {
  readiness: {
    score: number;
    label: string;
  };
  projectHealth: number;
  interview: {
    score: number;
    technical: number;
    relevance: number;
    depth: number;
    communication: number;
    projectKnowledge: number;
    sessions: number;
    questions: number;
  };
  recommendations: string[];
};

type JobMatchResponse = {
  role: {
    id: string;
    name: string;
    description: string;
  };

  readiness: {
    score: number;
    label: string;
  };

  skillMatch: number;

  matchedSkills: string[];
  missingSkills: string[];
  prioritySkills: string[];

  skillEvidence: {
    verified: string[];
    interviewSupported: string[];
    missing: string[];
  };

  interview: {
    score: number;
    questions: number;
    sessions: number;

    dimensions: {
      technicalCorrectness: number;
      relevance: number;
      depth: number;
      communication: number;
      projectKnowledge: number;
    };
  };

  repositories: {
    count: number;
    detectedSkills: string[];
    technologies: Record<string, string[]>;
  };
};

type RoadmapItem = {
  skill: string;
  priority: "Critical" | "High" | "Medium";
  reason: string;
  focus: string[];
};

type RoadmapResponse = {
  targetRole: string;
  currentInterviewScore: number;
  repositoryCount: number;

  roadmap: {
    estimatedWeeks: number;
    items: RoadmapItem[];
  };

  nextAction: string;
};

type ProgressItem = {
  id: string;
  skill: string;
  priority: "Critical" | "High" | "Medium";
  reason: string;
  focus: string[];
  progress: number;
  completed: boolean;
};

type ProgressResponse = {
  roadmapId: string;
  role: string;

  progress: {
    overall: number;
    completed: number;
    total: number;
  };

  items: ProgressItem[];
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3000";

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${APP_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load ${path}: ${response.status}`
    );
  }

  return response.json();
}

async function getCareerReadiness() {
  return apiFetch<ReadinessResponse>(
    "/api/career/readiness"
  );
}

async function getJobMatch() {
  return apiFetch<JobMatchResponse>(
    "/api/career/job-match?role=software-engineer"
  );
}

async function getRoadmap() {
  return apiFetch<RoadmapResponse>(
    "/api/career/roadmap"
  );
}

async function getProgress() {
  return apiFetch<ProgressResponse>(
    "/api/career/progress"
  );
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, value)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {label}
        </span>

        <span className="font-semibold">
          {safeValue}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>
    </div>
  );
}

function SkillBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  const classes = {
    default:
      "border-border bg-muted/50 text-foreground",

    success:
      "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400",

    warning:
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${classes[variant]}`}
    >
      {children}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: RoadmapItem["priority"];
}) {
  const classes = {
    Critical:
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",

    High:
      "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",

    Medium:
      "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classes[priority]}`}
    >
      {priority}
    </span>
  );
}

function RoadmapCard({
  item,
  index,
  progress,
}: {
  item: RoadmapItem;
  index: number;
  progress?: ProgressItem;
}) {
  const currentProgress =
    progress?.progress ?? 0;

  const completed =
    progress?.completed ??
    currentProgress >= 100;

  return (
    <details
      open={completed}
      className="group rounded-2xl border bg-card shadow-sm transition-colors hover:bg-muted/20"
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            completed
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            String(index + 1).padStart(2, "0")
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">
              {item.skill}
            </h3>

            <PriorityBadge
              priority={item.priority}
            />

            {completed && (
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
                Completed
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {item.reason}
          </p>

          <div className="mt-3 max-w-xl">
            <ScoreBar
              label={`${currentProgress}% complete`}
              value={currentProgress}
            />
          </div>
        </div>

        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="border-t px-5 pb-5 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Focus Areas
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {item.focus.map((focus) => (
            <div
              key={focus}
              className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {focus}
            </div>
          ))}
        </div>

        {completed ? (
          <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="font-medium text-green-600 dark:text-green-400">
              Skill completed
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              NEXUS has recorded this roadmap area as
              completed.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border bg-primary/5 p-4">
            <p className="font-medium">
              Current progress
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Continue working through the focus areas
              and update your progress below.
            </p>
          </div>
        )}
      </div>
    </details>
  );
}

export default async function CareerPage() {
  const [
    readiness,
    jobMatch,
    roadmap,
    progress,
  ] = await Promise.all([
    getCareerReadiness(),
    getJobMatch(),
    getRoadmap(),
    getProgress(),
  ]);

  const interviewDimensions = [
    {
      label: "Technical Correctness",
      value:
        jobMatch.interview.dimensions
          .technicalCorrectness,
    },
    {
      label: "Relevance",
      value:
        jobMatch.interview.dimensions.relevance,
    },
    {
      label: "Depth",
      value:
        jobMatch.interview.dimensions.depth,
    },
    {
      label: "Communication",
      value:
        jobMatch.interview.dimensions.communication,
    },
    {
      label: "Project Knowledge",
      value:
        jobMatch.interview.dimensions
          .projectKnowledge,
    },
  ];

  const progressMap = new Map(
    progress.items.map((item) => [
      item.skill,
      item,
    ])
  );

  const completedCount =
    progress.progress.completed;

  const totalSkills =
    progress.progress.total;

  const overallProgress =
    progress.progress.overall;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      {/* Header */}

      <section className="mb-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
              <BrainCircuit className="h-4 w-4" />
              Career Intelligence
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your Engineering Readiness
            </h1>

            <p className="mt-3 max-w-2xl text-muted-foreground">
              NEXUS analyzes your GitHub projects,
              technical skills, interview performance,
              and career gaps to build a personalized
              path toward your target role.
            </p>
          </div>

          <Link
            href="/interview"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Practice Interview
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Main scores */}

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Overall Readiness
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                {readiness.readiness.score}
                <span className="text-lg font-medium text-muted-foreground">
                  /100
                </span>
              </h2>
            </div>

            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Target className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5">
            <ScoreBar
              label={readiness.readiness.label}
              value={readiness.readiness.score}
            />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Combined assessment of your technical
            evidence and interview performance.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Software Engineer Match
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                {jobMatch.skillMatch}
                <span className="text-lg font-medium text-muted-foreground">
                  %
                </span>
              </h2>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
              <Code2 className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5">
            <ScoreBar
              label="Verified technical skills"
              value={jobMatch.skillMatch}
            />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Based on technologies detected across{" "}
            {jobMatch.repositories.count} active
            repositories.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Interview Readiness
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                {jobMatch.interview.score}
                <span className="text-lg font-medium text-muted-foreground">
                  /100
                </span>
              </h2>
            </div>

            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400">
              <BrainCircuit className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5">
            <ScoreBar
              label={`${jobMatch.interview.sessions} sessions · ${jobMatch.interview.questions} questions`}
              value={jobMatch.interview.score}
            />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Focus on technical depth and project
            knowledge to raise this score.
          </p>
        </div>
      </section>
      <ActionCenter />

      {/* Interview + Career signal */}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Interview Performance
              </h2>

              <p className="text-sm text-muted-foreground">
                Breakdown across evaluation dimensions
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {interviewDimensions.map(
              (dimension) => (
                <ScoreBar
                  key={dimension.label}
                  label={dimension.label}
                  value={dimension.value}
                />
              )
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2 text-green-600 dark:text-green-400">
              <Award className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Career Signal
              </h2>

              <p className="text-sm text-muted-foreground">
                Your current engineering evidence
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5 text-primary" />

                <div>
                  <p className="font-medium">
                    {jobMatch.repositories.count} Active
                    Repositories
                  </p>

                  <p className="text-sm text-muted-foreground">
                    NEXUS analyzed your GitHub portfolio.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />

                <div>
                  <p className="font-medium">
                    {
                      jobMatch.repositories
                        .detectedSkills.length
                    }{" "}
                    Detected Skills
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Technologies verified from your
                    projects.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />

                <div>
                  <p className="font-medium">
                    Target Role
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {jobMatch.role.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Roadmap Progress
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {overallProgress}%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">
                    {completedCount}/{totalSkills}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    skills completed
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <ScoreBar
                  label="Overall roadmap"
                  value={overallProgress}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Verified Skills
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Skills supported by repository evidence.
              </p>
            </div>

            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>

          <div className="flex flex-wrap gap-2">
            {jobMatch.skillEvidence.verified.map(
              (skill) => (
                <SkillBadge
                  key={skill}
                  variant="success"
                >
                  {skill}
                </SkillBadge>
              )
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Skill Gaps
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Skills NEXUS recommends improving.
              </p>
            </div>

            <XCircle className="h-5 w-5 text-yellow-500" />
          </div>

          <div className="flex flex-wrap gap-2">
            {jobMatch.skillEvidence.missing.map(
              (skill) => (
                <SkillBadge
                  key={skill}
                  variant="warning"
                >
                  {skill}
                </SkillBadge>
              )
            )}
          </div>
        </div>
      </section>

      {/* Priority */}

      <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Priority Skills
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Focus on these skills first to improve your
            Software Engineer readiness.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {jobMatch.prioritySkills.map(
            (skill, index) => (
              <div
                key={skill}
                className="rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <p className="mt-4 font-medium">
                  {skill}
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Roadmap */}

      <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <GraduationCap className="h-4 w-4" />
              Personalized Learning Roadmap
            </div>

            <h2 className="text-2xl font-bold">
              Your {roadmap.roadmap.estimatedWeeks}-Week
              Engineering Plan
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              NEXUS generated this roadmap from your
              current skill gaps and target role:
              <span className="font-medium text-foreground">
                {" "}
                {roadmap.targetRole}
              </span>
              .
            </p>
          </div>

          <div className="rounded-xl border bg-primary/5 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Next Action
            </p>

            <p className="mt-1 font-semibold text-primary">
              {roadmap.nextAction}
            </p>
          </div>
        </div>

        {/* Overall roadmap progress */}

        <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Overall Progress
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {completedCount} of {totalSkills} roadmap
                skills completed.
              </p>
            </div>

            <p className="text-2xl font-bold">
              {overallProgress}%
            </p>
          </div>

          <div className="mt-4">
            <ScoreBar
              label="Career roadmap completion"
              value={overallProgress}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {roadmap.roadmap.items.map(
            (item, index) => (
              <RoadmapCard
                key={item.skill}
                item={item}
                index={index}
                progress={progressMap.get(
                  item.skill
                )}
              />
            )
          )}
        </div>
      </section>

      {/* Roadmap summary */}

      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Roadmap Duration
          </p>

          <p className="mt-2 text-3xl font-bold">
            {roadmap.roadmap.estimatedWeeks}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            weeks
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Skills to Improve
          </p>

          <p className="mt-2 text-3xl font-bold">
            {roadmap.roadmap.items.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            roadmap areas
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold">
            {completedCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            skills
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Interview Score
          </p>

          <p className="mt-2 text-3xl font-bold">
            {roadmap.currentInterviewScore}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            out of 100
          </p>
        </div>
      </section>

      {/* Technology stack */}

      <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Detected Technology Stack
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Technologies discovered across your GitHub
            repositories.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {jobMatch.repositories.detectedSkills.map(
            (skill) => (
              <SkillBadge key={skill}>
                {skill}
              </SkillBadge>
            )
          )}
        </div>
      </section>

      {/* Recommendations */}

      <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            NEXUS Recommendations
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Actions that will have the biggest impact
            on your readiness.
          </p>
        </div>

        <div className="grid gap-3">
          {readiness.recommendations.map(
            (recommendation, index) => (
              <div
                key={recommendation}
                className="flex gap-4 rounded-xl border bg-muted/20 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>

                <p className="text-sm leading-6">
                  {recommendation}
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Final action */}

      <section className="mt-6 rounded-2xl border bg-primary/5 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Your next step:{" "}
              {roadmap.nextAction}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Keep improving your roadmap skills,
              practice realistic technical interviews,
              and increase your engineering readiness.
            </p>
          </div>

          <Link
            href="/interview"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start Practice
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Existing interactive progress manager */}

      <div className="mt-6">
        <CareerProgress />
      </div>
    </main>
  );
}