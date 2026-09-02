import {
  CheckCircle2,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import type { SessionAnalytics } from "@/lib/interview-session";

type Props = {
  analytics: SessionAnalytics;
};

export default function SessionSummary({
  analytics,
}: Props) {
  if (analytics.totalQuestions === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border bg-card p-6">

      <div className="flex items-center justify-between">

        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />

            <h2 className="font-semibold">
              Interview Performance
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            NEXUS analysis of your current interview session
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold">
            {analytics.overall}
          </div>

          <div className="text-xs text-muted-foreground">
            /100
          </div>
        </div>

      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <Metric
          label="Technical"
          value={analytics.technicalCorrectness}
        />

        <Metric
          label="Relevance"
          value={analytics.relevance}
        />

        <Metric
          label="Depth"
          value={analytics.depth}
        />

        <Metric
          label="Communication"
          value={analytics.communication}
        />

        <Metric
          label="Project Knowledge"
          value={analytics.projectKnowledge}
        />

      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <div className="rounded-xl border p-4">

          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />

            <h3 className="text-sm font-semibold">
              Strengths
            </h3>
          </div>

          <div className="mt-3 space-y-2">

            {analytics.strengths.length > 0 ? (
              analytics.strengths.map(
                (strength) => (
                  <p
                    key={strength}
                    className="text-sm text-muted-foreground"
                  >
                    ✓ {strength}
                  </p>
                )
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Keep practicing to build stronger areas.
              </p>
            )}

          </div>

        </div>

        <div className="rounded-xl border p-4">

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />

            <h3 className="text-sm font-semibold">
              Needs Improvement
            </h3>
          </div>

          <div className="mt-3 space-y-2">

            {analytics.weakAreas.length > 0 ? (
              analytics.weakAreas.map(
                (area) => (
                  <p
                    key={area}
                    className="text-sm text-muted-foreground"
                  >
                    ⚠ {area}
                  </p>
                )
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                No major weak areas detected yet.
              </p>
            )}

          </div>

        </div>

      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="h-4 w-4" />

        {analytics.passedQuestions} of{" "}
        {analytics.totalQuestions} questions passed
      </div>

    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">

      <div className="text-xs text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-xl font-bold">
        {value}
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">

        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}