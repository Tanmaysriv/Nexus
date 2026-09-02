import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Target,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

async function getSession(sessionId: string) {
  return prisma.interviewSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      answers: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

function average(
  values: number[]
) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (total, value) => total + value,
      0
    ) / values.length
  );
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";

  return "Needs Work";
}

function ScoreCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
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

      <div className="mt-1 text-xs text-muted-foreground">
        /100
      </div>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />

        <h4 className="text-sm font-semibold">
          {title}
        </h4>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No specific feedback provided.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="text-sm text-muted-foreground"
            >
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function InterviewSessionPage({
  params,
}: Props) {
  const { sessionId } = await params;

  const session =
    await getSession(sessionId);

  if (!session) {
    return (
      <main className="min-h-full p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Interview History
          </Link>

          <div className="mt-8 rounded-2xl border border-border/60 bg-card/70 p-10 text-center">
            <BrainCircuit className="mx-auto h-10 w-10 text-muted-foreground" />

            <h1 className="mt-4 text-xl font-semibold">
              Interview not found
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              This interview session does not
              exist or may have been deleted.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const answers = session.answers;

  const overall = average(
    answers.map(
      (answer) => answer.overall
    )
  );

  const technicalCorrectness = average(
    answers.map(
      (answer) =>
        answer.technicalCorrectness
    )
  );

  const relevance = average(
    answers.map(
      (answer) => answer.relevance
    )
  );

  const depth = average(
    answers.map(
      (answer) => answer.depth
    )
  );

  const communication = average(
    answers.map(
      (answer) => answer.communication
    )
  );

  const projectKnowledge = average(
    answers.map(
      (answer) =>
        answer.projectKnowledge
    )
  );

  const startedAt =
    new Date(
      session.startedAt
    ).toLocaleString();

  return (
    <main className="min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <Link
          href="/interview"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Interview History
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-border/60 bg-background p-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  {session.project}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {session.category ??
                    "Technical Interview"}{" "}
                  • {answers.length}{" "}
                  {answers.length === 1
                    ? "Question"
                    : "Questions"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Started {startedAt}
            </p>
          </div>

          {/* Overall score */}
          <div className="rounded-2xl border border-border/60 bg-background/40 px-8 py-5 text-center">
            <div className="text-5xl font-bold">
              {overall}
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              /100
            </div>

            <div className="mt-2 text-sm font-medium">
              {getScoreLabel(overall)}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <section className="mt-6">
          <h2 className="mb-4 text-lg font-semibold">
            Performance Breakdown
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ScoreCard
              icon={Target}
              label="Technical"
              value={
                technicalCorrectness
              }
            />

            <ScoreCard
              icon={Target}
              label="Relevance"
              value={relevance}
            />

            <ScoreCard
              icon={BrainCircuit}
              label="Depth"
              value={depth}
            />

            <ScoreCard
              icon={MessageSquare}
              label="Communication"
              value={communication}
            />

            <ScoreCard
              icon={Target}
              label="Project Knowledge"
              value={
                projectKnowledge
              }
            />
          </div>
        </section>

        {/* Questions */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Question-by-Question Review
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Review your answers and Gemini&apos;s
              interview feedback.
            </p>
          </div>

          <div className="space-y-6">
            {answers.map(
              (answer, index) => (
                <article
                  key={answer.id}
                  className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm"
                >
                  {/* Question header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Question{" "}
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {
                            answer.difficulty
                          }
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold">
                        {answer.question}
                      </h3>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-3xl font-bold">
                        {answer.overall}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        /100
                      </div>

                      <div className="mt-1 text-xs font-medium">
                        {answer.verdict}
                      </div>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="mt-6 rounded-xl border border-border/50 bg-background/30 p-5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />

                      <h4 className="text-sm font-semibold">
                        Your Answer
                      </h4>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {answer.answer}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <MiniScore
                      label="Technical"
                      value={
                        answer.technicalCorrectness
                      }
                    />

                    <MiniScore
                      label="Relevance"
                      value={
                        answer.relevance
                      }
                    />

                    <MiniScore
                      label="Depth"
                      value={answer.depth}
                    />

                    <MiniScore
                      label="Communication"
                      value={
                        answer.communication
                      }
                    />

                    <MiniScore
                      label="Project"
                      value={
                        answer.projectKnowledge
                      }
                    />
                  </div>

                  {/* Gemini feedback */}
                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <FeedbackList
                      title="Strengths"
                      items={
                        answer.strengths
                      }
                      icon={
                        CheckCircle2
                      }
                    />

                    <FeedbackList
                      title="Missing Concepts"
                      items={
                        answer.missingConcepts
                      }
                      icon={XCircle}
                    />

                    <FeedbackList
                      title="Improvements"
                      items={
                        answer.improvements
                      }
                      icon={Lightbulb}
                    />
                  </div>

                  {/* Ideal answer */}
                  {answer.idealAnswer && (
                    <div className="mt-5 rounded-xl border border-border/50 bg-background/30 p-5">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-primary" />

                        <h4 className="text-sm font-semibold">
                          Ideal Answer
                        </h4>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {
                          answer.idealAnswer
                        }
                      </p>
                    </div>
                  )}

                  {/* Follow-up */}
                  {answer.followUpQuestion && (
                    <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Recommended Follow-up
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        {
                          answer.followUpQuestion
                        }
                      </p>
                    </div>
                  )}
                </article>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniScore({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {label}
        </span>

        <span className="font-semibold">
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