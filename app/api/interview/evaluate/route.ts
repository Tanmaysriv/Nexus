import { NextResponse } from "next/server";
import {
  evaluateInterviewAnswer,
} from "@/lib/ai-interviewer";

import {
  getCachedRepositoryAnalysis,
} from "@/lib/github-cache";

export async function POST(request: Request) {
  console.log(
    "🔥 GEMINI KEY LOADED:",
    Boolean(process.env.GEMINI_API_KEY)
  );

  try {
    const body = await request.json();

    const {
      projectName,
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

    console.log(
      "🔥 Loading repository signals..."
    );

    const signals =
      await getCachedRepositoryAnalysis(
        owner,
        projectName
      );

    /*
     * Gemini evaluation
     */
    if (process.env.GEMINI_API_KEY) {
      console.log(
        "🔥 ENTERING GEMINI EVALUATOR"
      );

      try {
        const evaluation =
          await evaluateInterviewAnswer({
            projectName,
            question,
            answer,
            category,
            difficulty,
            signals,
          });

        console.log(
          "🔥 GEMINI SUCCESS"
        );

        return NextResponse.json(
          evaluation
        );
      } catch (error) {
        console.error(
          "🔥 GEMINI ERROR:",
          error
        );

        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Gemini evaluation failed.",
          },
          { status: 500 }
        );
      }
    }

    /*
     * Gemini key missing.
     */
    console.error(
      "❌ GEMINI_API_KEY is missing."
    );

    return NextResponse.json(
      {
        error:
          "Gemini API key is not configured.",
      },
      { status: 500 }
    );
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