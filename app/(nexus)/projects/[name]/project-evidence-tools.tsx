"use client";

import { useState } from "react";
import Link from "next/link";
import { createProjectEvidenceDrafts } from "@/lib/project-evidence-drafts";
import type { RepositorySignals } from "@/lib/project-health";

export default function ProjectEvidenceTools({
  name,
  description,
  signals,
  improvements,
}: {
  name: string;
  description: string | null;
  signals: RepositorySignals;
  improvements: string[];
}) {
  const [contribution, setContribution] = useState("");
  const [drafts, setDrafts] = useState<ReturnType<typeof createProjectEvidenceDrafts> | null>(null);
  const inputClass = "mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const fieldClass = "rounded-xl border bg-background p-4";

  return <section className="mb-8 rounded-2xl border bg-card p-6">
    <h2 className="text-xl font-semibold">Project evidence tools</h2>
    <p className="mt-1 text-sm text-muted-foreground">Draft career materials from detected repository signals and the contribution details you provide. Review each draft before using it.</p>
    <label className="mt-4 block text-sm font-medium">What did you personally build or contribute?<textarea rows={3} maxLength={2000} className={inputClass} placeholder="Describe your actual work, decisions, or results. Add metrics only if you can verify them." value={contribution} onChange={(event) => setContribution(event.target.value)} /></label>
    <button type="button" onClick={() => setDrafts(createProjectEvidenceDrafts({ name, description, contribution, signals }))} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Generate project drafts</button>
    {drafts && <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className={fieldClass}><h3 className="font-semibold">Resume bullet draft</h3><p className="mt-2 text-sm leading-6">{drafts.resumeBullet}</p></div>
      <div className={fieldClass}><h3 className="font-semibold">Project explanation</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{drafts.projectExplanation}</p></div>
      <div className={fieldClass}><h3 className="font-semibold">Architecture explanation</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{drafts.architectureExplanation}</p></div>
      <div className={fieldClass}><h3 className="font-semibold">Improvement plan</h3>{improvements.length ? <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6">{improvements.map((item) => <li key={item}>{item}</li>)}</ol> : <p className="mt-2 text-sm text-muted-foreground">No improvements were identified by the current repository health analysis.</p>}</div>
    </div>}
    <div className="mt-5 border-t pt-4"><h3 className="text-sm font-semibold">Project interview questions</h3><p className="mt-1 text-sm text-muted-foreground">The interview coach generates questions from this repository’s detected technologies and engineering signals.</p><Link href={`/projects/${encodeURIComponent(name)}/interview`} className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm">Open project interview coach</Link></div>
  </section>;
}
