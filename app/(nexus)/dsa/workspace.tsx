"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Code2, Plus, Search, Target, Trash2, X } from "lucide-react";
import { DSA_DIFFICULTIES, DSA_TOPICS, type DsaDifficulty, type DsaTopic } from "@/lib/dsa-validation";

type DsaEntry = { id: string; topic: DsaTopic; problem: string; problemUrl: string | null; difficulty: DsaDifficulty; isSolved: boolean; attempts: number; accuracy: number; notes: string | null; solvedAt: string | null; updatedAt: string };
type Stats = { total: number; solved: number; averageAccuracy: number | null; totalAttempts: number; practiceDaysLast30: number; topicProgress: Record<string, { total: number; solved: number }>; weakTopics: { topic: string; accuracy: number; solved: number }[]; difficultyDistribution: Record<string, number> };
type FormData = { topic: DsaTopic; problem: string; problemUrl: string; difficulty: DsaDifficulty; isSolved: boolean; attempts: number; accuracy: number; notes: string };
const EMPTY_FORM: FormData = { topic: "Arrays", problem: "", problemUrl: "", difficulty: "MEDIUM", isSolved: false, attempts: 0, accuracy: 0, notes: "" };
const labels: Record<DsaDifficulty, string> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export default function DsaWorkspace() {
  const [entries, setEntries] = useState<DsaEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [topic, setTopic] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (topic !== "ALL") params.set("topic", topic);
    if (difficulty !== "ALL") params.set("difficulty", difficulty);
    return params.toString();
  }, [topic, difficulty]);
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/dsa${query ? `?${query}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load DSA tracker.");
      setEntries(result.entries); setStats(result.stats);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load DSA tracker."); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { const timer = window.setTimeout(() => { void refresh(); }, 0); return () => window.clearTimeout(timer); }, [refresh]);

  function startEdit(entry: DsaEntry) {
    setEditing(entry.id); setShowForm(true); setNotice("");
    setForm({ topic: entry.topic, problem: entry.problem, problemUrl: entry.problemUrl ?? "", difficulty: entry.difficulty, isSolved: entry.isSolved, attempts: entry.attempts, accuracy: entry.accuracy, notes: entry.notes ?? "" });
  }
  function resetForm() { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(editing ? `/api/dsa/${editing}` : "/api/dsa", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, problemUrl: form.problemUrl || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save problem.");
      resetForm(); setNotice(editing ? "Problem updated." : "Problem added."); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save problem."); }
    finally { setSaving(false); }
  }

  async function toggleSolved(entry: DsaEntry) {
    try {
      const response = await fetch(`/api/dsa/${entry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isSolved: !entry.isSolved }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to update solved status.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update problem."); }
  }
  async function remove(entry: DsaEntry) {
    if (!window.confirm(`Delete “${entry.problem}” from your tracker?`)) return;
    try {
      const response = await fetch(`/api/dsa/${entry.id}`, { method: "DELETE" });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to delete problem.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete problem."); }
  }

  const visibleEntries = entries.filter((entry) => !search.trim() || `${entry.problem} ${entry.topic}`.toLowerCase().includes(search.trim().toLowerCase()));
  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const statCards = [
    { label: "Solved", value: stats?.solved ?? 0 },
    { label: "Problems tracked", value: stats?.total ?? 0 },
    { label: "Self-reported accuracy", value: stats?.averageAccuracy === null || stats?.averageAccuracy === undefined ? "—" : `${stats.averageAccuracy}%` },
    { label: "Practice days · 30 days", value: stats?.practiceDaysLast30 ?? 0 },
  ];

  return <main className="mx-auto max-w-7xl p-5 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">PRACTICE TRACKER</p><h1 className="mt-1 text-3xl font-bold tracking-tight">DSA</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Track your own problem links, attempts, and results. NEXUS doesn’t copy or provide external problem statements.</p></div><button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add problem</button></div>
    {error && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">{error}</p>}{notice && <p role="status" className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">{notice}</p>}
    <section aria-label="DSA statistics" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{statCards.map((item) => <div key={item.label} className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-bold">{item.value}</p></div>)}</section>
    {stats && stats.total > 0 && <section className="mt-4 grid gap-4 lg:grid-cols-3"><div className="rounded-xl border bg-card p-4 lg:col-span-2"><h2 className="font-semibold">Topic progress</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{DSA_TOPICS.map((item) => { const value = stats.topicProgress[item]; const percent = value.total ? Math.round(value.solved / value.total * 100) : 0; return <div key={item}><div className="flex justify-between text-xs"><span>{item}</span><span>{value.solved}/{value.total}</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} /></div></div>; })}</div></div><div className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Difficulty & focus</h2><p className="mt-3 text-sm text-muted-foreground">Easy {stats.difficultyDistribution.EASY} · Medium {stats.difficultyDistribution.MEDIUM} · Hard {stats.difficultyDistribution.HARD}</p><h3 className="mt-4 text-sm font-medium">Weak topics</h3>{stats.weakTopics.length ? <ul className="mt-2 space-y-2 text-sm">{stats.weakTopics.map((item) => <li key={item.topic} className="flex justify-between"><span>{item.topic}</span><span className="text-muted-foreground">{item.accuracy}%</span></li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">Weak topics appear after at least two solved problems in a topic average below 70%.</p>}</div></section>}
    {showForm && <section className="mt-6 rounded-2xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit problem" : "Track a problem"}</h2><button type="button" aria-label="Close form" onClick={resetForm}><X className="h-5 w-5" /></button></div><form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Problem title *<input required maxLength={200} className={inputClass} value={form.problem} onChange={(event) => setForm({ ...form, problem: event.target.value })} /></label><label className="space-y-1 text-sm">Topic<select className={inputClass} value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value as DsaTopic })}>{DSA_TOPICS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="space-y-1 text-sm">Link<input type="url" className={inputClass} value={form.problemUrl} onChange={(event) => setForm({ ...form, problemUrl: event.target.value })} /></label><label className="space-y-1 text-sm">Difficulty<select className={inputClass} value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as DsaDifficulty })}>{DSA_DIFFICULTIES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label><label className="space-y-1 text-sm">Attempts<input type="number" min={0} max={10000} className={inputClass} value={form.attempts} onChange={(event) => setForm({ ...form, attempts: Number(event.target.value) })} /></label><label className="space-y-1 text-sm">Accuracy (%)<input type="number" min={0} max={100} className={inputClass} value={form.accuracy} onChange={(event) => setForm({ ...form, accuracy: Number(event.target.value) })} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isSolved} onChange={(event) => setForm({ ...form, isSolved: event.target.checked })} />Solved</label><label className="space-y-1 text-sm sm:col-span-2">Notes<textarea rows={3} maxLength={5000} className={inputClass} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label><div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : editing ? "Save changes" : "Add to tracker"}</button><button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div></form></section>}
    <section className="mt-6 rounded-2xl border bg-card"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search problems</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search problems or topics" /></label><label><span className="sr-only">Filter topic</span><select className={inputClass} value={topic} onChange={(event) => setTopic(event.target.value)}><option value="ALL">All topics</option>{DSA_TOPICS.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="sr-only">Filter difficulty</span><select className={inputClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="ALL">All difficulties</option>{DSA_DIFFICULTIES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label></div>
      {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading problems…</p> : visibleEntries.length === 0 ? <div className="p-10 text-center"><Code2 className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{stats?.total ? "No matching problems" : "Nothing tracked yet"}</h2><p className="mt-1 text-sm text-muted-foreground">Add problem titles or links you choose to keep your practice history.</p></div> : <div className="divide-y">{visibleEntries.map((entry) => <article key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{entry.problem}</h2><span className="rounded-full border px-2 py-1 text-[11px]">{labels[entry.difficulty]}</span><span className="rounded-full border px-2 py-1 text-[11px]">{entry.topic}</span></div><p className="mt-1 text-xs text-muted-foreground">{entry.attempts} attempts · {entry.accuracy}% self-reported accuracy{entry.solvedAt ? ` · Solved ${new Date(entry.solvedAt).toLocaleDateString()}` : ""}</p>{entry.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{entry.notes}</p>}{entry.problemUrl && <a className="mt-2 inline-block text-xs text-primary underline" href={entry.problemUrl} rel="noreferrer" target="_blank">Open problem link</a>}</div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => void toggleSolved(entry)} className={`rounded-lg border px-3 py-2 text-xs ${entry.isSolved ? "bg-green-500/10" : ""}`}><Target className="mr-1 inline h-3.5 w-3.5" />{entry.isSolved ? "Solved" : "Mark solved"}</button><button type="button" onClick={() => startEdit(entry)} className="rounded-lg border px-3 py-2 text-xs">Edit</button><button type="button" aria-label={`Delete ${entry.problem}`} onClick={() => void remove(entry)} className="rounded-lg border p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>}
    </section>
    <p className="mt-4 text-xs text-muted-foreground">Accuracy is entered by you; it is not independently evaluated. Once you have solved problems, their mean accuracy contributes to your career readiness signal. <Link href="/career" className="underline">View career readiness</Link></p>
  </main>;
}
