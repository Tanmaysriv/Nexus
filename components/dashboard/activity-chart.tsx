"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { day: "Mon", commits: 4 },
  { day: "Tue", commits: 7 },
  { day: "Wed", commits: 3 },
  { day: "Thu", commits: 9 },
  { day: "Fri", commits: 6 },
  { day: "Sat", commits: 11 },
  { day: "Sun", commits: 8 },
];

export default function ActivityChart() {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-6">
        <h2 className="font-semibold">
          GitHub Activity
        </h2>

        <p className="text-sm text-muted-foreground">
          Recent development activity
        </p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
            />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="commits"
              stroke="currentColor"
              fill="currentColor"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}