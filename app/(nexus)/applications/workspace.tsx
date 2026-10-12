"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, CircleDollarSign, Plus, Search, Trash2, X } from "lucide-react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-validation";

type Application = {
  id: string;
  company: string;
  role: string;
  jobUrl: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  interviewAt: string | null;
  notes: string | null;
  updatedAt: string;
};

type Stats = { total: number; active: number; interviews: number; offers: number; upcomingInterviews: number; byStatus: Record<string, number> };
type JobMatch = {
  readiness: { score: number | null; label: string };
  skillMatch: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  resumeKeywordGaps: string[];
  relevantProjects: { repository: string; relevantSkills: string[] }[];
  resumeOptimization: {
    compatibilityScore: number | null;
    methodology: string;
    keywordCoverage: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    requiredSkills: string[];
    identifiedSkills: { skill: string; source: string; excerpt: string }[];
    suggestions: string[];
  } | null;
  suggestedPreparation: { skill: string; action: string }[];
  evidenceBySkill: { skill: string; evidence: { source: string; detail: string }[] }[];
};
type SkillGapSkill = { skill: string; gap: string; priority: string; recommendedLearning: string; evidence: { source: string; detail: string }[] };
type JobIntelligence = {
  match: JobMatch;
  skillGap: { skills: SkillGapSkill[] } | null;
  skillGapNotice: string;
  roadmapSkills: string[];
};
type FormValues = Omit<Application, "id" | "updatedAt">;
const EMPTY_FORM: FormValues = { company: "", role: "", jobUrl: "", location: "", salary: "", description: "", status: "SAVED", appliedAt: "", interviewAt: "", notes: "" };
const STATUS_LABELS: Record<ApplicationStatus, string> = { SAVED: "Saved", APPLIED: "Applied", ASSESSMENT: "Assessment", INTERVIEW: "Interview", OFFER: "Offer", REJECTED: "Rejected", WITHDRAWN: "Withdrawn" };

export default function ApplicationWorkspace() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [intelligence, setIntelligence] = useState<Record<string, JobIntelligence>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [statusFilter, search]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/applications${query ? `?${query}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load applications.");
      setApplications(result.applications);
      setStats(result.stats);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  function startEdit(application: Application) {
    setEditing(application.id);
    setForm({
      company: application.company, role: application.role, jobUrl: application.jobUrl ?? "",
      location: application.location ?? "", salary: application.salary ?? "", description: application.description ?? "",
      status: application.status, appliedAt: application.appliedAt?.slice(0, 10) ?? "",
      interviewAt: application.interviewAt?.slice(0, 16) ?? "", notes: application.notes ?? "",
    });
    setShowForm(true);
    setNotice("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  }

  async function saveApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const endpoint = editing ? `/api/applications/${editing}` : "/api/applications";
      const response = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, appliedAt: form.appliedAt || null, interviewAt: form.interviewAt || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save application.");
      resetForm();
      setNotice(editing ? "Application updated." : "Application added.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save application.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(application: Application, status: ApplicationStatus) {
    setError("");
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update status.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update status.");
    }
  }

  async function deleteApplication(application: Application) {
    if (!window.confirm(`Delete the ${application.role} application at ${application.company}?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete application.");
      setNotice("Application deleted.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete application.");
    }
  }

  async function analyzeForJob(application: Application) {
    if (!application.description?.trim()) {
      setError("Add this job’s description before generating a preparation plan.");
      return;
    }
    setAnalyzing(application.id);
    setError("");
    setNotice("");
    try {
      const [matchResponse, gapResponse] = await Promise.all([
        fetch("/api/career/job-match", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRole: application.role, jobDescription: application.description }),
        }),
        fetch("/api/skill-gap", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRole: application.role, jobDescription: application.description }),
        }),
      ]);
      const matchBody = await matchResponse.json();
      if (!matchResponse.ok) throw new Error(matchBody.error ?? "Unable to match this job.");
      const gapBody = await gapResponse.json();
      const roadmapResponse = await fetch("/api/career/roadmap", { cache: "no-store" });
      const roadmapBody = await roadmapResponse.json();
      const rawSkills = gapBody.analysis?.results && typeof gapBody.analysis.results === "object"
        ? (gapBody.analysis.results as { skills?: SkillGapSkill[] }).skills
        : undefined;
      const validSkills = Array.isArray(rawSkills) ? rawSkills.filter((item) => item && typeof item.skill === "string") : null;
      const roadmapItems = Array.isArray(roadmapBody.roadmap?.items) ? roadmapBody.roadmap.items : [];
      setIntelligence((current) => ({
        ...current,
        [application.id]: {
          match: matchBody as JobMatch,
          skillGap: gapResponse.ok && validSkills ? { skills: validSkills } : null,
          skillGapNotice: gapResponse.ok ? "" : gapBody.error ?? "Resume based skill-gap analysis is unavailable.",
          roadmapSkills: roadmapItems.map((item: { skill?: string }) => item.skill).filter((skill: unknown): skill is string => typeof skill === "string"),
        },
      }));
      setNotice("Job analysis is ready. Skill-gap evidence is saved to your account when a resume is available.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to analyze this job.");
    } finally {
      setAnalyzing(null);
    }
  }

  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const statCards = [
    { label: "Tracked", value: stats?.total, icon: BriefcaseBusiness },
    { label: "Active", value: stats?.active, icon: CircleDollarSign },
    { label: "Interviews", value: stats?.interviews, icon: CalendarClock },
    { label: "Offers", value: stats?.offers, icon: BriefcaseBusiness },
  ];

  return (
    <main className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">CAREER TRACKER</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Applications</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Keep your job search organized and see what needs follow-up.</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add application
        </button>
      </div>

      {notice && <p role="status" className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">{error}</p>}

      <section aria-label="Application statistics" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4" /></div>
          <p className="mt-3 text-2xl font-bold">{value ?? "—"}</p>
        </div>)}
      </section>
      {!!stats?.upcomingInterviews && <p className="mt-3 text-sm text-muted-foreground">{stats.upcomingInterviews} upcoming interview{stats.upcomingInterviews === 1 ? "" : "s"} scheduled.</p>}

      {showForm && <section className="mt-6 rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Edit application" : "Add an application"}</h2><button type="button" aria-label="Close form" onClick={resetForm} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button></div>
        <form onSubmit={saveApplication} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">Company *<input required maxLength={160} className={inputClass} value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label>
          <label className="space-y-1 text-sm">Role *<input required maxLength={120} className={inputClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
          <label className="space-y-1 text-sm">Job URL<input type="url" className={inputClass} value={form.jobUrl ?? ""} onChange={(event) => setForm({ ...form, jobUrl: event.target.value })} /></label>
          <label className="space-y-1 text-sm">Location<input maxLength={160} className={inputClass} value={form.location ?? ""} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
          <label className="space-y-1 text-sm">Salary<input maxLength={120} placeholder="e.g. $120k–$150k" className={inputClass} value={form.salary ?? ""} onChange={(event) => setForm({ ...form, salary: event.target.value })} /></label>
          <label className="space-y-1 text-sm">Status<select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ApplicationStatus })}>{APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
          <label className="space-y-1 text-sm">Applied date<input type="date" className={inputClass} value={form.appliedAt ?? ""} onChange={(event) => setForm({ ...form, appliedAt: event.target.value })} /></label>
          <label className="space-y-1 text-sm">Interview date<input type="datetime-local" className={inputClass} value={form.interviewAt ?? ""} onChange={(event) => setForm({ ...form, interviewAt: event.target.value })} /></label>
          <label className="space-y-1 text-sm sm:col-span-2">Job description<textarea rows={4} maxLength={20_000} className={inputClass} value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="space-y-1 text-sm sm:col-span-2">Notes<textarea rows={3} maxLength={10_000} className={inputClass} value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : editing ? "Save changes" : "Create application"}</button><button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
        </form>
      </section>}

      <section className="mt-6 rounded-2xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <label className="relative flex-1"><span className="sr-only">Search applications</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, role, or location" className={`${inputClass} pl-9`} /></label>
          <label><span className="sr-only">Filter by status</span><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option>{APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
        </div>
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading applications…</p> : applications.length === 0 ? <div className="p-10 text-center"><BriefcaseBusiness className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{stats?.total ? "No matching applications" : "No applications yet"}</h2><p className="mt-1 text-sm text-muted-foreground">{stats?.total ? "Try another search or status filter." : "Add a role you are interested in to start tracking your search."}</p></div> : <div className="divide-y">
          {applications.map((application) => <article key={application.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{application.role}</h2><span className="rounded-full border px-2.5 py-1 text-xs">{STATUS_LABELS[application.status]}</span></div><p className="mt-1 text-sm text-muted-foreground">{application.company}{application.location ? ` · ${application.location}` : ""}{application.salary ? ` · ${application.salary}` : ""}</p>
              {application.jobUrl && <a href={application.jobUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-xs text-primary underline">View job posting</a>}
              {(application.appliedAt || application.interviewAt) && <p className="mt-2 text-xs text-muted-foreground">{application.appliedAt ? `Applied ${new Date(application.appliedAt).toLocaleDateString()}` : ""}{application.appliedAt && application.interviewAt ? " · " : ""}{application.interviewAt ? `Interview ${new Date(application.interviewAt).toLocaleString()}` : ""}</p>}
              {application.description && <details className="mt-3"><summary className="cursor-pointer text-xs font-medium text-primary">View job description</summary><p className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{application.description}</p></details>}
              {application.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{application.notes}</p>}
              <button type="button" disabled={!application.description || analyzing === application.id} onClick={() => void analyzeForJob(application)} className="mt-3 rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50">{analyzing === application.id ? "Analyzing…" : "Build job preparation plan"}</button>
              {!application.description && <p className="mt-1 text-xs text-muted-foreground">Add a job description to analyze skill fit and preparation needs.</p>}
              {intelligence[application.id] && <div className="mt-4 rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Preparation plan for {application.role}</h3><span className="text-xs text-muted-foreground">{intelligence[application.id].match.readiness.score === null ? "Readiness not assessed" : `Readiness ${intelligence[application.id].match.readiness.score}/100 · ${intelligence[application.id].match.readiness.label}`}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">Job skill match: {intelligence[application.id].match.skillMatch === null ? "Not available" : `${intelligence[application.id].match.skillMatch}%`} · Analysis uses your current resume, GitHub, and interview evidence.</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div><h4 className="text-sm font-medium">Skills to prepare</h4>{intelligence[application.id].match.suggestedPreparation.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{intelligence[application.id].match.suggestedPreparation.slice(0, 6).map((item) => <li key={item.skill}><strong className="text-foreground">{item.skill}:</strong> {item.action}{intelligence[application.id].roadmapSkills.some((skill) => skill.toLowerCase() === item.skill.toLowerCase()) ? " (also on your roadmap)" : ""}</li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">No missing skills were identified from the available evidence.</p>}</div>
                  <div><h4 className="text-sm font-medium">Resume keyword gaps</h4>{intelligence[application.id].match.resumeKeywordGaps.length ? <p className="mt-2 text-xs text-muted-foreground">{intelligence[application.id].match.resumeKeywordGaps.join(", ")}</p> : <p className="mt-2 text-xs text-muted-foreground">No supported keyword gaps were found, or resume evidence is unavailable.</p>}
                    <h4 className="mt-3 text-sm font-medium">Evidence found</h4><ul className="mt-2 space-y-1 text-xs text-muted-foreground">{intelligence[application.id].match.evidenceBySkill.filter((item) => item.evidence.length).slice(0, 5).map((item) => <li key={item.skill}><strong className="text-foreground">{item.skill}:</strong> {item.evidence.map((evidence) => evidence.source).join(", ")}</li>)}</ul>
                  </div>
                </div>
                {intelligence[application.id].match.resumeOptimization && <details className="mt-4 rounded-lg border bg-background p-3">
                  <summary className="cursor-pointer text-sm font-medium">Resume compatibility report</summary>
                  <p className="mt-2 text-xs text-muted-foreground">{intelligence[application.id].match.resumeOptimization!.methodology}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <p className="text-xs">Compatibility estimate: <strong>{intelligence[application.id].match.resumeOptimization!.compatibilityScore === null ? "Not available" : `${intelligence[application.id].match.resumeOptimization!.compatibilityScore}/100`}</strong></p>
                    <p className="text-xs">Keywords found: <strong>{intelligence[application.id].match.resumeOptimization!.matchedKeywords.length}</strong></p>
                    <p className="text-xs">Required skills: <strong>{intelligence[application.id].match.resumeOptimization!.requiredSkills.length}</strong></p>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div><h4 className="text-xs font-semibold">Required skills and resume evidence</h4><ul className="mt-1 space-y-1 text-xs text-muted-foreground">{intelligence[application.id].match.resumeOptimization!.requiredSkills.map((skill) => {
                      const evidence = intelligence[application.id].match.resumeOptimization!.identifiedSkills.find((item) => item.skill.toLowerCase() === skill.toLowerCase());
                      return <li key={skill}><strong className="text-foreground">{skill}:</strong> {evidence ? `Found in resume${evidence.excerpt ? ` — “${evidence.excerpt}”` : ""}` : "No resume evidence found"}</li>;
                    })}</ul></div>
                    <div><h4 className="text-xs font-semibold">Relevant repository evidence</h4>{intelligence[application.id].match.relevantProjects.length ? <ul className="mt-1 space-y-1 text-xs text-muted-foreground">{intelligence[application.id].match.relevantProjects.map((project) => <li key={project.repository}><strong className="text-foreground">{project.repository}:</strong> {project.relevantSkills.join(", ")}</li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">No matching repository evidence found.</p>}</div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2"><div><h4 className="text-xs font-semibold">Keywords found</h4><p className="mt-1 text-xs text-muted-foreground">{intelligence[application.id].match.resumeOptimization!.matchedKeywords.join(", ") || "None found"}</p></div><div><h4 className="text-xs font-semibold">Missing keywords</h4><p className="mt-1 text-xs text-muted-foreground">{intelligence[application.id].match.resumeOptimization!.missingKeywords.join(", ") || "None identified"}</p></div></div>
                  {!!intelligence[application.id].match.resumeOptimization!.suggestions.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{intelligence[application.id].match.resumeOptimization!.suggestions.slice(0, 5).map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul>}
                  <p className="mt-3 text-[11px] text-muted-foreground">This evidence-based estimate is not an official ATS score. Only add claims you can support with real experience.</p>
                </details>}
                {intelligence[application.id].skillGap ? <p className="mt-3 text-xs text-muted-foreground">Evidence based skill-gap analysis is saved in your Skill Gap history. <Link href="/resume" className="underline">Review resume and skills</Link></p> : <p className="mt-3 text-xs text-muted-foreground">Skill-gap analysis could not be saved: {intelligence[application.id].skillGapNotice} <Link href="/resume" className="underline">Review your resume</Link></p>}
                <div className="mt-3 flex flex-wrap gap-2"><Link href="/career" className="rounded-lg border px-3 py-2 text-xs">Open career roadmap</Link><Link href="/interview" className="rounded-lg border px-3 py-2 text-xs">Practice interview</Link></div>
              </div>}
            </div>
            <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor={`status-${application.id}`}>Update status for {application.company} {application.role}</label><select id={`status-${application.id}`} className="rounded-lg border bg-background px-2 py-2 text-xs" value={application.status} onChange={(event) => void updateStatus(application, event.target.value as ApplicationStatus)}>{APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select><button type="button" onClick={() => startEdit(application)} className="rounded-lg border px-3 py-2 text-xs">Edit</button><button type="button" aria-label={`Delete ${application.role} at ${application.company}`} onClick={() => void deleteApplication(application)} className="rounded-lg border p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></div>
          </article>)}
        </div>}
      </section>
    </main>
  );
}
