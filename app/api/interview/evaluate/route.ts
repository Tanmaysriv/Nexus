import { NextResponse } from "next/server";

import {
  evaluateInterviewAnswer,
} from "@/lib/ai-interviewer";

import {
  getCachedRepositoryAnalysis,
} from "@/lib/github-cache";

import { prisma } from "@/lib/prisma";

type RequestBody = {
  projectName: string;
  sessionId?: string;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const {
      projectName,
      sessionId,
      question,
      answer,
      category,
      difficulty,
    } = body;

    if (!projectName) {
      return NextResponse.json(
        {
          error: "Project name is required.",
        },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json(
        {
          error: "Question is required.",
        },
        { status: 400 }
      );
    }

    if (!answer?.trim()) {
      return NextResponse.json(
        {
          error: "Answer is required.",
        },
        { status: 400 }
      );
    }

    const owner =
      process.env.GITHUB_USERNAME ||
      "Tanmaysriv";

    const signals =
      await getCachedRepositoryAnalysis(
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
    console.error(
      "❌ Interview API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to evaluate answer.",
      },
      { status: 500 }
    );
  }
}