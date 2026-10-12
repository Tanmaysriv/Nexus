import { NextResponse } from "next/server";
import { getCurrentUser, requireApiAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getOrCreateCareerRoadmap } from "@/lib/career-roadmap";

import { prisma } from "@/lib/prisma";
import { getGitHubRepos, hasGitHubAccount } from "@/lib/github";

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

    const sessions =
      await prisma.interviewSession.findMany(
        {
          where: { userId: user.id },
          include: {
            answers: true,
          },
        }
      );

    const answers =
      sessions.flatMap(
        (session) =>
          session.answers
      );

    const interviewScore =
      answers.length > 0
        ? Math.round(
            answers.reduce(
              (total, answer) =>
                total +
                answer.overall,
              0
            ) /
              answers.length
          )
        : 0;

    const repos = await hasGitHubAccount(user.id)
      ? await getGitHubRepos(user.id)
      : [];

    const activeRepos =
      repos.filter(
        (repo) =>
          !repo.fork &&
          !repo.archived
      );

    const roadmap = await getOrCreateCareerRoadmap(
      user.id,
      "software-engineer",
    );

    const estimatedWeeks =
      roadmap.items.length === 0
        ? 0
        : roadmap.items.length <= 3
          ? 6
          : roadmap.items.length <= 5
            ? 10
            : 14;
    return NextResponse.json({
      targetRole:
        roadmap.role,

      currentInterviewScore:
        interviewScore,

      repositoryCount:
        activeRepos.length,

      roadmap: {
        estimatedWeeks,

        items: roadmap.items,
      },

      nextAction:
        roadmap.items.length > 0
          ? `Start with ${roadmap.items[0].skill}.`
          : "Create a skill gap analysis from a resume and target job description to build an evidence-based roadmap.",
    });
  } catch (error) {
    logger.error("Career roadmap request failed", { route: "/api/career/roadmap", error });

    return NextResponse.json(
      {
        error: "Unable to generate career roadmap.",
      },
      {
        status: 500,
      }
    );
  }
}
