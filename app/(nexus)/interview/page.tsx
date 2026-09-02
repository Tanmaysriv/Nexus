import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  MessageSquare,
  Target,
  TrendingUp,
} from "lucide-react";

type InterviewHistory = {
  id: string;
  project: string;
  category: string | null;
  startedAt: string;
  endedAt: string | null;
  questionCount: number;

  overall: number;
  technicalCorrectness: number;
  relevance: number;
  depth: number;
  communication: number;
  projectKnowledge: number;
};

type HistoryResponse = {
  history: InterviewHistory[];
};

type AnalyticsDimension = {
  key: string;
  label: string;
  score: number;
};

type AnalyticsProject = {
  project: string;
  overall: number;
  technicalCorrectness: number;
  relevance: number;
  depth: number;
  communication: number;
  projectKnowledge: number;
  questionCount: number;
};

type AnalyticsResponse = {
  summary: {
    totalInterviews: number;
    totalQuestions: number;
    averageScore: number;
    bestScore: number;
  };

  scores: {
    overall: number;
    technicalCorrectness: number;
    relevance: number;
    depth: number;
    communication: number;
    projectKnowledge: number;
  };

  dimensions: AnalyticsDimension[];

  weakestAreas: AnalyticsDimension[];
  strongestAreas: AnalyticsDimension[];

  progression: {
    sessionId: string;
    project: string;
    date: string;
    score: number;
    questionCount: number;
  }[];

  projects: AnalyticsProject[];
};

async function getInterviewHistory(): Promise<HistoryResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/interview/history`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load interview history."
    );
  }

  return response.json();
}

async function getInterviewAnalytics(): Promise<AnalyticsResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/interview/analytics`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load interview analytics."
    );
  }

  return response.json();
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Needs Work";
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {label}
        </span>

        <span className="font-medium">
          {value}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

export default async function InterviewPage() {
  const [{ history }, analytics] =
    await Promise.all([
      getInterviewHistory(),
      getInterviewAnalytics(),
    ]);

  const totalInterviews = history.length;

  const totalQuestions = history.reduce(
    (total, session) =>
      total + session.questionCount,
    0
  );

  const averageScore =
    totalInterviews > 0
      ? Math.round(
          history.reduce(
            (total, session) =>
              total + session.overall,
            0
          ) / totalInterviews
        )
      : 0;

  const strongestInterview =
    history.length > 0
      ? Math.max(
          ...history.map(
            (session) => session.overall
          )
        )
      : 0;

  return (
    <main className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border/60 bg-card p-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              AI Interview Simulator
            </h1>

            <p className="mt-1 text-muted-foreground">
              Practice, evaluate and track your
              software engineering interview
              performance.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BrainCircuit}
          label="Interviews"
          value={totalInterviews}
        />

        <StatCard
          icon={MessageSquare}
          label="Questions"
          value={totalQuestions}
        />

        <StatCard
          icon={Target}
          label="Average Score"
          value={`${averageScore}/100`}
        />

        <StatCard
          icon={TrendingUp}
          label="Best Score"
          value={`${strongestInterview}/100`}
        />
      </div>

      {/* Analytics */}
<section className="mb-10">
  <div className="mb-5">
    <h2 className="text-xl font-semibold">
      Performance Analytics
    </h2>

    <p className="mt-1 text-sm text-muted-foreground">
      Understand your interview strengths,
      weaknesses, and progress over time.
    </p>
  </div>

  {/* Dimension scores */}
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
    {analytics.dimensions.map(
      (dimension) => (
        <div
          key={dimension.key}
          className="rounded-2xl border border-border/60 bg-card/70 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {dimension.label}
            </span>

            <span className="text-lg font-bold">
              {dimension.score}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${dimension.score}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {getScoreLabel(
              dimension.score
            )}
          </p>
        </div>
      )
    )}
  </div>

  {/* Strengths / weaknesses */}
  <div className="mt-5 grid gap-5 lg:grid-cols-2">
    <AnalyticsAreaCard
      title="Weakest Areas"
      description="Topics that should receive more practice."
      areas={analytics.weakestAreas}
    />

    <AnalyticsAreaCard
      title="Strongest Areas"
      description="Your strongest interview dimensions."
      areas={analytics.strongestAreas}
    />
  </div>

  {/* Progression */}
  <div className="mt-5 rounded-2xl border border-border/60 bg-card/70 p-6">
    <div className="mb-5">
      <h3 className="font-semibold">
        Score Progression
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Your interview performance across
        sessions.
      </p>
    </div>

    {analytics.progression.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        Complete an interview to start
        tracking progress.
      </p>
    ) : (
      <div className="space-y-4">
        {analytics.progression.map(
          (item, index) => (
            <div
              key={item.sessionId}
              className="flex items-center gap-4"
            >
              <div className="w-8 text-sm font-medium text-muted-foreground">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.project}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        item.date
                      ).toLocaleDateString()}{" "}
                      •{" "}
                      {item.questionCount}{" "}
                      questions
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-bold">
                    {item.score}/100
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${item.score}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    )}
  </div>

  {/* Project performance */}
  <div className="mt-5 rounded-2xl border border-border/60 bg-card/70 p-6">
    <div className="mb-5">
      <h3 className="font-semibold">
        Project Performance
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Interview performance grouped by
        project.
      </p>
    </div>

    <div className="space-y-5">
      {analytics.projects.map(
        (project) => (
          <div
            key={project.project}
            className="rounded-xl border border-border/50 bg-background/30 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-medium">
                  {project.project}
                </h4>

                <p className="mt-1 text-xs text-muted-foreground">
                  {project.questionCount}{" "}
                  questions
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">
                  {project.overall}
                </div>

                <div className="text-xs text-muted-foreground">
                  /100
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MiniAnalyticsScore
                label="Technical"
                value={
                  project.technicalCorrectness
                }
              />

              <MiniAnalyticsScore
                label="Relevance"
                value={
                  project.relevance
                }
              />

              <MiniAnalyticsScore
                label="Depth"
                value={project.depth}
              />

              <MiniAnalyticsScore
                label="Communication"
                value={
                  project.communication
                }
              />

              <MiniAnalyticsScore
                label="Project Knowledge"
                value={
                  project.projectKnowledge
                }
              />
            </div>
          </div>
        )
      )}
    </div>
  </div>
</section>

      {/* History */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Interview History
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review your previous interview
            sessions and performance.
          </p>
        </div>

        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {history.map((session) => (
              <InterviewCard
                key={session.id}
                session={session}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function InterviewCard({
  session,
}: {
  session: InterviewHistory;
}) {
  const date = new Date(
    session.startedAt
  ).toLocaleString();

  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Main information */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">
              {session.project}
            </h3>

            {session.category && (
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {session.category}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {date}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {session.questionCount}{" "}
              {session.questionCount === 1
                ? "Question"
                : "Questions"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ScoreBar
              label="Technical"
              value={
                session.technicalCorrectness
              }
            />

            <ScoreBar
              label="Relevance"
              value={session.relevance}
            />

            <ScoreBar
              label="Depth"
              value={session.depth}
            />

            <ScoreBar
              label="Communication"
              value={session.communication}
            />

            <ScoreBar
              label="Project Knowledge"
              value={
                session.projectKnowledge
              }
            />
          </div>
        </div>

        {/* Score */}
        <div className="flex shrink-0 items-center gap-6 lg:flex-col lg:items-end">
          <div>
            <div className="text-4xl font-bold">
              {session.overall}
            </div>

            <div className="text-right text-xs text-muted-foreground">
              /100
            </div>
          </div>

          <div className="text-sm font-medium">
            {getScoreLabel(session.overall)}
          </div>

          <Link
            href={`/interview/${session.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            View Interview
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />

        <span className="text-sm">
          {label}
        </span>
      </div>

      <div className="mt-3 text-3xl font-bold">
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <BrainCircuit className="mx-auto h-10 w-10 text-muted-foreground" />

      <h3 className="mt-4 font-semibold">
        No interviews yet
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Complete your first AI interview to
        start tracking your performance.
      </p>
    </div>
  );
}

function AnalyticsAreaCard({
  title,
  description,
  areas,
}: {
  title: string;
  description: string;
  areas: AnalyticsDimension[];
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>

      <div className="mt-5 space-y-4">
        {areas.map((area) => (
          <div key={area.key}>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {area.label}
              </span>

              <span className="text-sm font-bold">
                {area.score}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${area.score}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniAnalyticsScore({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {label}
        </span>

        <span className="text-xs font-semibold">
          {value}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
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