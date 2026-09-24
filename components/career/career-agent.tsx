"use client";

import { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  Target,
  Zap,
} from "lucide-react";

type AgentRecommendation = {
  actionId: string;
  title: string;
  category: string;
  priority: string;
  whyNow: string;
  firstStep: string;
  expectedImpact: string;
  relatedSkill?: string;
  relatedProject?: string;
};

type AgentSignal = {
  severity: string;
  area: string;
  signal: string;
  evidence: string;
};

type AgentResponse = {
  summary: string;
  focus: string;
  signals: AgentSignal[];
  recommendations: AgentRecommendation[];
  generatedAt: string;
};

type PersistedAction = {
  actionId: string;
  status: string;
  progress: number;
};

export default function CareerAgent() {
  const [data, setData] =
    useState<AgentResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  async function runAgent() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        "/api/career/agent",
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body?.error ??
            "Unable to run Career Agent."
        );
      }

      setData(body);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to run Career Agent."
      );
    } finally {
      setLoading(false);
    }
  }

  async function getPersistedActions() {
    const response = await fetch(
      "/api/career/actions",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        "Unable to synchronize career actions."
      );
    }

    const body = await response.json();

    return (body?.actions ?? []) as PersistedAction[];
  }

  async function patchAction(
    actionId: string,
    updates: {
      status?: string;
      progress?: number;
    }
  ) {
    return fetch(
      `/api/career/actions/${encodeURIComponent(
        actionId
      )}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      }
    );
  }

  async function updateAction(
    recommendation: AgentRecommendation,
    updates: {
      status?: string;
      progress?: number;
    },
    successMessage: string
  ) {
    setUpdatingId(recommendation.actionId);
    setError(null);
    setSuccess(null);

    try {
      let response = await patchAction(
        recommendation.actionId,
        updates
      );

      // The GET /api/career/actions endpoint
      // registers generated actions in the database.
      if (response.status === 404) {
        await getPersistedActions();

        response = await patchAction(
          recommendation.actionId,
          updates
        );
      }

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body?.error ??
            "Unable to update this career action."
        );
      }

      setSuccess(successMessage);

      // Refresh the agent after state changes so
      // recommendations adapt to the new evidence.
      await runAgent();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update this career action."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
            <BrainCircuit className="h-6 w-6 text-cyan-400" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
              AI Career Agent
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Determine your next best move
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              NEXUS evaluates your current engineering
              evidence and ranks the highest-impact
              career actions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runAgent}
          disabled={loading || updatingId !== null}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}

          {loading
            ? "Re-evaluating..."
            : "Run Career Agent"}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {!data &&
        !error &&
        !loading && (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/40">
            Run the agent to generate a fresh,
            evidence-based career priority plan.
          </div>
        )}

      {data && (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-white/10 bg-black/10 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Target className="h-4 w-4 text-cyan-400" />
              Current focus
            </div>

            <p className="mt-2 font-medium text-white">
              {data.focus}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/50">
              {data.summary}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {data.recommendations.map(
              (recommendation, index) => {
                const isUpdating =
                  updatingId ===
                  recommendation.actionId;

                return (
                  <article
                    key={recommendation.actionId}
                    className="rounded-xl border border-white/10 bg-black/10 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-sm font-bold text-cyan-400">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                        {recommendation.priority}
                      </span>
                    </div>

                    <h3 className="mt-4 font-semibold text-white">
                      {recommendation.title}
                    </h3>

                    <p className="mt-2 text-sm leading-5 text-white/50">
                      {recommendation.whyNow}
                    </p>

                    <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                        First step
                      </p>

                      <p className="mt-1 text-sm text-white/70">
                        {recommendation.firstStep}
                      </p>
                    </div>

                    <div className="mt-4 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] p-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-400/70">
                        <Clock3 className="h-3.5 w-3.5" />
                        Execution
                      </div>

                      <p className="mt-1 text-xs leading-5 text-white/50">
                        Start this action to add it to
                        your active Career Action Center
                        and track measurable progress.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          isUpdating ||
                          loading
                        }
                        onClick={() =>
                          updateAction(
                            recommendation,
                            {
                              status:
                                "In Progress",
                              progress: 10,
                            },
                            `Started: ${recommendation.title}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        Start Action
                      </button>

                      <button
                        type="button"
                        disabled={
                          isUpdating ||
                          loading
                        }
                        onClick={() =>
                          updateAction(
                            recommendation,
                            {
                              status:
                                "Completed",
                              progress: 100,
                            },
                            `Completed: ${recommendation.title}`
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Mark Complete
                      </button>
                    </div>

                    <div className="mt-4 border-t border-white/5 pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                        Expected impact
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/50">
                        {recommendation.expectedImpact}
                      </p>
                    </div>

                    {(recommendation.relatedSkill ||
                      recommendation.relatedProject) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {recommendation.relatedSkill && (
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/50">
                            {recommendation.relatedSkill}
                          </span>
                        )}

                        {recommendation.relatedProject && (
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/50">
                            {recommendation.relatedProject}
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>

          {data.signals.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <BrainCircuit className="h-4 w-4 text-cyan-400" />
                Evidence signals
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {data.signals
                  .slice(0, 4)
                  .map((signal) => (
                    <div
                      key={`${signal.area}-${signal.signal}`}
                      className="rounded-xl border border-white/10 bg-black/10 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-cyan-400">
                          {signal.area}
                        </span>

                        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/30">
                          {signal.severity}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-medium text-white">
                        {signal.signal}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        {signal.evidence}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

