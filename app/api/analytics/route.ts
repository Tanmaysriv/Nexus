import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const [skillGaps, sessions, dsaEntries, roadmaps, applications, githubAccount] = await Promise.all([
      prisma.skillGapAnalysis.findMany({
        where: { userId: user.id },
        select: { targetRole: true, currentSkills: true, requiredSkills: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.interviewSession.findMany({
        where: { userId: user.id },
        select: { createdAt: true, answers: { select: { overall: true, createdAt: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.dsaEntry.findMany({
        where: { userId: user.id },
        select: { topic: true, difficulty: true, isSolved: true, solvedAt: true, updatedAt: true },
      }),
      prisma.careerRoadmap.findMany({
        where: { userId: user.id },
        select: { items: { select: { completed: true, progress: true } } },
      }),
      prisma.application.findMany({
        where: { userId: user.id },
        select: { status: true, createdAt: true, interviewAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.gitHubAccount.findUnique({ where: { userId: user.id }, select: { id: true } }),
    ]);

    const monthSet = new Set<string>();
    for (const date of [
      ...skillGaps.map((item) => item.createdAt),
      ...sessions.map((item) => item.createdAt),
      ...sessions.flatMap((item) => item.answers.map((answer) => answer.createdAt)),
      ...dsaEntries.filter((item) => item.isSolved && item.solvedAt).map((item) => item.solvedAt!),
      ...applications.map((item) => item.createdAt),
    ]) monthSet.add(monthKey(date));

    const timeline = [...monthSet].sort().slice(-12).map((month) => {
      const sessionAnswers = sessions.flatMap((session) => session.answers)
        .filter((answer) => monthKey(answer.createdAt) === month);
      const solved = dsaEntries.filter((entry) => entry.isSolved && entry.solvedAt && monthKey(entry.solvedAt) === month).length;
      const newApplications = applications.filter((application) => monthKey(application.createdAt) === month).length;
      const newSkillAnalyses = skillGaps.filter((analysis) => monthKey(analysis.createdAt) === month).length;
      return {
        month,
        interviewScore: sessionAnswers.length
          ? Math.round(sessionAnswers.reduce((sum, answer) => sum + answer.overall, 0) / sessionAnswers.length)
          : null,
        interviewEvaluations: sessionAnswers.length,
        dsaSolved: solved,
        applications: newApplications,
        skillAnalyses: newSkillAnalyses,
      };
    });

    const roadmapItems = roadmaps.flatMap((roadmap) => roadmap.items);
    const answers = sessions.flatMap((session) => session.answers);
    const statusCounts: Record<string, number> = {};
    for (const application of applications) statusCounts[application.status] = (statusCounts[application.status] ?? 0) + 1;
    const topics = [...new Set(dsaEntries.map((entry) => entry.topic))].map((topic) => {
      const entries = dsaEntries.filter((entry) => entry.topic === topic);
      return { topic, total: entries.length, solved: entries.filter((entry) => entry.isSolved).length };
    }).sort((a, b) => a.topic.localeCompare(b.topic));

    return NextResponse.json({
      summary: {
        interviewEvaluations: answers.length,
        averageInterviewScore: answers.length ? Math.round(answers.reduce((sum, answer) => sum + answer.overall, 0) / answers.length) : null,
        dsaSolved: dsaEntries.filter((entry) => entry.isSolved).length,
        dsaTracked: dsaEntries.length,
        roadmapCompleted: roadmapItems.filter((item) => item.completed).length,
        roadmapTotal: roadmapItems.length,
        applications: applications.length,
        interviewsScheduled: applications.filter((item) => item.status === "INTERVIEW" || item.interviewAt !== null).length,
        skillAnalyses: skillGaps.length,
      },
      timeline,
      topics,
      applicationsByStatus: statusCounts,
      integrations: { githubConnected: Boolean(githubAccount) },
      availability: {
        readinessHistory: false,
        githubActivityHistory: false,
        note: "Readiness and GitHub activity history are not stored yet. No historical values are estimated.",
      },
    });
  } catch (error) {
    logger.error("Career analytics request failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to load career analytics." }, { status: 500 });
  }
}
