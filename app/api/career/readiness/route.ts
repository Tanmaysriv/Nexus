import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { analyzeProject } from "@/lib/project-health";
import { getGitHubRepos } from "@/lib/github";
import {
  analyzeRepositories,
} from "@/lib/repository-analyzer";

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

function clamp(value: number) {
  return Math.max(
    0,
    Math.min(100, Math.round(value))
  );
}

function getReadinessLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Developing";

  return "Needs Improvement";
}

function getRecommendations({
  projectHealth,
  interviewScore,
  technical,
  depth,
  communication,
  projectKnowledge,
}: {
  projectHealth: number;
  interviewScore: number;
  technical: number;
  depth: number;
  communication: number;
  projectKnowledge: number;
}) {
  const recommendations: string[] = [];

  if (projectHealth < 70) {
    recommendations.push(
      "Strengthen your project engineering quality before using it as a flagship portfolio project."
    );
  }

  if (interviewScore < 70) {
    recommendations.push(
      "Practice more technical interview questions and review your previous answers."
    );
  }

  if (technical < 70) {
    recommendations.push(
      "Improve technical depth and be ready to explain implementation decisions."
    );
  }

  if (depth < 70) {
    recommendations.push(
      "Practice explaining architecture, trade-offs, edge cases, and performance decisions."
    );
  }

  if (communication < 70) {
    recommendations.push(
      "Practice concise, structured answers using problem → approach → result."
    );
  }

  if (projectKnowledge < 70) {
    recommendations.push(
      "Review your projects deeply so you can explain architecture, technologies, and design decisions."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Maintain your current level and continue practicing realistic technical interviews."
    );
  }

  return recommendations.slice(0, 5);
}

export async function GET() {
  try {
    /*
     * --------------------------------------------------
     * Interview intelligence
     * --------------------------------------------------
     */

    const sessions =
      await prisma.interviewSession.findMany({
        include: {
          answers: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      });

    const answers = sessions.flatMap(
      (session) => session.answers
    );

    const interviewScore = average(
      answers.map(
        (answer) => answer.overall
      )
    );

    const technical = average(
      answers.map(
        (answer) =>
          answer.technicalCorrectness
      )
    );

    const relevance = average(
      answers.map(
        (answer) => answer.relevance
      )
    );

    const depth = average(
      answers.map(
        (answer) => answer.depth
      )
    );

    const communication = average(
      answers.map(
        (answer) => answer.communication
      )
    );

    const projectKnowledge = average(
      answers.map(
        (answer) =>
          answer.projectKnowledge
      )
    );

    /*
     * --------------------------------------------------
     * Project intelligence
     * --------------------------------------------------
     */

    const repos =
      await getGitHubRepos();

    const activeRepos = repos.filter(
      (repo) =>
        !repo.fork &&
        !repo.archived
    );

    const projectHealthScores: number[] = [];

    const owner =
  process.env.GITHUB_USERNAME ||
  "Tanmaysriv";

const analyses =
  await analyzeRepositories(
    owner,
    activeRepos.map(
      (repo) => repo.name
    )
  );

for (const repo of activeRepos) {
  const signals =
    analyses[repo.name];

  if (!signals) {
    continue;
  }

  const project =
    analyzeProject(
      repo,
      signals
    );

  projectHealthScores.push(
    project.score
  );
}

    const projectHealth =
      average(projectHealthScores);

    /*
     * --------------------------------------------------
     * Career readiness
     * --------------------------------------------------
     *
     * Project Engineering: 40%
     * Interview Performance: 60%
     */

    const readiness = clamp(
      projectHealth * 0.4 +
        interviewScore * 0.6
    );

    const recommendations =
      getRecommendations({
        projectHealth,
        interviewScore,
        technical,
        depth,
        communication,
        projectKnowledge,
      });

    return NextResponse.json({
      readiness: {
        score: readiness,
        label:
          getReadinessLabel(
            readiness
          ),
      },

      projectHealth,

      interview: {
        score: interviewScore,
        technical,
        relevance,
        depth,
        communication,
        projectKnowledge,
        sessions:
          sessions.length,
        questions:
          answers.length,
      },

      recommendations,
    });
  } catch (error) {
    console.error(
      "Career readiness error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate career readiness.",
      },
      {
        status: 500,
      }
    );
  }
}