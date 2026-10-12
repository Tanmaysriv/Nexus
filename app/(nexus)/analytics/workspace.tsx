"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, BriefcaseBusiness, CheckCircle2, Code2, LoaderCircle, MessageSquareText, TrendingUp } from "lucide-react";

type Data = {
  summary: {
    interviewEvaluations: number; averageInterviewScore: number | null; dsaSolved: number; dsaTracked: number;
    roadmapCompleted: number; roadmapTotal: number; applications: number; interviewsScheduled: number; skillAnalyses: number;
  };
  timeline: { month: string; interviewScore: number | null; interviewEvaluations: number; dsaSolved: number; applications: number; skillAnalyses: number }[];
  topics: { topic: string; total: number; solved: number }[];
  applicationsByStatus: Record<string, number>;
  integrations: { githubConnected: boolean };
  availability: { readinessHistory: boolean; githubActivityHistory: boolean; note: string };
};

const monthLabel = (value: string) => new Date(`${value}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });

export default function AnalyticsWorkspace() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/analytics", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load analytics.");
        if (active) setData(result as Data);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load analytics."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <main className="mx-auto max-w-6xl p-6" aria-live="polite"><LoaderCircle className="h-5 w-5 animate-spin" aria-label="Loading analytics" /></main>;
  if (error) return <main className="mx-auto max-w-6xl p-6"><p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm">{error}</p><button className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={() => location.reload()}>Try again</button></main>;
  if (!data) return null;

  const cards = [
    { title: "Interview performance", value: data.summary.averageInterviewScore === null ? "—" : `${data.summary.averageInterviewScore}/100`, detail: `${data.summary.interviewEvaluations} evaluated answers`, icon: MessageSquareText, href: "/interview" },
    { title: "DSA practice", value: `${data.summary.dsaSolved}`, detail: `solved of ${data.summary.dsaTracked} tracked`, icon: Code2, href: "/dsa" },
    { title: "Roadmap", value: `${data.summary.roadmapCompleted}/${data.summary.roadmapTotal}`, detail: "items completed", icon: CheckCircle2, href: "/career" },
    { title: "Applications", value: `${data.summary.applications}`, detail: `${data.summary.interviewsScheduled} interviews scheduled`, icon: BriefcaseBusiness, href: "/applications" },
  ];
  const peak = Math.max(1, ...data.timeline.flatMap((item) => [item.dsaSolved, item.applications, item.interviewEvaluations, item.skillAnalyses]));
  const populated = data.summary.interviewEvaluations + data.summary.dsaTracked + data.summary.roadmapTotal + data.summary.applications + data.summary.skillAnalyses > 0;

  return <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
    <header className="mb-7"><p className="text-sm font-medium text-primary">Career intelligence</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Analytics</h1><p className="mt-2 text-sm text-muted-foreground">Progress calculated from your saved NEXUS activity.</p></header>
    {!populated && <section className="mb-6 rounded-2xl border bg-card p-6"><h2 className="font-semibold">Your analytics will grow with your activity</h2><p className="mt-1 text-sm text-muted-foreground">Practice an interview, track a DSA problem, create a roadmap, or add an application to start seeing your progress.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/career" className="rounded-lg border px-3 py-2 text-sm">Open career plan</Link><Link href="/applications" className="rounded-lg border px-3 py-2 text-sm">Track an application</Link></div></section>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Career progress summary">
      {cards.map((card) => { const Icon = card.icon; return <Link key={card.title} href={card.href} className="rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/30"><Icon className="h-5 w-5 text-primary"/><p className="mt-4 text-sm text-muted-foreground">{card.title}</p><p className="mt-1 text-2xl font-semibold">{card.value}</p><p className="mt-1 text-xs text-muted-foreground">{card.detail}</p></Link>; })}
    </section>
    <section className="mt-6 rounded-2xl border bg-card p-5" aria-labelledby="activity-title">
      <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/><h2 id="activity-title" className="text-lg font-semibold">Recorded activity by month</h2></div>
      {data.timeline.length ? <div className="mt-5 space-y-4">{data.timeline.map((item) => <div key={item.month} className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center"><p className="text-xs text-muted-foreground">{monthLabel(item.month)}</p><div className="space-y-1.5" aria-label={`${monthLabel(item.month)} activity`}>
        {[{ label: "DSA solved", value: item.dsaSolved }, { label: "Applications", value: item.applications }, { label: "Interview evaluations", value: item.interviewEvaluations }, { label: "Skill analyses", value: item.skillAnalyses }].map((metric) => <div key={metric.label} className="flex items-center gap-2"><span className="w-32 shrink-0 text-[11px] text-muted-foreground">{metric.label}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${metric.value ? Math.max(5, metric.value / peak * 100) : 0}%` }} /></div><span className="w-6 text-right text-[11px] tabular-nums">{metric.value}</span></div>)}
        {item.interviewScore !== null && <p className="pl-[8.5rem] text-[11px] text-muted-foreground">Average evaluated answer score: {item.interviewScore}/100</p>}
      </div></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No timestamped activity is available yet.</p>}
    </section>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold">DSA topic progress</h2></div>{data.topics.length ? <ul className="mt-4 space-y-3">{data.topics.map((topic) => <li key={topic.topic}><div className="flex justify-between text-sm"><span>{topic.topic}</span><span className="text-muted-foreground">{topic.solved}/{topic.total}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${topic.total ? topic.solved / topic.total * 100 : 0}%` }}/></div></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No DSA problems are tracked yet. <Link href="/dsa" className="underline">Add a problem</Link>.</p>}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">Application pipeline</h2>{Object.keys(data.applicationsByStatus).length ? <ul className="mt-4 grid grid-cols-2 gap-3">{Object.entries(data.applicationsByStatus).map(([status, count]) => <li key={status} className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{status.replaceAll("_", " ")}</p><p className="mt-1 text-xl font-semibold">{count}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No applications tracked. <Link href="/applications" className="underline">Add your first role</Link>.</p>}<p className="mt-4 text-xs text-muted-foreground">GitHub {data.integrations.githubConnected ? "is connected" : "is not connected"}. Repository activity history is not retained for analytics.</p></section>
    </div>
    <p className="mt-5 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">{data.availability.note}</p>
  </main>;
}

