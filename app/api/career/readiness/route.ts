import { NextResponse } from "next/server";
import { getCurrentUser, requireApiAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

import { prisma } from "@/lib/prisma";
import { calculateDsaReadinessAccuracy } from "@/lib/dsa-validation";
import { analyzeProject } from "@/lib/project-health";
import { getGitHubAccount, getGitHubRepos, hasGitHubAccount } from "@/lib/github";
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
  projectHealth: number | null;
  interviewScore: number | null;
  technical: number | null;
  depth: number | null;
  communication: number | null;
  projectKnowledge: number | null;
}) {
  const recommendations: string[] = [];

  if (projectHealth !== null && projectHealth < 70) {
    recommendations.push(
      "Strengthen your project engineering quality before using it as a flagship portfolio project."
    );
  }

  if (interviewScore !== null && interviewScore < 70) {
    recommendations.push(
      "Practice more technical interview questions and review your previous answers."
    );
  }

  if (technical !== null && technical < 70) {
    recommendations.push(
      "Improve technical depth and be ready to explain implementation decisions."
    );
  }

  if (depth !== null && depth < 70) {
    recommendations.push(
      "Practice explaining architecture, trade-offs, edge cases, and performance decisions."
    );
  }

  if (communication !== null && communication < 70) {
    recommendations.push(
      "Practice concise, structured answers using problem → approach → result."
    );
  }

  if (projectKnowledge !== null && projectKnowledge < 70) {
    recommendations.push(
      "Review your projects deeply so you can explain architecture, technologies, and design decisions."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Add a resume, connect GitHub, or complete an interview to build an evidence-based readiness profile.");
  }

  return recommendations.slice(0, 5);
}

export async function GET() {
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

    /*
     * --------------------------------------------------
     * Interview intelligence
     * --------------------------------------------------
     */

    const sessions =
      await prisma.interviewSession.findMany({
        where: { userId: user.id },
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

    const repos = await hasGitHubAccount(user.id)
      ? await getGitHubRepos(user.id)
      : [];

    const activeRepos = repos.filter(
      (repo) =>
        !repo.fork &&
        !repo.archived
    );

    const projectHealthScores: number[] = [];

const owner = (await getGitHubAccount(user.id)).login;

const analyses =
  await analyzeRepositories(
      user.id,
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

    const resume = await prisma.resume.findUnique({
      where: { userId: user.id },
      select: { score: true, analysis: true },
    });
    const skillGap = await prisma.skillGapAnalysis.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    const dsaEntries = await prisma.dsaEntry.findMany({
      where: { userId: user.id },
      select: { topic: true, isSolved: true, accuracy: true, attempts: true },
    });
    const solvedDsaEntries = dsaEntries.filter((entry) => entry.isSolved);
    const dsaAccuracy = calculateDsaReadinessAccuracy(solvedDsaEntries);
    const categories = {
      projects: projectHealthScores.length ? projectHealth : null,
      interview: answers.length ? interviewScore : null,
      technicalSkills: answers.length ? technical : null,
      communication: answers.length ? communication : null,
      resume: resume?.score ?? null,
      github: null as number | null,
      dsa: dsaAccuracy,
    };
    const availableScores = Object.values(categories).filter((score): score is number => typeof score === "number");
    const readiness = availableScores.length ? average(availableScores) : null;

    const recommendations =
      getRecommendations({
      projectHealth: projectHealthScores.length ? projectHealth : null,
        interviewScore: answers.length ? interviewScore : null,
        technical: answers.length ? technical : null,
        depth: answers.length ? depth : null,
        communication: answers.length ? communication : null,
        projectKnowledge: answers.length ? projectKnowledge : null,
      });
    if (dsaAccuracy !== null && dsaAccuracy < 70 && solvedDsaEntries.length >= 2) {
      recommendations.unshift("Review your DSA practice notes and revisit topics where your self-reported accuracy is lowest.");
      recommendations.splice(5);
    }

    return NextResponse.json({
      readiness: {
        score: readiness,
        label: readiness === null ? "Not enough data" : getReadinessLabel(readiness),
        calculation: "Unweighted average of available signals only; categories without evidence are omitted.",
      },

      categories,
      evidence: {
        projects: projectHealthScores.length,
        interviewQuestions: answers.length,
        resumeAnalyzed: resume?.score !== null && resume?.score !== undefined,
        skillGapAnalysisAvailable: Boolean(skillGap),
        githubRepositories: activeRepos.length,
        dsaEntries: dsaEntries.length,
        dsaSolvedProblems: solvedDsaEntries.length,
        dsaAttempts: dsaEntries.reduce((total, entry) => total + entry.attempts, 0),
        dsaAccuracySelfReported: solvedDsaEntries.length > 0,
      },
      projectHealth: projectHealthScores.length ? projectHealth : null,

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
    logger.error("Career readiness request failed", { route: "/api/career/readiness", error });

    return NextResponse.json(
      {
        error: "Unable to calculate career readiness.",
      },
      {
        status: 500,
      }
    );
  }
}
