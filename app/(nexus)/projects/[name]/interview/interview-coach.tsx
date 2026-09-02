"use client";
import SessionSummary from "@/components/interview/session-summary";
import {
  calculateSessionAnalytics,
  type InterviewResult,
} from "@/lib/interview-session";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type Question = {
  question: string;
  category:
    | "Project"
    | "Architecture"
    | "Technical"
    | "Testing"
    | "DevOps"
    | "System Design"
    | "Behavioral";
  difficulty: "Easy" | "Medium" | "Hard";
};

type Evaluation = {
  overall: number;
  technicalCorrectness: number;
  relevance: number;
  depth: number;
  communication: number;
  projectKnowledge: number;
  verdict: string;
  strengths: string[];
  missingConcepts: string[];
  improvements: string[];
  idealAnswer: string;
  followUpQuestion: string;
};

type Props = {
  projectName: string;
  questions: Question[];
};

const difficultyStyles = {
  Easy: "border-green-500/20 bg-green-500/10 text-green-600",
  Medium:
    "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
  Hard:
    "border-red-500/20 bg-red-500/10 text-red-600",
};

export default function InterviewCoach({
  projectName,
  questions,
}: Props) {
const [currentIndex, setCurrentIndex] = useState(0);
const [sessionId, setSessionId] = useState<string | null>(null);
const [answer, setAnswer] =
  useState("");

const [evaluation, setEvaluation] =
  useState<Evaluation | null>(null);

const [sessionResults, setSessionResults] =
  useState<InterviewResult[]>([]);

const sessionAnalytics =
  calculateSessionAnalytics(
    sessionResults
  );
  const [loading, setLoading] = useState(false);

  const question = questions[currentIndex];

  const progress = useMemo(
    () =>
      Math.round(
        ((currentIndex + 1) / questions.length) * 100
      ),
    [currentIndex, questions.length]
  );

  async function evaluateAnswer() {
  if (!answer.trim() || loading) return;

  setLoading(true);
  setEvaluation(null);

  try {
    const response = await fetch(
      "/api/interview/evaluate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          sessionId,
          question: question.question,
          answer,
          category: question.category,
          difficulty: question.difficulty,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not evaluate the answer."
      );
    }

    /*
     * The first answer creates the interview
     * session. Keep that session ID for all
     * subsequent answers.
     */
    if (data.sessionId) {
      setSessionId(data.sessionId);
    }

    setEvaluation(data);

    setSessionResults((previous) => [
      ...previous,
      {
        question: question.question,
        answer,
        category: question.category,
        difficulty: question.difficulty,
        evaluation: data,
      },
    ]);
  } catch (error) {
    console.error(error);

    setEvaluation({
      overall: 0,
      technicalCorrectness: 0,
      relevance: 0,
      depth: 0,
      communication: 0,
      projectKnowledge: 0,
      verdict: "Evaluation failed",
      strengths: [],
      missingConcepts: [],
      improvements: [
        "Could not evaluate the answer. Please try again.",
      ],
      idealAnswer: "",
      followUpQuestion: "",
    });
  } finally {
    setLoading(false);
  }
}

function nextQuestion() {
  if (currentIndex >= questions.length - 1) {
    return;
  }

  setCurrentIndex(
    (index) => index + 1
  );

  setAnswer("");
  setEvaluation(null);
}

  function resetQuestion() {
    setAnswer("");
    setEvaluation(null);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 lg:px-8">

      <Link
        href={`/projects/${encodeURIComponent(projectName)}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project Intelligence
      </Link>

      {/* Header */}
      <section className="mb-8">
        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <BrainCircuit className="h-6 w-6 text-primary" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              NEXUS AI Interview Coach
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              {projectName}
            </h1>
          </div>

        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Answer the question like you would during a
          real technical interview. NEXUS will evaluate
          your response and suggest improvements.
        </p>
      </section>

      {/* Progress */}
      <div className="mb-6">

        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>

          <span>{progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

      </div>

      {/* Question */}
      <section className="rounded-2xl border bg-card p-6">

        <div className="flex flex-wrap items-center gap-2">

          <span className="rounded-full border px-3 py-1 text-xs font-medium">
            {question.category}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${difficultyStyles[question.difficulty]}`}
          >
            {question.difficulty}
          </span>

        </div>

        <div className="mt-5 flex gap-4">

          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary sm:flex">
            {String(currentIndex + 1).padStart(2, "0")}
          </div>

          <h2 className="text-xl font-semibold leading-8 sm:text-2xl">
            {question.question}
          </h2>

        </div>

        {/* Answer */}
        <div className="mt-6">

          <label
            htmlFor="answer"
            className="mb-2 block text-sm font-medium"
          >
            Your answer
          </label>

          <textarea
            id="answer"
            value={answer}
            onChange={(event) =>
              setAnswer(event.target.value)
            }
            disabled={loading}
            placeholder="Explain your answer as if you were speaking to an interviewer..."
            className="min-h-48 w-full resize-y rounded-xl border bg-background p-4 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>
              {answer.trim()
                ? answer.trim().split(/\s+/).length
                : 0}{" "}
              words
            </span>

            <span>Be specific and use examples.</span>
          </div>

        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">

          <button
            type="button"
            onClick={evaluateAnswer}
            disabled={!answer.trim() || loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Evaluate My Answer
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetQuestion}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

        </div>

      </section>

      {/* Interview Session Analytics */}
      {sessionResults.length > 0 && (
        <div className="mt-6">
          <SessionSummary
            analytics={sessionAnalytics}
          />
        </div>
      )}
      {/* Evaluation */}
      {evaluation && (
        <section className="mt-6 space-y-5">

          {/* Score */}
<div className="rounded-2xl border bg-card p-6">

  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">

    <div className="shrink-0 text-center lg:w-40">

      <p className="text-sm text-muted-foreground">
        NEXUS Score
      </p>

      <div className="mt-1">
        <span className="text-5xl font-bold">
          {evaluation.overall}
        </span>

        <span className="text-sm text-muted-foreground">
          /100
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold">
        {evaluation.verdict}
      </p>

    </div>

    <div className="flex-1 space-y-4">

      <ScoreBar
        label="Technical Correctness"
        value={evaluation.technicalCorrectness}
      />

      <ScoreBar
        label="Relevance"
        value={evaluation.relevance}
      />

      <ScoreBar
        label="Depth"
        value={evaluation.depth}
      />

      <ScoreBar
        label="Communication"
        value={evaluation.communication}
      />

      <ScoreBar
        label="Project Knowledge"
        value={evaluation.projectKnowledge}
      />

    </div>

  </div>

</div>

          {/* Strengths */}
          {evaluation.strengths.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />

                <h3 className="font-semibold">
                  What you did well
                </h3>
              </div>

              <div className="mt-4 space-y-2">
                {evaluation.strengths.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-green-500/5 p-3 text-sm text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Improvements */}
          <div className="rounded-2xl border bg-card p-6">

            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-yellow-500" />

              <h3 className="font-semibold">
                How to improve
              </h3>
            </div>

            <div className="mt-4 space-y-2">
              {evaluation.improvements.map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground"
                  >
                    <span className="font-semibold text-primary">
                      {index + 1}.
                    </span>

                    {item}
                  </div>
                )
              )}
            </div>

          </div>
          {/* Missing Concepts */}
          {evaluation.missingConcepts.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">

              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />

                <h3 className="font-semibold">
                  Missing Concepts
                </h3>
              </div>

              <div className="mt-4 space-y-2">
                {evaluation.missingConcepts.map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-yellow-500/5 p-3 text-sm text-muted-foreground"
                    >
                      ⚠ {item}
                    </div>
                  )
                )}
              </div>

            </div>
          )}
          {/* Ideal Answer */}
          {evaluation.idealAnswer && (
            <div className="rounded-2xl border bg-card p-6">

              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />

                <h3 className="font-semibold">
                  NEXUS Suggested Approach
                </h3>
              </div>

              <p className="mt-4 rounded-xl bg-primary/5 p-4 text-sm leading-7 text-muted-foreground">
                {evaluation.idealAnswer}
              </p>

            </div>
          )}
                    {/* Follow-up Question */}
          {evaluation.followUpQuestion && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">

              <div className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-primary" />

                <h3 className="font-semibold">
                  NEXUS Follow-up Question
                </h3>
              </div>

              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {evaluation.followUpQuestion}
              </p>

            </div>
          )}
          {/* Next */}
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={nextQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Next Question
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />

              <h3 className="mt-3 font-semibold">
                Interview session complete
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                You&apos;ve completed all NEXUS questions for this project.
              </p>
            </div>
          )}

        </section>
      )}

    </main>
  );
}
function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>

      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">
          {label}
        </span>

        <span className="font-semibold">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">

        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}
