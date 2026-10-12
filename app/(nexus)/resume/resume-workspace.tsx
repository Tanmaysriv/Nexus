"use client";

import { useEffect, useState, type FormEvent } from "react";

type ResumeAnalysis = {
  compatibilityScore: number | null;
  methodology: string;
  keywordCoverage: number;
  sectionCoverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  requiredSkills: string[];
  identifiedSkills: { skill: string; source: string; excerpt: string }[];
  weakSections: string[];
  suggestions: string[];
};
type Resume = { fileName: string; sizeBytes: number; score: number | null; analysis: ResumeAnalysis | null };
type GapSkill = { skill: string; currentLevel: string; gap: string; priority: string; evidence: { source: string; detail: string }[]; recommendedLearning: string };
type GapAnalysis = { targetRole: string; results: { skills: GapSkill[] } };

export default function ResumeWorkspace() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/resume"), fetch("/api/skill-gap")])
      .then(async ([resumeResponse, gapResponse]) => {
        if (!resumeResponse.ok || !gapResponse.ok) throw new Error("Unable to load your career evidence.");
        const [resumeData, gapData] = await Promise.all([resumeResponse.json(), gapResponse.json()]);
        if (!active) return;
        setResume(resumeData.resume);
        const latest = gapData.analyses[0] as GapAnalysis | undefined;
        if (latest) { setGapAnalysis(latest); setTargetRole(latest.targetRole); }
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load your career evidence."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function readResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Request failed.");
    return data;
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await readResponse(await fetch("/api/resume", { method: "POST", body: form }));
      setResume({ ...data.resume, score: null, analysis: null });
      setMessage("Resume uploaded and text extracted.");
      formElement.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to upload resume."); }
    finally { setBusy(false); }
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const resumeResult = await readResponse(await fetch("/api/resume/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobDescription }),
      }));
      setResume((current) => current ? { ...current, analysis: resumeResult.analysis, score: resumeResult.analysis.compatibilityScore } : current);
      const gapResult = await readResponse(await fetch("/api/skill-gap", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetRole, jobDescription }),
      }));
      setGapAnalysis(gapResult.analysis);
      setMessage("Resume compatibility and skill-gap analysis complete.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to analyze career evidence."); }
    finally { setBusy(false); }
  }

  async function deleteResume() {
    if (!window.confirm("Delete your resume and extracted text?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await readResponse(await fetch("/api/resume", { method: "DELETE" }));
      setResume(null); setGapAnalysis(null); setMessage("Resume deleted.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete resume."); }
    finally { setBusy(false); }
  }

  const card = "rounded-3xl border border-border/60 bg-card/70 p-6";
  const input = "mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm";
  const button = "rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50";

  return (
    <main className="mx-auto max-w-6xl p-6 lg:p-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Career evidence</p>
        <h1 className="mt-2 text-3xl font-semibold">Resume &amp; Skill Gaps</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Analyze your resume against a target role and compare requirements with evidence from your resume, GitHub, interviews, and roadmap.</p>
      </header>

      {loading ? <div className={`${card} mt-8`} aria-live="polite">Loading your career evidence…</div> : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className={card}>
            <h2 className="text-lg font-semibold">Your resume</h2>
            {resume ? (
              <div className="mt-4 rounded-2xl border border-border p-4">
                <p className="break-all text-sm font-medium">{resume.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{(resume.sizeBytes / 1024).toFixed(0)} KB · PDF</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a className="rounded-xl border border-border px-4 py-2 text-sm" href="/api/resume/file">Download PDF</a>
                  <button className="rounded-xl border border-destructive/40 px-4 py-2 text-sm text-destructive" disabled={busy} onClick={deleteResume}>Delete</button>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-muted-foreground">No resume uploaded yet. Upload a text-based PDF to begin.</p>}
            <form onSubmit={upload} className="mt-5 space-y-3">
              <label className="block text-sm">{resume ? "Replace PDF" : "Upload PDF"}<input className={input} type="file" name="resume" accept="application/pdf,.pdf" required /></label>
              <p className="text-xs text-muted-foreground">PDF only · up to 3 MB · up to 30 pages. Scanned image-only PDFs are not supported yet.</p>
              <button className={button} disabled={busy}>{resume ? "Replace resume" : "Upload resume"}</button>
            </form>
            {resume?.analysis && <div className="mt-5 border-t border-border pt-5">
              <h3 className="font-medium">Resume compatibility analysis</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <p>ATS-style compatibility: <strong>{resume.analysis.compatibilityScore === null ? "Add a job description" : `${resume.analysis.compatibilityScore}/100`}</strong></p>
                <p>Keyword coverage: <strong>{resume.analysis.keywordCoverage}%</strong></p>
                <p>Section coverage: <strong>{resume.analysis.sectionCoverage}%</strong></p>
                <p>Skills identified: <strong>{resume.analysis.identifiedSkills.length}</strong></p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{resume.analysis.methodology}</p>
              {!!resume.analysis.matchedKeywords.length && <p className="mt-3 text-sm"><span className="font-medium">Matched:</span> {resume.analysis.matchedKeywords.join(", ")}</p>}
              {!!resume.analysis.missingKeywords.length && <p className="mt-2 text-sm"><span className="font-medium">Not found:</span> {resume.analysis.missingKeywords.join(", ")}</p>}
              {!!resume.analysis.weakSections.length && <p className="mt-2 text-sm"><span className="font-medium">Sections not detected:</span> {resume.analysis.weakSections.join(", ")}</p>}
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{resume.analysis.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul>
            </div>}
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold">Target role analysis</h2>
            <form onSubmit={analyze} className="mt-4 space-y-4">
              <label className="block text-sm">Target role<input className={input} value={targetRole} onChange={(event) => setTargetRole(event.target.value)} maxLength={120} placeholder="e.g. Full-stack engineer" required /></label>
              <label className="block text-sm">Job description<textarea className={`${input} min-h-40 resize-y`} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={20000} placeholder="Paste the job description to identify required skills and keywords." /></label>
              <button className={button} disabled={busy || !resume}>{busy ? "Analyzing…" : "Analyze role fit"}</button>
              {!resume && <p className="text-xs text-muted-foreground">Upload a resume first to establish current evidence.</p>}
            </form>
            {gapAnalysis && <div className="mt-6 space-y-3">
              <h3 className="font-medium">Evidence for {gapAnalysis.targetRole}</h3>
              {gapAnalysis.results.skills.map((skill) => <article key={skill.skill} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-medium">{skill.skill}</h4><span className="text-xs text-muted-foreground">{skill.gap} · {skill.priority} priority</span></div>
                <p className="mt-1 text-sm text-muted-foreground">Current evidence: {skill.currentLevel}</p>
                {skill.evidence.length > 0 && <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{skill.evidence.map((item, index) => <li key={`${item.source}-${index}`}><strong>{item.source}:</strong> {item.detail}</li>)}</ul>}
                <p className="mt-3 text-sm">{skill.recommendedLearning}</p>
              </article>)}
            </div>}
          </section>
        </div>
      )}

      <div className="mt-5" role="status" aria-live="polite">{message && <p className="text-sm text-emerald-600">{message}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
    </main>
  );
}
