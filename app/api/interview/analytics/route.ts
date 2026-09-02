import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (total, value) => total + value,
      0
    ) / values.length
  );
}

export async function GET() {
  try {
    const sessions =
      await prisma.interviewSession.findMany({
        orderBy: {
          startedAt: "asc",
        },
        include: {
          answers: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    const answers = sessions.flatMap(
      (session) => session.answers
    );

    const scores = {
      overall: average(
        answers.map(
          (answer) => answer.overall
        )
      ),

      technicalCorrectness: average(
        answers.map(
          (answer) =>
            answer.technicalCorrectness
        )
      ),

      relevance: average(
        answers.map(
          (answer) => answer.relevance
        )
      ),

      depth: average(
        answers.map(
          (answer) => answer.depth
        )
      ),

      communication: average(
        answers.map(
          (answer) => answer.communication
        )
      ),

      projectKnowledge: average(
        answers.map(
          (answer) =>
            answer.projectKnowledge
        )
      ),
    };

    const bestScore =
      answers.length > 0
        ? Math.max(
            ...answers.map(
              (answer) => answer.overall
            )
          )
        : 0;

    const projectMap = new Map<
      string,
      {
        scores: number[];
        technical: number[];
        relevance: number[];
        depth: number[];
        communication: number[];
        projectKnowledge: number[];
        questions: number;
      }
    >();

    for (const session of sessions) {
      const existing =
        projectMap.get(session.project) ?? {
          scores: [],
          technical: [],
          relevance: [],
          depth: [],
          communication: [],
          projectKnowledge: [],
          questions: 0,
        };

      for (const answer of session.answers) {
        existing.scores.push(
          answer.overall
        );

        existing.technical.push(
          answer.technicalCorrectness
        );

        existing.relevance.push(
          answer.relevance
        );

        existing.depth.push(
          answer.depth
        );

        existing.communication.push(
          answer.communication
        );

        existing.projectKnowledge.push(
          answer.projectKnowledge
        );

        existing.questions++;
      }

      projectMap.set(
        session.project,
        existing
      );
    }

    const projects = Array.from(
      projectMap.entries()
    ).map(
      ([project, data]) => ({
        project,

        overall: average(data.scores),

        technicalCorrectness:
          average(data.technical),

        relevance: average(
          data.relevance
        ),

        depth: average(data.depth),

        communication: average(
          data.communication
        ),

        projectKnowledge: average(
          data.projectKnowledge
        ),

        questionCount:
          data.questions,
      })
    );

    const progression = sessions
      .filter(
        (session) =>
          session.answers.length > 0
      )
      .map((session) => ({
        sessionId: session.id,
        project: session.project,
        date:
          session.startedAt.toISOString(),
        score: average(
          session.answers.map(
            (answer) => answer.overall
          )
        ),
        questionCount:
          session.answers.length,
      }));

    const dimensions = [
      {
        key: "technicalCorrectness",
        label: "Technical Correctness",
        score: scores.technicalCorrectness,
      },
      {
        key: "relevance",
        label: "Relevance",
        score: scores.relevance,
      },
      {
        key: "depth",
        label: "Depth",
        score: scores.depth,
      },
      {
        key: "communication",
        label: "Communication",
        score: scores.communication,
      },
      {
        key: "projectKnowledge",
        label: "Project Knowledge",
        score: scores.projectKnowledge,
      },
    ];

    const weakestAreas = [
      ...dimensions,
    ]
      .sort(
        (a, b) =>
          a.score - b.score
      )
      .slice(0, 3);

    const strongestAreas = [
      ...dimensions,
    ]
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 3);

    return NextResponse.json({
      summary: {
        totalInterviews:
          sessions.length,

        totalQuestions:
          answers.length,

        averageScore:
          scores.overall,

        bestScore,
      },

      scores,

      dimensions,

      weakestAreas,

      strongestAreas,

      progression,

      projects,
    });
  } catch (error) {
    console.error(
      "Interview analytics error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load interview analytics.",
      },
      {
        status: 500,
      }
    );
  }
}