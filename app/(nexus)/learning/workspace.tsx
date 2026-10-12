"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, GraduationCap, LoaderCircle } from "lucide-react";
import { LEARNING_STATUSES, type LearningStatus } from "@/lib/learning-validation";

type RoadmapItem = { skill: string; priority: string; reason: string; focus: string[] };
type RoadmapResponse = { targetRole: string | null; roadmap: { items: RoadmapItem[] } };
type LearningProgress = { skill: string; status: LearningStatus; resourceUrls: string[]; practiceNotes: string | null; assessmentNotes: string | null; updatedAt: string };
type Draft = { status: LearningStatus; resourceText: string; practiceNotes: string; assessmentNotes: string };
const STATUS_LABELS: Record<LearningStatus, string> = { NOT_STARTED: "Not started", IN_PROGRESS: "In progress", COMPLETED: "Completed" };

export default function LearningWorkspace() {
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingSkill, setSavingSkill] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roadmapResponse, progressResponse] = await Promise.all([
        fetch("/api/career/roadmap", { cache: "no-store" }),
        fetch("/api/learning", { cache: "no-store" }),
      ]);
      const [roadmapBody, progressBody] = await Promise.all([roadmapResponse.json(), progressResponse.json()]);
      if (!roadmapResponse.ok) throw new Error(roadmapBody.error ?? "Unable to load your roadmap.");
      if (!progressResponse.ok) throw new Error(progressBody.error ?? "Unable to load learning progress.");
      setRoadmap(roadmapBody);
      const saved = Object.fromEntries((progressBody.progress as LearningProgress[]).map((item) => [item.skill.toLowerCase(), item]));
      setProgress(saved);
      setDrafts(Object.fromEntries((roadmapBody.roadmap.items as RoadmapItem[]).map((item) => {
        const existing = saved[item.skill.toLowerCase()];
        return [item.skill.toLowerCase(), {
          status: existing?.status ?? "NOT_STARTED",
          resourceText: existing?.resourceUrls.join("\n") ?? "",
          practiceNotes: existing?.practiceNotes ?? "",
          assessmentNotes: existing?.assessmentNotes ?? "",
        } satisfies Draft];
      })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load learning hub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateDraft(skill: string, change: Partial<Draft>) {
    const key = skill.toLowerCase();
    setDrafts((current) => ({ ...current, [key]: { ...current[key], ...change } }));
  }

  async function save(skill: string) {
    const draft = drafts[skill.toLowerCase()];
    if (!draft) return;
    setSavingSkill(skill);
    setError("");
    setNotice("");
    try {
      const resourceUrls = draft.resourceText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
      const response = await fetch("/api/learning", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, status: draft.status, resourceUrls, practiceNotes: draft.practiceNotes, assessmentNotes: draft.assessmentNotes }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save learning progress.");
      setProgress((current) => ({ ...current, [skill.toLowerCase()]: result.progress }));
      setNotice(`${skill} progress saved.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save learning progress.");
    } finally {
      setSavingSkill(null);
    }
  }

  const items = roadmap?.roadmap.items ?? [];
  const completed = items.filter((item) => (progress[item.skill.toLowerCase()]?.status ?? "NOT_STARTED") === "COMPLETED").length;
  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return <main className="mx-auto max-w-7xl p-5 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">LEARNING HUB</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Learn from your skill gaps</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Learning paths come from your current career roadmap and target role{roadmap?.targetRole ? `: ${roadmap.targetRole}` : ""}.</p></div><Link href="/career" className="rounded-lg border px-4 py-2.5 text-sm font-medium">Open career roadmap</Link></div>
    {error && <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">{notice}</p>}
    {!loading && items.length > 0 && <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Roadmap skills</p><p className="mt-2 text-2xl font-bold">{items.length}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Completed paths</p><p className="mt-2 text-2xl font-bold">{completed}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Progress</p><p className="mt-2 text-2xl font-bold">{Math.round(completed / items.length * 100)}%</p></div></div>}
    {loading ? <div className="flex items-center justify-center gap-2 p-14 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading your learning plan…</div> : items.length === 0 ? <section className="mt-6 rounded-2xl border bg-card p-10 text-center"><GraduationCap className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-3 font-semibold">No roadmap skills to learn yet</h2><p className="mt-2 text-sm text-muted-foreground">Analyze a job description with your resume to find evidence-based skill gaps and create a roadmap.</p><Link href="/resume" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Review resume and skills</Link></section> : <div className="mt-6 space-y-4">
      {items.map((item) => {
        const key = item.skill.toLowerCase();
        const draft = drafts[key] ?? { status: "NOT_STARTED" as LearningStatus, resourceText: "", practiceNotes: "", assessmentNotes: "" };
        const saved = progress[key];
        return <article key={item.skill} className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">{item.skill}</h2><span className="rounded-full border px-2 py-1 text-[11px]">{item.priority}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.reason}</p></div><label className="text-xs text-muted-foreground">Progress<select aria-label={`${item.skill} learning status`} className="mt-1 block rounded-lg border bg-background px-3 py-2 text-sm text-foreground" value={draft.status} onChange={(event) => updateDraft(item.skill, { status: event.target.value as LearningStatus })}>{LEARNING_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><section><h3 className="text-sm font-medium">Learning path</h3>{item.focus.length ? <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">{item.focus.map((focus) => <li key={focus}>{focus}</li>)}</ol> : <p className="mt-2 text-sm text-muted-foreground">Review the fundamentals, then apply {item.skill} in a practical task.</p>}<p className="mt-3 text-sm"><strong>Practice:</strong> Build or adapt a small project that demonstrates {item.skill}. Keep the result and your contribution verifiable.</p></section>
            <section className="space-y-3"><label className="block text-sm font-medium">Your learning resources <span className="font-normal text-muted-foreground">(up to 5 URLs, one per line)</span><textarea rows={3} maxLength={10_300} className={`${inputClass} mt-1`} placeholder="Paste links you have reviewed" value={draft.resourceText} onChange={(event) => updateDraft(item.skill, { resourceText: event.target.value })} /></label><p className="text-xs text-muted-foreground">Links are user-provided and aren’t verified by NEXUS.</p><label className="block text-sm font-medium">Practice notes<textarea rows={2} maxLength={5000} className={`${inputClass} mt-1`} value={draft.practiceNotes} onChange={(event) => updateDraft(item.skill, { practiceNotes: event.target.value })} /></label><label className="block text-sm font-medium">Self-assessment<textarea rows={2} maxLength={5000} placeholder="What can you now explain or demonstrate?" className={`${inputClass} mt-1`} value={draft.assessmentNotes} onChange={(event) => updateDraft(item.skill, { assessmentNotes: event.target.value })} /></label></section>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4"><p className="text-xs text-muted-foreground">{saved ? `Last saved ${new Date(saved.updatedAt ?? "").toLocaleDateString()}` : "Not saved yet"}</p><button type="button" disabled={savingSkill === item.skill} onClick={() => void save(item.skill)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{savingSkill === item.skill ? "Saving…" : "Save learning progress"}</button></div>
        </article>;
      })}
    </div>}
  </main>;
}
