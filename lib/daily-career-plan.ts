import { prisma } from "@/lib/prisma";

export type DailyPlanItem = {
  id: string;
  type: "interview" | "dsa" | "learning" | "application" | "action" | "roadmap";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  href: string;
};

export async function getDailyCareerPlan(
  userId: string,
): Promise<DailyPlanItem[]> {
  const [applications, learning, dsaEntries, actions] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),

    prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }),

    prisma.dsaEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),

    prisma.careerAction.findMany({
      where: {
        userId,
        status: {
          not: "Completed",
        },
      },
      orderBy: { priority: "desc" },
      take: 10,
    }),
  ]);

  const plan: DailyPlanItem[] = [];

  // 1. Upcoming interviews get the highest priority.
  const upcomingInterview = applications
    .filter((application) => {
      if (!application.interviewAt) return false;

      const date = new Date(application.interviewAt);
      return !Number.isNaN(date.getTime()) && date >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.interviewAt!).getTime() -
        new Date(b.interviewAt!).getTime(),
    )[0];

  if (upcomingInterview) {
    plan.push({
      id: `interview-${upcomingInterview.id}`,
      type: "interview",
      title: "Prepare for your upcoming interview",
      description: `Review the role, projects, and likely interview topics for ${upcomingInterview.company}.`,
      priority: "high",
      href: "/applications",
    });
  }

  // 2. Follow-ups / active applications.
  const followUp = applications.find(
    (application) =>
      application.status === "Applied" ||
      application.status === "Follow-up",
  );

  if (followUp) {
    plan.push({
      id: `application-${followUp.id}`,
      type: "application",
      title: "Follow up on an active application",
      description: `Review the next step for your ${followUp.company} application.`,
      priority: "medium",
      href: "/applications",
    });
  }

  // 3. Weak DSA topics.
  const topicStats = new Map<
    string,
    { solved: number; totalAccuracy: number; count: number }
  >();

  for (const entry of dsaEntries) {
    const topic = entry.topic?.trim();

    if (!topic) continue;

    const current = topicStats.get(topic) ?? {
      solved: 0,
      totalAccuracy: 0,
      count: 0,
    };

    if (entry.isSolved) {
      current.solved += 1;
    }

    if (typeof entry.accuracy === "number") {
      current.totalAccuracy += entry.accuracy;
      current.count += 1;
    }

    topicStats.set(topic, current);
  }

  const weakTopic = [...topicStats.entries()]
    .map(([topic, stats]) => ({
      topic,
      ...stats,
      averageAccuracy:
        stats.count > 0 ? stats.totalAccuracy / stats.count : 100,
    }))
    .filter(
      ({ solved, averageAccuracy }) =>
        solved >= 2 && averageAccuracy < 70,
    )
    .sort((a, b) => a.averageAccuracy - b.averageAccuracy)[0];

  if (weakTopic) {
    plan.push({
      id: `dsa-${weakTopic.topic}`,
      type: "dsa",
      title: `Practice ${weakTopic.topic}`,
      description: `This is currently one of your weaker DSA areas. Solve 2 focused problems today.`,
      priority: "high",
      href: "/dsa",
    });
  }

  // 4. Incomplete learning.
  const incompleteLearning = learning.find(
    (item) => item.status !== "Completed",
  );

  if (incompleteLearning) {
    plan.push({
      id: `learning-${incompleteLearning.id}`,
      type: "learning",
      title: `Continue ${incompleteLearning.skill}`,
      description:
        "Spend focused time improving this skill and record your progress after the session.",
      priority: "medium",
      href: "/learning",
    });
  }

  // 5. Existing career actions.
  const nextAction = actions[0];

  if (nextAction) {
    plan.push({
      id: `action-${nextAction.actionId}`,
      type: "action",
      title: nextAction.title,
      description:
        (nextAction.reason || nextAction.impact || "Complete this career action today."),
      priority:
        nextAction.priority === "High"
          ? "high"
          : nextAction.priority === "Medium"
            ? "medium"
            : "low",
      href: "/dashboard",
    });
  }

  // Keep the daily plan focused.
  return plan.slice(0, 5);
}