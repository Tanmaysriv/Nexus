import {
  Activity,
  Flame,
  CalendarDays,
  Zap,
} from "lucide-react";

import type { GitHubActivity } from "@/lib/github";

type Props = {
  activity: GitHubActivity;
};

export default function GitHubActivityCard({
  activity,
}: Props) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />

            <h2 className="font-semibold">
              GitHub Activity
            </h2>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Public development activity over the last 30 days
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <ActivityMetric
          icon={Zap}
          label="Events"
          value={activity.totalEvents}
        />

        <ActivityMetric
          icon={CalendarDays}
          label="Active Days"
          value={activity.activeDays}
        />

        <ActivityMetric
          icon={Flame}
          label="Longest Streak"
          value={activity.longestStreak}
        />
      </div>

      {/* Activity graph */}
      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            Activity Timeline
          </span>

          <span className="text-xs text-muted-foreground">
            Last 30 days
          </span>
        </div>

        <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-15 md:grid-cols-30">
          {activity.dailyActivity.map((day) => {
            const intensity =
              day.count === 0
                ? "bg-muted"
                : day.count === 1
                  ? "bg-primary/20"
                  : day.count <= 3
                    ? "bg-primary/40"
                    : day.count <= 6
                      ? "bg-primary/70"
                      : "bg-primary";

            return (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} events`}
                className={`aspect-square rounded-sm ${intensity} transition-transform duration-200 hover:scale-125`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ActivityMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-3">
      <Icon className="h-4 w-4 text-primary" />

      <p className="mt-3 text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  );
}