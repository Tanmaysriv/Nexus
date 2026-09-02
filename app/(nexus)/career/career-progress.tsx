"use client";

import { CheckCircle2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

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

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function CareerProgress() {
  const [data, setData] =
    useState<ProgressResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState<string | null>(null);

  async function loadProgress() {
    try {
      const response = await fetch(
        "/api/career/progress",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load progress."
        );
      }

      const result =
        await response.json();

      setData(result);
    } catch (error) {
      console.error(
        "Career progress error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  // This effect intentionally loads persisted server state on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadProgress();
}, []);

  async function updateProgress(
    item: ProgressItem,
    nextProgress: number
  ) {
    const progress = clamp(
      nextProgress
    );

    setUpdating(item.id);

    try {
      const response =
        await fetch(
          "/api/career/progress",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              itemId: item.id,
              progress,
              completed:
                progress >= 100,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to update progress."
        );
      }

      await loadProgress();
    } catch (error) {
      console.error(
        "Progress update error:",
        error
      );
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Unable to load roadmap progress.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              Career Roadmap
            </h2>

            <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium">
              {data.role}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Track your progress toward your
            target role.
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold">
            {data.progress.overall}%
          </p>

          <p className="text-xs text-muted-foreground">
            {data.progress.completed}/
            {data.progress.total} completed
          </p>
        </div>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${data.progress.overall}%`,
          }}
        />
      </div>

      <div className="space-y-4">
        {data.items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border bg-muted/20 p-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">
                      {item.skill}
                    </h3>

                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium">
                      {item.priority}
                    </span>

                    {item.completed && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.reason}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-semibold">
                  {item.progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${item.progress}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {item.focus
                    .slice(0, 3)
                    .map((focus) => (
                      <span
                        key={focus}
                        className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        {focus}
                      </span>
                    ))}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={
                      updating === item.id ||
                      item.progress <= 0
                    }
                    onClick={() =>
                      updateProgress(
                        item,
                        item.progress - 10
                      )
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                    aria-label={`Decrease ${item.skill} progress`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={
                      updating === item.id ||
                      item.progress >= 100
                    }
                    onClick={() =>
                      updateProgress(
                        item,
                        item.progress + 10
                      )
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                    aria-label={`Increase ${item.skill} progress`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}