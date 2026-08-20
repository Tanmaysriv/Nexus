import {
  Award,
  Brain,
  Code2,
  GitBranch,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { CareerReadiness } from "@/lib/career-readiness";

type Props = {
  readiness: CareerReadiness;
};

export default function CareerReadinessCard({
  readiness,
}: Props) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />

            <h2 className="font-semibold">
              Career Readiness
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Software Engineer profile analysis
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold">
            {readiness.overall}%
          </p>

          <p className="text-xs text-muted-foreground">
            overall
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Score
          icon={Code2}
          label="Development"
          value={readiness.development}
        />

        <Score
          icon={GitBranch}
          label="GitHub"
          value={readiness.github}
        />

        <Score
          icon={Code2}
          label="Frontend"
          value={readiness.frontend}
        />

        <Score
          icon={Server}
          label="Backend"
          value={readiness.backend}
        />

        <Score
          icon={Brain}
          label="System Design"
          value={readiness.systemDesign}
        />

        <Score
          icon={ShieldCheck}
          label="Testing"
          value={readiness.testing}
        />
      </div>

      {/* Strengths + gaps */}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <InsightList
          title="Strengths"
          items={readiness.strengths}
          positive
        />

        <InsightList
          title="Priority Gaps"
          items={readiness.gaps}
        />
      </div>

      {/* Recommendations */}
      {readiness.recommendations.length > 0 && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />

            <p className="text-sm font-medium">
              NEXUS Recommendations
            </p>
          </div>

          <ul className="mt-3 space-y-2">
            {readiness.recommendations.map(
              (recommendation) => (
                <li
                  key={recommendation}
                  className="text-sm leading-5 text-muted-foreground"
                >
                  • {recommendation}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </section>
  );
}

function Score({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />

        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${value}%` }}
          />
        </div>

        <span className="text-sm font-semibold">
          {value}
        </span>
      </div>
    </div>
  );
}

function InsightList({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">
        {title}
      </p>

      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No signals detected yet.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item}
              className={`rounded-lg px-3 py-2 text-sm ${
                positive
                  ? "bg-primary/5 text-foreground"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {positive ? "✓ " : "⚠ "}
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
