import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions =
      await prisma.interviewSession.findMany({
        orderBy: {
          startedAt: "desc",
        },
        include: {
          answers: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              question: true,
              category: true,
              difficulty: true,
              overall: true,
              technicalCorrectness: true,
              relevance: true,
              depth: true,
              communication: true,
              projectKnowledge: true,
              verdict: true,
              createdAt: true,
            },
          },
        },
      });

    const history = sessions.map((session) => {
      const answers = session.answers;

      const average = (
        field:
          | "overall"
          | "technicalCorrectness"
          | "relevance"
          | "depth"
          | "communication"
          | "projectKnowledge"
      ) => {
        if (answers.length === 0) {
          return 0;
        }

        return Math.round(
          answers.reduce(
            (total, answer) =>
              total + answer[field],
            0
          ) / answers.length
        );
      };

      return {
        id: session.id,
        project: session.project,
        category: session.category,
        startedAt: session.startedAt,
        endedAt: session.endedAt,

        questionCount: answers.length,

        overall: average("overall"),
        technicalCorrectness: average(
          "technicalCorrectness"
        ),
        relevance: average("relevance"),
        depth: average("depth"),
        communication: average(
          "communication"
        ),
        projectKnowledge: average(
          "projectKnowledge"
        ),

        answers,
      };
    });

    return NextResponse.json({
      history,
    });
  } catch (error) {
    console.error(
      "Interview history error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load interview history.",
      },
      { status: 500 }
    );
  }
}