import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { analyzeResume } from "@/lib/resume-analysis";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rateLimit = await checkRateLimit(`resume-analysis:${user.id}`, 10, 60 * 60 * 1000);
  if (rateLimit.serviceUnavailable) return NextResponse.json({ error: "Resume analysis is temporarily unavailable." }, { status: 503 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Analysis limit reached. Try again later." }, { status: 429 });
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const jobDescription = typeof input.jobDescription === "string" ? input.jobDescription.trim() : "";
    if (jobDescription.length > 20_000) return NextResponse.json({ error: "Job description must be 20,000 characters or fewer." }, { status: 400 });
    const resume = await prisma.resume.findUnique({ where: { userId: user.id }, select: { id: true, rawText: true } });
    if (!resume) return NextResponse.json({ error: "Upload a resume before analyzing it." }, { status: 409 });
    const analysis = analyzeResume(resume.rawText, jobDescription);
    await prisma.resume.update({
      where: { id: resume.id, userId: user.id },
      data: { analysis, score: analysis.compatibilityScore },
    });
    return NextResponse.json({ analysis });
  } catch (error) {
    logger.error("Resume analysis failed", { userId: user.id, route: "/api/resume/analyze", error });
    return NextResponse.json({ error: "Unable to analyze resume." }, { status: 500 });
  }
}
