import { NextResponse } from "next/server";
import { getCurrentUser, requireApiAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

import {
  evaluateInterviewAnswer,
} from "@/lib/ai-interviewer";

import {
  getCachedRepositoryAnalysis,
} from "@/lib/github-cache";

import { prisma } from "@/lib/prisma";
import { getGitHubAccount } from "@/lib/github";
import { checkRateLimit } from "@/lib/rate-limit";

type RequestBody = {
  projectName: string;
  sessionId?: string;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
};

export async function POST(request: Request) {
  const authError = await requireApiAuth();

  if (authError) {
    return authError;
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const limit = await checkRateLimit(`interview-evaluate:${user.id}`, 10, 15 * 60 * 1000);
    if (limit.serviceUnavailable) return NextResponse.json({ error: "Interview evaluation is temporarily unavailable." }, { status: 503, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    if (!limit.allowed) return NextResponse.json({ error: "Interview evaluation limit reached. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

    let parsed: unknown;
    try { parsed = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const body = parsed as RequestBody;

    const {
      projectName,
      sessionId,
      question,
      answer,
      category,
      difficulty,
    } = body;

    if (typeof projectName !== "string" || !projectName.trim() || projectName.length > 100) {
      return NextResponse.json(
        {
          error: "Project name is required.",
        },
        { status: 400 }
      );
    }

    if (typeof question !== "string" || !question.trim() || question.length > 4000) {
      return NextResponse.json(
        {
          error: "Question is required.",
        },
        { status: 400 }
      );
    }

    if (typeof answer !== "string" || !answer.trim() || answer.length > 12000) {
      return NextResponse.json(
        {
          error: "Answer is required.",
        },
        { status: 400 }
      );
    }

    const owner = (await getGitHubAccount(user.id)).login;

    if (sessionId) {
      const ownedSession = await prisma.interviewSession.findFirst({
        where: { id: sessionId, userId: user.id },
        select: { id: true },
      });
      if (!ownedSession) {
        return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
      }
    }

    const signals =
      await getCachedRepositoryAnalysis(
        user.id,
        owner,
        projectName
      );

    /*
     * Gemini evaluation
     */

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured.",
        },
        { status: 500 }
      );
    }

    const evaluation =
      await evaluateInterviewAnswer({
        projectName,
        question,
        answer,
        category,
        difficulty,
        signals,
      });

    /*
     * Create a session if this is the
     * first answer.
     */

    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const session =
        await prisma.interviewSession.create({
          data: {
            project: projectName,
            category,
            userId: user.id,
          },
        });

      activeSessionId = session.id;
    }

    /*
     * Save the evaluated answer.
     */

    const savedAnswer =
      await prisma.interviewAnswer.create({
        data: {
          sessionId: activeSessionId,

          question,
          answer,
          category,
          difficulty,

          overall: evaluation.overall,

          technicalCorrectness:
            evaluation.technicalCorrectness,

          relevance:
            evaluation.relevance,

          depth:
            evaluation.depth,

          communication:
            evaluation.communication,

          projectKnowledge:
            evaluation.projectKnowledge,

          verdict:
            evaluation.verdict,

          strengths:
            evaluation.strengths,

          missingConcepts:
            evaluation.missingConcepts,

          improvements:
            evaluation.improvements,

          idealAnswer:
            evaluation.idealAnswer,

          followUpQuestion:
            evaluation.followUpQuestion,
        },
      });

    /*
     * Return the same evaluation to the UI,
     * plus database identifiers.
     */

    return NextResponse.json({
      ...evaluation,
      sessionId: activeSessionId,
      answerId: savedAnswer.id,
    });
  } catch (error) {
    logger.error("Interview API error", {
      error,
    });

    return NextResponse.json(
      {
        error: "Unable to evaluate answer.",
      },
      { status: 500 }
    );
  }
}
