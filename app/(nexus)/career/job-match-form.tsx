"use client";

import { useState, type FormEvent } from "react";

type Match = {
  role: { name: string };
  skillMatch: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  jobDescriptionProvided: boolean;
  evidenceBySkill: { skill: string; evidence: { source: string; detail: string }[] }[];
  resumeKeywordGaps: string[];
  relevantProjects: { repository: string; relevantSkills: string[] }[];
  suggestedPreparation: { skill: string; action: string }[];
};

export default function JobMatchForm() {
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMatch(null);
    try {
      const response = await fetch("/api/career/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, jobDescription }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to match this job.");
      setMatch(result as Match);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to match this job.");
    } finally {
      setLoading(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm";
  return (
    <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm" aria-labelledby="job-match-title">
      <h2 id="job-match-title" className="text-xl font-semibold">Match a job description</h2>
      <p className="mt-1 text-sm text-muted-foreground">Requirements come from the description. Candidate evidence comes from your resume, analyzed repositories, and interview feedback.</p>
      <form className="mt-4 grid gap-4" onSubmit={analyze}>
        <label className="text-sm">Target role<input className={field} value={targetRole} onChange={(event) => setTargetRole(event.target.value)} maxLength={120} required /></label>
        <label className="text-sm">Job description<textarea className={`${field} min-h-36 resize-y`} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={20000} required /></label>
        <button className="w-fit rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={loading}>{loading ? "Analyzing…" : "Analyze job match"}</button>
      </form>
      {error && <p className="mt-4 text-sm text-red-500" role="alert">{error}</p>}
      {match && <div className="mt-6 space-y-5" aria-live="polite">
        <div><p className="font-medium">{match.role.name}: {match.skillMatch === null ? "No resume or GitHub skill evidence yet" : `${match.skillMatch}% of listed skills have resume or GitHub evidence`}</p><p className="mt-1 text-xs text-muted-foreground">This is evidence coverage, not a hiring prediction. Interview support is reported separately.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><h3 className="text-sm font-semibold">Requirements and evidence</h3><ul className="mt-2 space-y-2">{match.evidenceBySkill.map((item) => <li key={item.skill} className="rounded-lg border p-3 text-sm"><p className="font-medium">{item.skill} <span className="text-xs text-muted-foreground">required</span></p>{item.evidence.length ? item.evidence.map((evidence, index) => <p key={`${item.skill}-${evidence.source}-${index}`} className="mt-1 text-xs text-muted-foreground"><strong>{evidence.source}:</strong> {evidence.detail}</p>) : <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">No direct evidence found in available sources.</p>}</li>)}</ul></div>
          <div className="space-y-4"><div><h3 className="text-sm font-semibold">Relevant repositories</h3>{match.relevantProjects.length ? <ul className="mt-2 list-disc pl-5 text-sm">{match.relevantProjects.map((project) => <li key={project.repository}>{project.repository}: {project.relevantSkills.join(", ")}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No relevant repository technology evidence found.</p>}</div><div><h3 className="text-sm font-semibold">Resume keyword gaps</h3>{match.resumeKeywordGaps.length ? <p className="mt-2 text-sm text-muted-foreground">{match.resumeKeywordGaps.join(", ")}</p> : <p className="mt-2 text-sm text-muted-foreground">No resume uploaded, or no keyword gaps identified for the supported catalog.</p>}</div><div><h3 className="text-sm font-semibold">Preparation suggestions</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{match.suggestedPreparation.slice(0, 5).map((item) => <li key={item.skill}>{item.action}</li>)}</ul></div></div>
        </div>
      </div>}
    </section>
  );
}
