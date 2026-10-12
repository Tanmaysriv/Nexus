import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getNexusContext } from "@/lib/nexus-context";
import { extractResumeSkills, SKILL_PATTERNS } from "@/lib/resume-analysis";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

function matches(text: string, skill: string) {
  return SKILL_PATTERNS[skill]?.test(text) ?? false;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const analyses = await prisma.skillGapAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ analyses });
  } catch (error) {
    logger.error("Skill gap history load failed", { userId: user.id, route: "/api/skill-gap", error });
    return NextResponse.json({ error: "Unable to load skill gap analyses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rateLimit = await checkRateLimit(`skill-gap:${user.id}`, 10, 60 * 60 * 1000);
  if (rateLimit.serviceUnavailable) return NextResponse.json({ error: "Skill gap analysis is temporarily unavailable." }, { status: 503, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Analysis limit reached. Try again later." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });

  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const targetRole = typeof input.targetRole === "string" ? input.targetRole.trim() : "";
    const jobDescription = typeof input.jobDescription === "string" ? input.jobDescription.trim() : "";
    if (!targetRole || targetRole.length > 120) return NextResponse.json({ error: "Enter a target role of 1 to 120 characters." }, { status: 400 });
    if (!jobDescription) return NextResponse.json({ error: "Add a job description to identify required skills." }, { status: 400 });
    if (jobDescription.length > 20_000) return NextResponse.json({ error: "Job description must be 20,000 characters or fewer." }, { status: 400 });

    const resume = await prisma.resume.findUnique({ where: { userId: user.id }, select: { rawText: true } });
    if (!resume) return NextResponse.json({ error: "Upload a resume to establish current skill evidence." }, { status: 409 });
    const requiredSkills = Object.entries(SKILL_PATTERNS)
      .filter(([, pattern]) => pattern.test(jobDescription))
      .map(([skill]) => skill);
    if (!requiredSkills.length) {
      return NextResponse.json({ error: "Add a job description that mentions skills from the supported evidence catalog." }, { status: 400 });
    }

    const [context, sessions, roadmap] = await Promise.all([
      getNexusContext(user.id),
      prisma.interviewSession.findMany({
        where: { userId: user.id },
        select: { project: true, answers: { select: { question: true, answer: true, missingConcepts: true, overall: true } } },
        orderBy: { startedAt: "desc" },
        take: 25,
      }),
      prisma.careerRoadmap.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { items: { select: { skill: true, progress: true, completed: true } } },
      }),
    ]);
    const resumeEvidence = extractResumeSkills(resume.rawText);

    const skills = requiredSkills.map((skill) => {
      const evidence: { source: string; detail: string }[] = [];
      if (resumeEvidence.some((entry) => entry.skill === skill)) {
        evidence.push({ source: "Resume", detail: `Resume text contains evidence for ${skill}.` });
      }
      for (const project of context.projects.projects) {
        if (project.technologies.some((technology) => matches(technology, skill)) || (skill === "Python" && /python/i.test(project.technologies.join(" ")))) {
          evidence.push({ source: "GitHub", detail: `Repository ${project.name} reports ${skill} in its analyzed technology signals.` });
        }
      }
      for (const session of sessions) {
        for (const answer of session.answers) {
          const text = `${answer.question} ${answer.answer}`;
          if (matches(text, skill) || answer.missingConcepts.some((concept) => matches(concept, skill))) {
            evidence.push({ source: "Interview", detail: answer.missingConcepts.some((concept) => matches(concept, skill))
              ? `Interview feedback identified ${skill} as a missing concept (${answer.overall}/100 overall answer rating).`
              : `An interview response mentioned ${skill} (${answer.overall}/100 overall answer rating).` });
          }
        }
      }
      const roadmapItem = roadmap?.items.find((item) => item.skill.toLowerCase() === skill.toLowerCase());
      if (roadmapItem) evidence.push({ source: "Roadmap", detail: `Roadmap task is ${roadmapItem.completed ? "completed" : `${roadmapItem.progress}% complete`}; this is learning activity, not independent proof of proficiency.` });
      const gap = evidence.some((item) => item.source === "Resume" || item.source === "GitHub") ? "Evidence found" : "No direct evidence found";
      const frequency = jobDescription.match(new RegExp(SKILL_PATTERNS[skill].source, "ig"))?.length ?? 0;
      const priority = gap === "No direct evidence found" && frequency > 1 ? "High" : gap === "No direct evidence found" ? "Medium" : "Low";
      return {
        skill,
        required: true,
        currentLevel: evidence.some((item) => item.source === "Resume" || item.source === "GitHub") ? "Evidence found" : evidence.length ? "Mentioned; needs validation" : "No evidence",
        gap,
        priority,
        evidence,
        recommendedLearning: gap === "No direct evidence found"
          ? `Build a focused project or complete a practice task demonstrating ${skill}; add it to your resume only when you have verifiable evidence.`
          : `Keep the ${skill} evidence current and prepare to explain your contribution and trade-offs.`,
      };
    });

    const result = await prisma.skillGapAnalysis.create({
      data: {
        userId: user.id,
        targetRole,
        jobDescription: jobDescription || null,
        requiredSkills,
        currentSkills: skills.filter((item) => item.gap === "Evidence found").map((item) => item.skill),
        results: { skills, evidenceSources: ["Resume", "GitHub repositories", "Interview feedback", "Roadmap activity"] },
      },
    });
    return NextResponse.json({ analysis: result }, { status: 201 });
  } catch (error) {
    logger.error("Skill gap analysis failed", { userId: user.id, route: "/api/skill-gap", error });
    return NextResponse.json({ error: "Unable to calculate skill gaps." }, { status: 500 });
  }
}
