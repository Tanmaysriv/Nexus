"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Loader2,
  Play,
  Target,
  Zap,
} from "lucide-react";

type CareerAction = {
  id: string;
  actionId: string;
  title: string;
  priority: string;
  category: string;
  reason: string;
  impact: string;
  steps: string[];
  relatedSkill?: string | null;
  relatedProject?: string | null;
  status: string;
  progress: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const priorityStyles: Record<string, string> = {
  Critical:
    "border-red-500/30 bg-red-500/10 text-red-400",
  High:
    "border-orange-500/30 bg-orange-500/10 text-orange-400",
  Medium:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  Low:
    "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

function getStatusIcon(status: string) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;

    case "In Progress":
      return <Clock3 className="h-4 w-4 text-cyan-400" />;

    default:
      return <Circle className="h-4 w-4 text-white/40" />;
  }
}

function getProgressLabel(progress: number) {
  if (progress >= 100) return "Completed";
  if (progress > 0) return "In Progress";
  return "Not Started";
}

export default function ActionCenter() {
  const [actions, setActions] = useState<CareerAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadActions() {
    try {
      setError(null);

      const response = await fetch("/api/career/actions", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load career actions.");
      }

      const data = await response.json();

      setActions(data.actions ?? []);
    } catch (err) {
      console.error(err);
      setError("Unable to load career actions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  // This effect intentionally loads persisted server state on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadActions();
}, []);

  async function updateAction(
    actionId: string,
    updates: {
      status?: string;
      progress?: number;
    },
  ) {
    try {
      setUpdating(actionId);
      setError(null);

      const response = await fetch(
        `/api/career/actions/${actionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update action.");
      }

      const data = await response.json();

      const updatedAction: CareerAction =
        data.action ?? data;

      setActions((current) =>
        current.map((action) =>
          action.actionId === actionId
            ? {
                ...action,
                ...updatedAction,
              }
            : action,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Unable to update this action. Please try again.");
    } finally {
      setUpdating(null);
    }
  }

  async function startAction(action: CareerAction) {
    await updateAction(action.actionId, {
      status: "In Progress",
      progress: Math.max(action.progress, 10),
    });
  }

  async function completeAction(action: CareerAction) {
    await updateAction(action.actionId, {
      status: "Completed",
      progress: 100,
    });
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span className="text-sm text-white/60">
            Loading career actions...
          </span>
        </div>
      </section>
    );
  }

  if (error && actions.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
        <p className="text-sm text-red-400">{error}</p>

        <button
          type="button"
          onClick={loadActions}
          className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          Retry
        </button>
      </section>
    );
  }

  if (actions.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-cyan-400" />

          <div>
            <h2 className="font-semibold text-white">
              Action Center
            </h2>

            <p className="mt-1 text-sm text-white/50">
              No career actions are available yet.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const completed = actions.filter(
    (action) => action.status === "Completed",
  ).length;

  const inProgress = actions.filter(
    (action) => action.status === "In Progress",
  ).length;

  const averageProgress =
    actions.length > 0
      ? Math.round(
          actions.reduce(
            (total, action) => total + action.progress,
            0,
          ) / actions.length,
        )
      : 0;

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/80">
                Career Execution
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Action Center
              </h2>
            </div>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Turn your career recommendations into measurable
            progress.
          </p>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-white/40">Actions </span>
            <span className="font-semibold text-white">
              {actions.length}
            </span>
          </div>

          <div className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-3 py-2">
            <span className="text-white/40">Active </span>
            <span className="font-semibold text-cyan-400">
              {inProgress}
            </span>
          </div>

          <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2">
            <span className="text-white/40">Done </span>
            <span className="font-semibold text-emerald-400">
              {completed}
            </span>
          </div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">
            Overall Action Progress
          </span>

          <span className="text-sm font-semibold text-white">
            {averageProgress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{
              width: `${averageProgress}%`,
            }}
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {actions.map((action) => {
          const isUpdating =
            updating === action.actionId;

          const isCompleted =
            action.status === "Completed" ||
            action.progress >= 100;

          const isInProgress =
            action.status === "In Progress" &&
            !isCompleted;

          return (
            <details
              key={action.actionId}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/15"
            >
              <summary className="cursor-pointer list-none p-5">
                <div className="flex items-start gap-4">
                  {/* Status */}
                  <div className="mt-1 shrink-0">
                    {getStatusIcon(action.status)}
                  </div>

                  {/* Main */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-white">
                        {action.title}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          priorityStyles[action.priority] ??
                          "border-white/10 bg-white/5 text-white/50"
                        }`}
                      >
                        {action.priority}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                        {action.category}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-white/50">
                      {action.reason}
                    </p>

                    {/* Progress */}
                    <div className="mt-4 max-w-xl">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-white/40">
                          {getProgressLabel(action.progress)}
                        </span>

                        <span className="font-medium text-white/70">
                          {action.progress}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, action.progress),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 group-open:rotate-180" />
                </div>
              </summary>

              <div className="border-t border-white/10 px-5 pb-5 pt-4">
                <div className="grid gap-5 lg:grid-cols-2">
                  {/* Impact */}
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/30">
                      Expected Impact
                    </p>

                    <p className="text-sm leading-6 text-white/60">
                      {action.impact}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3">
                    {action.relatedSkill && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">
                          Related Skill
                        </p>

                        <p className="mt-1 text-sm text-white/70">
                          {action.relatedSkill}
                        </p>
                      </div>
                    )}

                    {action.relatedProject && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/30">
                          Related Project
                        </p>

                        <p className="mt-1 text-sm text-white/70">
                          {action.relatedProject}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Steps */}
                {action.steps?.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                      Recommended Steps
                    </p>

                    <div className="space-y-2">
                      {action.steps.map((step, index) => (
                        <div
                          key={`${action.actionId}-${index}`}
                          className="flex gap-3 rounded-xl border border-white/5 bg-black/10 p-3"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-medium text-white/50">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-5 text-white/60">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {!isCompleted && !isInProgress && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => startAction(action)}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}

                      Start Action
                    </button>
                  )}

                  {isInProgress && (
                    <>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          updateAction(action.actionId, {
                            status: "In Progress",
                            progress: Math.min(
                              100,
                              action.progress + 10,
                            ),
                          })
                        }
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          "Update +10%"
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => completeAction(action)}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        Mark Complete
                      </button>
                    </>
                  )}

                  {isCompleted && (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Action Completed
                    </div>
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}