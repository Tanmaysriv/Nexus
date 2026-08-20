import { getGitHubStats } from "@/lib/github";
import GitHubOverview from "@/components/dashboard/github-overview";

import {
  Activity,
  ArrowUpRight,
  Brain,
  Code2,
  GitBranch,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const skills = [
  {
    name: "Full Stack Development",
    score: 86,
  },
  {
    name: "React / Next.js",
    score: 88,
  },
  {
    name: "AI / ML",
    score: 72,
  },
  {
    name: "DevOps",
    score: 64,
  },
  {
    name: "System Design",
    score: 48,
  },
];

export default async function DashboardPage() {
  const github = await getGitHubStats();

  const stats = [
    {
      title: "GitHub Activity",
      value: "87%",
      description: "Strong activity this month",
      icon: GitBranch,
      trend: "+12%",
    },
    {
      title: "GitHub Repositories",
      value: github.repositoryCount.toString(),
      description: "Public repositories",
      icon: GitBranch,
      trend: "Live",
    },
    {
      title: "Coding Problems",
      value: "437",
      description: "Across multiple platforms",
      icon: Code2,
      trend: "+28",
    },
    {
      title: "Career Readiness",
      value: "74%",
      description: "Based on your current skills",
      icon: Brain,
      trend: "+8%",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Developer Command Center
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Good afternoon, Tanmay 👋
          </h1>

          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Here is  what is happening with your development journey.
          </p>
        </header>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="
                  group relative overflow-hidden rounded-2xl
                  border border-border/60
                  bg-card/70
                  p-5
                  shadow-sm
                  backdrop-blur-xl
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-primary/30
                  hover:shadow-lg
                "
              >
                {/* Gradient glow */}
                <div
                  className="
                    pointer-events-none absolute
                    -right-10 -top-10
                    h-24 w-24
                    rounded-full
                    bg-primary/10
                    blur-2xl
                    transition-all duration-300
                    group-hover:bg-primary/20
                  "
                />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>

                    <div className="rounded-lg border border-border/60 bg-background/60 p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold tracking-tight">
                        {stat.value}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Main grid */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

          {/* NEXUS AI */}
          <div
            className="
              relative overflow-hidden rounded-2xl
              border border-primary/20
              bg-gradient-to-br
              from-primary/10
              via-card
              to-card
              p-6
              shadow-sm
            "
          >
            <div
              className="
                pointer-events-none absolute
                -right-20 -top-20
                h-48 w-48
                rounded-full
                bg-primary/15
                blur-3xl
              "
            />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      NEXUS AI Insight
                    </h2>

                    <p className="text-xs text-muted-foreground">
                      Personalized developer analysis
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  AI Analysis
                </span>
              </div>

              <div className="mt-8">
                <p className="text-sm text-muted-foreground">
                  Your biggest current gap is
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  System Design
                </h3>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Based on your current technology profile, focusing on
                  backend architecture, scalability, caching, databases and
                  distributed systems would improve your Software Engineer
                  readiness.
                </p>
              </div>

              <button
                className="
                  mt-6 inline-flex items-center gap-2
                  rounded-xl bg-primary
                  px-4 py-2.5
                  text-sm font-medium
                  text-primary-foreground
                  transition-all duration-200
                  hover:scale-[1.02]
                  hover:shadow-lg
                "
              >
                View learning plan
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Career Readiness */}
          <div
            className="
              rounded-2xl
              border border-border/60
              bg-card/70
              p-6
              shadow-sm
              backdrop-blur-xl
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Career Readiness
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Your current skill profile
                </p>
              </div>

              <Target className="h-5 w-5 text-primary" />
            </div>

            <div className="mt-6 flex items-center gap-5">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-primary/20">
                <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-primary border-r-primary" />

                <div className="text-center">
                  <p className="text-2xl font-bold">
                    74%
                  </p>

                  <p className="text-[10px] text-muted-foreground">
                    READY
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {skills.slice(0, 3).map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground">
                        {skill.score}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
                {/* GitHub Intelligence */}
        <section className="mt-6">
          <GitHubOverview data={github} />
        </section>

        {/* Skill Matrix */}
        <section
          className="
            mt-6 rounded-2xl
            border border-border/60
            bg-card/70
            p-6
            shadow-sm
            backdrop-blur-xl
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Skill Matrix
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Current technical strength across key areas
              </p>
            </div>

            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {skill.name}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {skill.score}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-700"
                    style={{
                      width: `${skill.score}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}